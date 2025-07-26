import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env.example")  # If you're storing the API key in .env

configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = os.getenv('BREVO_API_KEY')


def send_password_reset_email(email: str, token: str):
    reset_url = f"http://localhost:5173/reset-password?token={token}"
    print(reset_url)
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    subject = "Reset Your Password"
    sender = {"name": "Your App", "email": "viper53443@gmail.com"}  # This must match your verified sender
    to = [{"email": email}]

    html_content = f"""
    <html>
    <body>
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <p><a href="{reset_url}">{reset_url}</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
    </body>
    </html>
    """

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject=subject,
        html_content=html_content
    )

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print("Email sent successfully:", api_response)
    except ApiException as e:
        print("Exception when sending email via Brevo:", e)
