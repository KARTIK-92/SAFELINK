import abc
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("safelink.notifications")


class BaseNotificationProvider(abc.ABC):
    @abc.abstractmethod
    async def send_sms(self, phone: str, message: str, dlt_template_id: Optional[str] = None) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    async def send_whatsapp(self, phone: str, template_name: str, parameters: Dict[str, str]) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    async def send_email(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    async def send_push_notification(self, fcm_token: str, title: str, body: str, data: Dict[str, str]) -> Dict[str, Any]:
        pass


class MockNotificationProvider(BaseNotificationProvider):
    """Local Development & Demo Notification Provider.
    Logs dispatches without incurring costs or needing external credentials.
    Maintains an in-memory dispatch history for automated tests.
    """
    def __init__(self):
        self.history: List[Dict[str, Any]] = []

    async def send_sms(self, phone: str, message: str, dlt_template_id: Optional[str] = None) -> Dict[str, Any]:
        record = {
            "channel": "sms",
            "recipient": phone,
            "message": message,
            "dlt_template_id": dlt_template_id,
            "status": "delivered",
            "provider": "mock_sms",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.history.append(record)
        logger.info(f"[DEMO SMS] To: {phone} | Body: {message}")
        return {"status": "delivered", "message_id": f"mock-sms-{len(self.history)}"}

    async def send_whatsapp(self, phone: str, template_name: str, parameters: Dict[str, str]) -> Dict[str, Any]:
        record = {
            "channel": "whatsapp",
            "recipient": phone,
            "template": template_name,
            "params": parameters,
            "status": "delivered",
            "provider": "mock_whatsapp",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.history.append(record)
        logger.info(f"[DEMO WHATSAPP] To: {phone} | Template: {template_name} | Params: {parameters}")
        return {"status": "delivered", "message_id": f"mock-wa-{len(self.history)}"}

    async def send_email(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        record = {
            "channel": "email",
            "recipient": to_email,
            "subject": subject,
            "status": "delivered",
            "provider": "mock_email",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.history.append(record)
        logger.info(f"[DEMO EMAIL] To: {to_email} | Subject: {subject}")
        return {"status": "delivered", "message_id": f"mock-email-{len(self.history)}"}

    async def send_push_notification(self, fcm_token: str, title: str, body: str, data: Dict[str, str]) -> Dict[str, Any]:
        record = {
            "channel": "fcm",
            "recipient": fcm_token,
            "title": title,
            "body": body,
            "data": data,
            "status": "delivered",
            "provider": "mock_fcm",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.history.append(record)
        logger.info(f"[DEMO FCM] Token: {fcm_token[:15]}... | Title: {title} | Body: {body} | Data: {data}")
        return {"status": "delivered", "message_id": f"mock-fcm-{len(self.history)}"}


# Global singleton instance for easy mock test inspection
mock_notification_service = MockNotificationProvider()


def get_notification_provider() -> BaseNotificationProvider:
    return mock_notification_service
