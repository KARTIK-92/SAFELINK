from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "brand": settings.BRAND_NAME,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "minimum_registration_age": settings.MINIMUM_REGISTRATION_AGE,
        "verification_provider": settings.VERIFICATION_PROVIDER,
        "liveness_provider": settings.LIVENESS_PROVIDER,
        "version": "1.0.0"
    }
