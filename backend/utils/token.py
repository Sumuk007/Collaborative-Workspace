from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

SECRET_KEY = "your-very-secret-key"
serializer = URLSafeTimedSerializer(SECRET_KEY)


def generate_reset_token(email: str):
    return serializer.dumps(email, salt="reset-password")


def verify_reset_token(token: str, max_age=900):
    try:
        email = serializer.loads(token, salt="reset-password", max_age=max_age)
        return email
    except (BadSignature, SignatureExpired):
        return None
