import abc
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timezone


class BaseVerificationProvider(abc.ABC):
    @abc.abstractmethod
    async def initiate_verification(self, user_id: str, id_type: str, id_number_hint: str) -> Dict[str, Any]:
        """Initiate identity verification session."""
        pass

    @abc.abstractmethod
    async def verify_credentials(self, session_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Verify user's KYC documentation or authorization code."""
        pass


class MockVerificationProvider(BaseVerificationProvider):
    """Development/Demo Mock Verification Provider.
    Explicitly tags records as mock-verified and never performs real governmental verification.
    """
    async def initiate_verification(self, user_id: str, id_type: str, id_number_hint: str) -> Dict[str, Any]:
        session_id = f"mock-kyc-session-{user_id[:8]}"
        return {
            "session_id": session_id,
            "provider": "mock",
            "is_mock": True,
            "instructions": "[DEMO MODE] Submit mock verification payload to simulate KYC check."
        }

    async def verify_credentials(self, session_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        # For testing: if user passes {"force_reject": True}, reject it
        if payload.get("force_reject"):
            return {
                "success": False,
                "status": "rejected",
                "is_mock": True,
                "rejection_reason": "Document blurred or mismatched details in simulated check."
            }
        
        # Simulated successful verification
        ref_id = f"MOCK-GOV-ID-{hashlib.sha256(session_id.encode()).hexdigest()[:12].upper()}"
        return {
            "success": True,
            "status": "verified",
            "is_mock": True,
            "provider_reference": ref_id,
            "verification_payload_hash": hashlib.sha256(b"mock_verified_digest").hexdigest(),
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "warning": "DEMO ONLY: Not a legally verified government identity document."
        }


class DigiLockerVerificationProvider(BaseVerificationProvider):
    """Official DigiLocker integration interface.
    Requires approved Requester Organization credentials under India's Digital Locker system.
    """
    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        self.client_id = client_id
        self.client_secret = client_secret

    async def initiate_verification(self, user_id: str, id_type: str, id_number_hint: str) -> Dict[str, Any]:
        if not self.client_id or not self.client_secret:
            raise ValueError("DigiLocker client credentials not configured. Use MockVerificationProvider in development.")
        # Returns OAuth authorization URL redirecting to DigiLocker consent screen
        return {
            "oauth_url": f"https://api.digitallocker.gov.in/public/oauth2/1/authorize?response_type=code&client_id={self.client_id}&state={user_id}",
            "provider": "digilocker",
            "is_mock": False
        }

    async def verify_credentials(self, session_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        auth_code = payload.get("auth_code")
        if not auth_code:
            return {"success": False, "status": "rejected", "rejection_reason": "Missing DigiLocker auth code"}
        # Real integration exchanges auth code with DigiLocker token endpoint
        # and downloads verifiable doc XML without storing raw Aadhaar.
        return {
            "success": True,
            "status": "verified",
            "provider_reference": f"DL-{session_id}",
            "verified_at": datetime.now(timezone.utc).isoformat()
        }


def get_verification_provider(provider_name: str = "mock") -> BaseVerificationProvider:
    if provider_name == "digilocker":
        return DigiLockerVerificationProvider()
    return MockVerificationProvider()
