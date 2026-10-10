import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_verification_email(
    email: str,
    verification_token: str,
) -> None:
    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email"
        f"?token={verification_token}"
    )

    message = EmailMessage()

    message["Subject"] = "Verify your AI Psychology Companion account"
    message["From"] = (
        f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    )
    message["To"] = email

    message.set_content(
        f"""Hello,

Thank you for creating an account with AI Psychology Companion.

Please verify your email address by opening the link below:

{verification_url}

This verification link is valid for 30 minutes.

If you did not create this account, you can safely ignore this email.

AI Psychology Companion
"""
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
    ) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()

        smtp.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )

        smtp.send_message(message)