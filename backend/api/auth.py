# backend/api/auth.py

from typing import Optional


class AuthError(Exception):
    """Raised when request does not contain a valid user id."""
    pass


def get_user_id(request, header_name: str = "X-User-Id") -> str:
    """
    Option A auth (fast MVP):
    Frontend must send: X-User-Id: <some-unique-id>

    Django exposes headers as:
      - request.headers (preferred)
      - request.META['HTTP_X_USER_ID'] (fallback)

    Returns: user_id string
    """
    user_id: Optional[str] = None

    # Preferred (Django 2.2+)
    try:
        user_id = request.headers.get(header_name)
    except Exception:
        user_id = None

    # Fallback
    if not user_id:
        meta_key = "HTTP_" + header_name.upper().replace("-", "_")
        user_id = request.META.get(meta_key)

    if not user_id or not str(user_id).strip():
        raise AuthError(f"Missing {header_name} header")

    return str(user_id).strip()


def attach_user_id(request, header_name: str = "X-User-Id") -> str:
    """
    Convenience helper:
    extracts user_id and stores it on request.user_id for downstream usage.
    """
    user_id = get_user_id(request, header_name=header_name)
    setattr(request, "user_id", user_id)
    return user_id
    