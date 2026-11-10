from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin
from app.models.user import User, AccountStatus
from app.models.audit import AbuseReport, AuditLog
from app.schemas.report import CreateReportRequest, ReportResponse, UpdateReportStatusRequest

router = APIRouter(prefix="/reports", tags=["Abuse Reporting & Moderation"])


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_abuse_report(
    payload: CreateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """File an incident or abuse report (e.g. fake alerts, inappropriate behavior, harassment)."""
    # Self-reporting check
    if str(current_user.id) == str(payload.reported_user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot file an abuse report against yourself."
        )

    # Verify reported user exists
    target_res = await db.execute(select(User).where(User.id == payload.reported_user_id))
    target_user = target_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The reported user does not exist."
        )

    report = AbuseReport(
        reporter_id=current_user.id,
        reported_user_id=payload.reported_user_id,
        incident_id=payload.incident_id,
        reason=payload.reason,
        details=payload.details,
        status="under_review"
    )
    db.add(report)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="ABUSE_REPORT_FILED",
        resource_type="AbuseReport",
        resource_id=str(report.id),
        metadata_json={
            "reported_user_id": str(payload.reported_user_id),
            "reason": payload.reason
        }
    )
    db.add(audit)
    await db.commit()
    await db.refresh(report)

    return report


@router.get("", response_model=List[ReportResponse])
async def list_abuse_reports(
    status_filter: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Review and moderate filed abuse reports."""
    query = select(AbuseReport).order_by(AbuseReport.created_at.desc())
    if status_filter:
        query = query.where(AbuseReport.status == status_filter)

    res = await db.execute(query)
    return res.scalars().all()


@router.patch("/{report_id}", response_model=ReportResponse)
async def resolve_abuse_report(
    report_id: str,
    payload: UpdateReportStatusRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Admin-only: Update abuse report resolution and optionally suspend malicious account."""
    res = await db.execute(select(AbuseReport).where(AbuseReport.id == report_id))
    report = res.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    report.status = payload.status
    if payload.resolution_notes:
        report.resolution_notes = payload.resolution_notes

    # Optional account suspension
    if payload.suspend_reported_user:
        target_res = await db.execute(select(User).where(User.id == report.reported_user_id))
        target_user = target_res.scalar_one_or_none()
        if target_user:
            target_user.is_active = False
            target_user.status = AccountStatus.SUSPENDED

            # Log punitive action in audit
            audit_susp = AuditLog(
                user_id=admin.id,
                action="USER_ACCOUNT_SUSPENDED",
                resource_type="User",
                resource_id=str(target_user.id),
                metadata_json={"report_id": report_id, "reason": report.reason}
            )
            db.add(audit_susp)

    # Log review action
    audit = AuditLog(
        user_id=admin.id,
        action="ABUSE_REPORT_RESOLVED",
        resource_type="AbuseReport",
        resource_id=report_id,
        metadata_json={
            "new_status": payload.status,
            "suspended_user": payload.suspend_reported_user
        }
    )
    db.add(audit)
    await db.commit()
    await db.refresh(report)

    return report
