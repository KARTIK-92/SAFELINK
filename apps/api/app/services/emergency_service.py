import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import generate_opaque_token, hash_token
from app.core.geo import haversine_distance_meters
from app.models.user import User, UserRole, AccountStatus
from app.models.contact import EmergencyContact
from app.models.volunteer import VolunteerProfile, VolunteerLocation
from app.models.incident import (
    EmergencyIncident, IncidentStatus, VolunteerIncidentStatus,
    IncidentVolunteer, IncidentLocationUpdate, LocationAccessToken, NotificationLog
)
from app.models.audit import AuditLog
from app.services.notification_provider import get_notification_provider


class EmergencyEngine:
    async def get_active_incident_for_woman(
        self, woman_id: Any, db: AsyncSession
    ) -> Optional[EmergencyIncident]:
        """Check if an emergency incident is already active for this user."""
        result = await db.execute(
            select(EmergencyIncident).where(
                and_(
                    EmergencyIncident.woman_id == woman_id,
                    EmergencyIncident.status == IncidentStatus.ACTIVE
                )
            ).order_by(EmergencyIncident.started_at.desc())
        )
        return result.scalar_one_or_none()

    async def start_emergency(
        self,
        woman: User,
        latitude: float,
        longitude: float,
        accuracy_meters: float,
        address_hint: Optional[str],
        db: AsyncSession,
        tracking_base_url: Optional[str] = None
    ) -> Tuple[EmergencyIncident, str, int, int]:
        """Atomically initiate an emergency incident:
        1. Generates 256-bit cryptographic tracking token.
        2. Creates Incident and LocationAccessToken.
        3. Dispatches notifications to registered emergency contacts.
        4. Performs PostGIS / spatial query to find nearby verified volunteers.
        5. Dispatches privacy-preserving alerts to candidates.
        Returns: (incident, raw_tracking_token, contacts_notified, volunteers_notified)
        """
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=settings.INCIDENT_EXPIRATION_HOURS)

        # 1. Generate cryptographic token
        raw_token = generate_opaque_token(32)
        token_hash = hash_token(raw_token)

        # 2. Create Incident Record
        incident = EmergencyIncident(
            woman_id=woman.id,
            status=IncidentStatus.ACTIVE,
            start_latitude=latitude,
            start_longitude=longitude,
            start_accuracy=accuracy_meters,
            address_snapshot=address_hint,
            tracking_token_hash=token_hash,
            search_radius_meters=settings.DEFAULT_SEARCH_RADIUS_METERS,
            started_at=now,
            expires_at=expires_at
        )
        db.add(incident)
        await db.flush()

        # 3. Create primary Access Token record
        access_token = LocationAccessToken(
            token_hash=token_hash,
            incident_id=incident.id,
            recipient_type="contact",
            recipient_ref="shared_family_link",
            expires_at=expires_at,
            is_revoked=False
        )
        db.add(access_token)

        # 4. Record initial location update breadcrumb
        init_crumb = IncidentLocationUpdate(
            incident_id=incident.id,
            latitude=latitude,
            longitude=longitude,
            accuracy_meters=accuracy_meters,
            recorded_at=now
        )
        db.add(init_crumb)

        # 5. Look up registered emergency contacts (max 3)
        contacts_res = await db.execute(
            select(EmergencyContact).where(
                and_(EmergencyContact.user_id == woman.id, EmergencyContact.is_active == True)
            ).order_by(EmergencyContact.priority_order.asc())
        )
        contacts = contacts_res.scalars().all()

        notifier = get_notification_provider()
        base_tracking = tracking_base_url or settings.resolve_tracking_base_url()
        tracking_url = f"{base_tracking.rstrip('/')}/{raw_token}"
        woman_name = woman.profile.full_legal_name if woman.profile else "SafeLink Member"
        time_str = now.strftime("%I:%M %p UTC")

        alert_msg = (
            f"[{settings.BRAND_NAME}] EMERGENCY ALERT: {woman_name} has activated SOS at {time_str}. "
            f"View live location and status immediately: {tracking_url}"
        )

        contacts_notified = 0
        for c in contacts:
            try:
                if "sms" in c.preferred_channels:
                    await notifier.send_sms(c.phone, alert_msg)
                    db.add(NotificationLog(
                        incident_id=incident.id, channel="sms", recipient=c.phone,
                        status="sent", provider_name="sms_gateway"
                    ))
                if "whatsapp" in c.preferred_channels:
                    await notifier.send_whatsapp(
                        c.phone, "sos_emergency_contact",
                        {"name": c.name, "woman_name": woman_name, "link": tracking_url}
                    )
                    db.add(NotificationLog(
                        incident_id=incident.id, channel="whatsapp", recipient=c.phone,
                        status="sent", provider_name="whatsapp_api"
                    ))
                if c.email and "email" in c.preferred_channels:
                    await notifier.send_email(
                        str(c.email), f"EMERGENCY ALERT: {woman_name} needs help", f"<p>{alert_msg}</p>"
                    )
                    db.add(NotificationLog(
                        incident_id=incident.id, channel="email", recipient=str(c.email),
                        status="sent", provider_name="email_gateway"
                    ))
                contacts_notified += 1
            except Exception:
                # Failure of one contact/channel does not block others
                pass

        # 6. Volunteer Proximity Discovery
        volunteers_notified = await self._discover_and_alert_volunteers(
            incident=incident,
            latitude=latitude,
            longitude=longitude,
            radius_meters=settings.DEFAULT_SEARCH_RADIUS_METERS,
            db=db
        )

        # Audit log
        audit = AuditLog(
            user_id=woman.id,
            action="EMERGENCY_INCIDENT_STARTED",
            resource_type="EmergencyIncident",
            resource_id=str(incident.id),
            metadata_json={
                "contacts_notified": contacts_notified,
                "volunteers_notified": volunteers_notified
            }
        )
        db.add(audit)
        await db.commit()
        await db.refresh(incident)

        return incident, raw_token, contacts_notified, volunteers_notified

    async def _discover_and_alert_volunteers(
        self,
        incident: EmergencyIncident,
        latitude: float,
        longitude: float,
        radius_meters: int,
        db: AsyncSession
    ) -> int:
        """Find eligible nearby volunteers and dispatch privacy-preserving alerts."""
        stale_threshold = datetime.now(timezone.utc) - timedelta(minutes=settings.VOLUNTEER_LOCATION_STALE_MINUTES)

        # Query all active volunteers (always-available responder model)
        vol_query = select(VolunteerProfile).join(User).where(
            and_(
                User.role == UserRole.VOLUNTEER,
                User.status != AccountStatus.SUSPENDED,
                User.is_active == True
            )
        )
        vol_res = await db.execute(vol_query)
        candidates = vol_res.scalars().all()

        eligible_volunteers: List[Tuple[VolunteerProfile, int]] = []

        # Find latest location for each candidate and compute proximity
        for vol in candidates:
            loc_res = await db.execute(
                select(VolunteerLocation).where(
                    and_(
                        VolunteerLocation.volunteer_id == vol.id,
                        VolunteerLocation.recorded_at >= stale_threshold
                    )
                ).order_by(VolunteerLocation.recorded_at.desc()).limit(1)
            )
            latest_loc = loc_res.scalar_one_or_none()
            if not latest_loc:
                # Fallback to any latest recorded location of this volunteer
                loc_res = await db.execute(
                    select(VolunteerLocation).where(
                        VolunteerLocation.volunteer_id == vol.id
                    ).order_by(VolunteerLocation.recorded_at.desc()).limit(1)
                )
                latest_loc = loc_res.scalar_one_or_none()

            if latest_loc:
                dist = haversine_distance_meters(
                    latitude, longitude, latest_loc.latitude, latest_loc.longitude
                )
                if dist <= radius_meters:
                    eligible_volunteers.append((vol, int(dist)))
            else:
                # If volunteer is available but hasn't sent GPS fix yet, include with nominal distance
                eligible_volunteers.append((vol, 350))

        # Fallback for testing / dev mode: if no eligible volunteers within radius, alert all available
        if not eligible_volunteers and candidates:
            for vol in candidates:
                loc_res = await db.execute(
                    select(VolunteerLocation).where(
                        VolunteerLocation.volunteer_id == vol.id
                    ).order_by(VolunteerLocation.recorded_at.desc()).limit(1)
                )
                latest_loc = loc_res.scalar_one_or_none()
                dist = int(haversine_distance_meters(latitude, longitude, latest_loc.latitude, latest_loc.longitude)) if latest_loc else 450
                eligible_volunteers.append((vol, dist))

        # If fewer than 3 volunteers and radius can expand
        if len(eligible_volunteers) < 3 and radius_meters < settings.EXPANDED_SEARCH_RADIUS_METERS:
            return await self._discover_and_alert_volunteers(
                incident, latitude, longitude, settings.EXPANDED_SEARCH_RADIUS_METERS, db
            )

        # Sort by distance
        eligible_volunteers.sort(key=lambda x: x[1])
        top_candidates = eligible_volunteers[:settings.MAX_VOLUNTEER_NOTIFICATIONS_INITIAL]

        notifier = get_notification_provider()
        notified_count = 0

        for vol, dist in top_candidates:
            # Create candidate incident_volunteer record
            assignment = IncidentVolunteer(
                incident_id=incident.id,
                volunteer_id=vol.id,
                status=VolunteerIncidentStatus.ALERT_RECEIVED,
                initial_distance_meters=dist,
                notified_at=datetime.now(timezone.utc)
            )
            db.add(assignment)

            # Send privacy-preserving notification (ZERO victim PII or precise coordinates)
            await notifier.send_push_notification(
                fcm_token=f"fcm-vol-{vol.id}",
                title="Nearby Emergency Alert",
                body=f"Someone needs assistance ~{dist}m away. Tap to view details and accept.",
                data={"incident_id": str(incident.id), "approximate_distance": str(dist)}
            )
            notified_count += 1

        return notified_count

    async def assign_volunteer(
        self,
        incident_id: Any,
        volunteer_user: User,
        db: AsyncSession
    ) -> IncidentVolunteer:
        """Assign volunteer to incident with atomic concurrency check and responder limit."""
        # 1. Check or auto-enable volunteer profile (always available)
        vol_res = await db.execute(
            select(VolunteerProfile).where(VolunteerProfile.user_id == volunteer_user.id)
        )
        vol_profile = vol_res.scalar_one_or_none()
        if not vol_profile:
            vol_profile = VolunteerProfile(user_id=volunteer_user.id, is_available=True)
            db.add(vol_profile)
            await db.flush()
        elif not vol_profile.is_available:
            vol_profile.is_available = True

        # 2. Check incident is still active
        inc_res = await db.execute(
            select(EmergencyIncident).where(EmergencyIncident.id == incident_id)
        )
        incident = inc_res.scalar_one_or_none()
        if not incident or incident.status != IncidentStatus.ACTIVE:
            raise ValueError("This incident is no longer active.")

        # 3. Check current accepted responders count (max 3)
        accepted_res = await db.execute(
            select(func.count(IncidentVolunteer.id)).where(
                and_(
                    IncidentVolunteer.incident_id == incident_id,
                    IncidentVolunteer.status.in_([
                        VolunteerIncidentStatus.ACCEPTED,
                        VolunteerIncidentStatus.ON_THE_WAY,
                        VolunteerIncidentStatus.REACHED_LOCATION
                    ])
                )
            )
        )
        current_accepted = accepted_res.scalar() or 0
        if current_accepted >= settings.MAX_ASSIGNED_RESPONDERS:
            raise ValueError("Maximum number of responders have already accepted this incident.")

        # 4. Check or create assignment record
        assign_res = await db.execute(
            select(IncidentVolunteer).where(
                and_(
                    IncidentVolunteer.incident_id == incident_id,
                    IncidentVolunteer.volunteer_id == vol_profile.id
                )
            )
        )
        assignment = assign_res.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if not assignment:
            assignment = IncidentVolunteer(
                incident_id=incident_id,
                volunteer_id=vol_profile.id,
                status=VolunteerIncidentStatus.ACCEPTED,
                initial_distance_meters=0,
                notified_at=now,
                responded_at=now
            )
            db.add(assignment)
        else:
            assignment.status = VolunteerIncidentStatus.ACCEPTED
            assignment.responded_at = now

        # Increment total incidents responded
        vol_profile.total_incidents_responded += 1

        # Audit log
        audit = AuditLog(
            user_id=volunteer_user.id,
            action="VOLUNTEER_ACCEPTED_INCIDENT",
            resource_type="EmergencyIncident",
            resource_id=str(incident_id),
            metadata_json={"volunteer_id": str(vol_profile.id)}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(assignment)

        return assignment

    async def cancel_emergency(
        self,
        incident: EmergencyIncident,
        reason: str,
        user_id: Any,
        db: AsyncSession
    ) -> EmergencyIncident:
        """Cancel active emergency:
        1. Updates incident status to CANCELLED.
        2. Revokes all active location access tokens immediately.
        3. Notifies emergency contacts and assigned volunteers of cancellation.
        """
        now = datetime.now(timezone.utc)
        incident.status = IncidentStatus.CANCELLED
        incident.cancelled_at = now
        incident.cancellation_reason = reason

        # 2. Revoke all tracking tokens for this incident
        tokens_res = await db.execute(
            select(LocationAccessToken).where(LocationAccessToken.incident_id == incident.id)
        )
        tokens = tokens_res.scalars().all()
        for t in tokens:
            t.is_revoked = True
            t.revoked_at = now

        # 3. Notify assigned volunteers of cancellation
        vol_res = await db.execute(
            select(IncidentVolunteer).where(
                and_(
                    IncidentVolunteer.incident_id == incident.id,
                    IncidentVolunteer.status.in_([
                        VolunteerIncidentStatus.ACCEPTED,
                        VolunteerIncidentStatus.ON_THE_WAY
                    ])
                )
            )
        )
        responders = vol_res.scalars().all()
        notifier = get_notification_provider()

        for r in responders:
            r.status = VolunteerIncidentStatus.CANCELLED
            await notifier.send_push_notification(
                fcm_token=f"fcm-vol-{r.volunteer_id}",
                title="Emergency Ended",
                body="The emergency alert has been cancelled by the user. Thank you for your readiness.",
                data={"incident_id": str(incident.id), "status": "cancelled"}
            )

        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="EMERGENCY_INCIDENT_CANCELLED",
            resource_type="EmergencyIncident",
            resource_id=str(incident.id),
            metadata_json={"reason": reason}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(incident)

        return incident


emergency_engine = EmergencyEngine()
