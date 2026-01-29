from datetime import datetime, timedelta, timezone
from azure.storage.blob import generate_blob_sas, BlobSasPermissions


def build_upload_path(user_id: str, filename: str) -> str:
    safe = filename.replace("\\", "_").replace("/", "_")
    return f"users/{user_id}/uploads/{safe}"


def create_upload_sas(
    account: str,
    key: str,
    container: str,
    blob_path: str,
    expiry_minutes: int = 15,
):
    sas = generate_blob_sas(
        account_name=account,
        account_key=key,
        container_name=container,
        blob_name=blob_path,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes),
    )

    upload_url = f"https://{account}.blob.core.windows.net/{container}/{blob_path}?{sas}"
    blob_url = f"https://{account}.blob.core.windows.net/{container}/{blob_path}"
    return upload_url, blob_url
