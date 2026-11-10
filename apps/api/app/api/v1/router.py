from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, health, verification, contacts, volunteer

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(verification.router)
api_router.include_router(contacts.router)
api_router.include_router(volunteer.router)
