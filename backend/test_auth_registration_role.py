
import unittest
from unittest.mock import patch, MagicMock

from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserRegister
from app.services import auth_service


class TestPublicRegistrationRole(unittest.TestCase):

    @patch("app.services.auth_service.send_verification_email")
    @patch("app.services.auth_service.create_verification_token")
    @patch("app.services.auth_service.hash_password")
    def test_admin_role_request_creates_normal_user(
        self,
        mock_hash_password,
        mock_create_token,
        mock_send_email,
    ):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        mock_hash_password.return_value = "test-password-hash"
        mock_create_token.return_value = "test-verification-token"

        data = UserRegister(
            email="security-test@example.com",
            password="TestPassword123!",
            full_name="Security Test",
            role=UserRole.ADMIN,
        )

        created_user = auth_service.register_user(db, data)

        self.assertEqual(created_user.role, UserRole.USER)
        db.add.assert_called_once_with(created_user)
        db.commit.assert_called_once()
        mock_send_email.assert_called_once()

    @patch("app.services.auth_service.send_verification_email")
    @patch("app.services.auth_service.create_verification_token")
    @patch("app.services.auth_service.hash_password")
    def test_professional_role_request_creates_normal_user(
        self,
        mock_hash_password,
        mock_create_token,
        mock_send_email,
    ):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        mock_hash_password.return_value = "test-password-hash"
        mock_create_token.return_value = "test-verification-token"

        data = UserRegister(
            email="professional-test@example.com",
            password="TestPassword123!",
            full_name="Professional Test",
            role=UserRole.PROFESSIONAL,
        )

        created_user = auth_service.register_user(db, data)

        self.assertEqual(created_user.role, UserRole.USER)
        db.add.assert_called_once_with(created_user)
        db.commit.assert_called_once()
        mock_send_email.assert_called_once()


if __name__ == "__main__":
    unittest.main()
