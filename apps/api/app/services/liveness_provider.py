import abc
from typing import Dict, Any, List


class BaseLivenessProvider(abc.ABC):
    @abc.abstractmethod
    async def create_challenge(self, user_id: str) -> Dict[str, Any]:
        """Generate interactive challenge (e.g., blink, turn left, smile)."""
        pass

    @abc.abstractmethod
    async def evaluate_challenge(self, session_id: str, frame_data: List[str]) -> Dict[str, Any]:
        """Verify that submitted video/frames meet active liveness criteria."""
        pass


class MockLivenessProvider(BaseLivenessProvider):
    """Development/Demo Mock Liveness Provider."""
    async def create_challenge(self, user_id: str) -> Dict[str, Any]:
        return {
            "session_id": f"liveness-session-{user_id[:8]}",
            "provider": "mock",
            "actions_required": ["blink_twice", "turn_head_right"],
            "is_mock": True
        }

    async def evaluate_challenge(self, session_id: str, frame_data: List[str]) -> Dict[str, Any]:
        # Client-side liveness detection in demo mode passes with 98% confidence
        return {
            "passed": True,
            "confidence_score": 98,
            "provider": "mock",
            "is_mock": True,
            "warning": "Client-side / mock liveness is not sufficient for production-grade identity assurance."
        }


def get_liveness_provider(provider_name: str = "mock") -> BaseLivenessProvider:
    return MockLivenessProvider()
