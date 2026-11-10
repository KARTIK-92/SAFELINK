import sys
import os
import asyncio
from datetime import datetime, timezone, date

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, sync_engine, Base
from app.core.security import hash_password
from app.models.user import User, UserProfile, UserRole, AccountStatus
from app.models.contact import EmergencyContact
from app.models.volunteer import VolunteerProfile, VolunteerLocation


async def seed_data():
    print("[SafeLink] Starting Database Seeding...")

    # Ensure tables exist
    Base.metadata.create_all(bind=sync_engine)

    async with AsyncSessionLocal() as db:
        # 1. Seed Verified Woman (Priya Sharma)
        woman_phone = "+919888800001"
        res_w = await db.execute(select(User).where(User.phone == woman_phone))
        woman = res_w.scalar_one_or_none()

        if not woman:
            woman = User(
                phone=woman_phone,
                email="priya.sos@example.com",
                hashed_password=hash_password("WomanPassword123#"),
                role=UserRole.WOMAN,
                status=AccountStatus.VERIFIED,
                is_active=True,
                is_phone_verified=True,
                is_email_verified=True
            )
            db.add(woman)
            await db.flush()

            w_profile = UserProfile(
                user_id=woman.id,
                full_legal_name="Priya Sharma",
                gender="female",
                date_of_birth=date(1997, 4, 12),
                address_line1="Flat 402, Lotus Apartments, MG Road",
                city="Bengaluru",
                state="Karnataka",
                pin_code="560001"
            )
            db.add(w_profile)

            # Add 2 Emergency Contacts
            c1 = EmergencyContact(
                user_id=woman.id,
                name="Kavita Sharma",
                relationship="Mother",
                phone="+919888800099",
                email="kavita.sharma@example.com",
                preferred_channels=["sms", "whatsapp"],
                priority_order=1,
                is_active=True
            )
            c2 = EmergencyContact(
                user_id=woman.id,
                name="Ananya Sen",
                relationship="Friend",
                phone="+919888800098",
                email="ananya.sen@example.com",
                preferred_channels=["sms", "whatsapp", "email"],
                priority_order=2,
                is_active=True
            )
            db.add_all([c1, c2])
            print(f"  ✓ Seeded Woman Account: {woman_phone} (Priya Sharma) with 2 Emergency Contacts")
        else:
            print(f"  • Woman Account {woman_phone} already exists.")

        # 2. Seed Verified Volunteer (Rajesh Nair)
        vol_phone = "+919888800002"
        res_v = await db.execute(select(User).where(User.phone == vol_phone))
        volunteer = res_v.scalar_one_or_none()

        if not volunteer:
            volunteer = User(
                phone=vol_phone,
                email="rajesh.vol@example.com",
                hashed_password=hash_password("VolPassword123#"),
                role=UserRole.VOLUNTEER,
                status=AccountStatus.VERIFIED,
                is_active=True,
                is_phone_verified=True,
                is_email_verified=True
            )
            db.add(volunteer)
            await db.flush()

            v_profile = UserProfile(
                user_id=volunteer.id,
                full_legal_name="Rajesh Nair",
                gender="male",
                date_of_birth=date(1992, 8, 20),
                address_line1="7 Brigade Road",
                city="Bengaluru",
                state="Karnataka",
                pin_code="560001"
            )
            db.add(v_profile)

            vol_prof = VolunteerProfile(
                user_id=volunteer.id,
                vehicle_type="two_wheeler",
                skills=["first_aid", "cpr", "de_escalation"],
                is_available=True,
                total_incidents_responded=3,
                last_seen_at=datetime.now(timezone.utc)
            )
            db.add(vol_prof)
            await db.flush()

            # Location: ~200 meters from MG Road Metro (12.9730, 77.5950)
            vol_loc = VolunteerLocation(
                volunteer_id=vol_prof.id,
                latitude=12.9730,
                longitude=77.5950,
                accuracy_meters=8.0,
                recorded_at=datetime.now(timezone.utc)
            )
            db.add(vol_loc)
            print(f"  ✓ Seeded Volunteer Account: {vol_phone} (Rajesh Nair, Available, Proximity Location Set)")
        else:
            print(f"  • Volunteer Account {vol_phone} already exists.")

        # 3. Seed Platform Administrator
        admin_phone = "+919888800003"
        res_a = await db.execute(select(User).where(User.phone == admin_phone))
        admin = res_a.scalar_one_or_none()

        if not admin:
            admin = User(
                phone=admin_phone,
                email="admin@safelink.gov.in",
                hashed_password=hash_password("AdminPassword123#"),
                role=UserRole.ADMIN,
                status=AccountStatus.VERIFIED,
                is_active=True,
                is_phone_verified=True,
                is_email_verified=True
            )
            db.add(admin)
            await db.flush()

            a_profile = UserProfile(
                user_id=admin.id,
                full_legal_name="Security Operations Administrator",
                gender="female",
                date_of_birth=date(1988, 10, 10),
                address_line1="SafeLink Operations Headquarters",
                city="Bengaluru",
                state="Karnataka",
                pin_code="560001"
            )
            db.add(a_profile)
            print(f"  ✓ Seeded Admin Account: {admin_phone} (admin@safelink.gov.in)")
        else:
            print(f"  • Admin Account {admin_phone} already exists.")

        await db.commit()
        print("[SafeLink] Database Seeding Complete!")


if __name__ == "__main__":
    asyncio.run(seed_data())
