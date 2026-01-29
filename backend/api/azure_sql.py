# backend/api/azure_sql.py

import os
import pyodbc
from typing import Optional, List, Dict, Any


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def conn() -> pyodbc.Connection:
    """
    Creates a connection to Azure SQL using username/password auth.
    Requires ODBC Driver 18 for SQL Server.
    """
    driver = _env("AZURE_SQL_DRIVER", "ODBC Driver 18 for SQL Server")
    server = _env("AZURE_SQL_SERVER")
    db = _env("AZURE_SQL_DB")
    user = _env("AZURE_SQL_USER")
    pwd = _env("AZURE_SQL_PASSWORD")

    if not server or not db or not user or not pwd:
        raise RuntimeError("Azure SQL env vars missing. Set AZURE_SQL_SERVER/DB/USER/PASSWORD.")

    cs = (
        f"DRIVER={{{driver}}};"
        f"SERVER={server};"
        f"DATABASE={db};"
        f"UID={user};"
        f"PWD={pwd};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(cs)


# -------------------------
# Optional: Create tables
# -------------------------

def ensure_tables() -> None:
    """
    Creates required tables if they don't exist.
    Call once at startup or before first insert.
    """
    with conn() as c:
        cur = c.cursor()

        # uploaded_files table
        cur.execute("""
        IF OBJECT_ID('uploaded_files', 'U') IS NULL
        BEGIN
            CREATE TABLE uploaded_files (
                id INT IDENTITY(1,1) PRIMARY KEY,
                user_id NVARCHAR(128) NOT NULL,
                filename NVARCHAR(260) NOT NULL,
                blob_path NVARCHAR(400) NOT NULL,
                blob_url NVARCHAR(600) NOT NULL,
                size BIGINT NULL,
                created_at DATETIME2 DEFAULT SYSUTCDATETIME()
            );
        END
        """)

        # generated_decks table (stores latest deck pointer)
        cur.execute("""
        IF OBJECT_ID('generated_decks', 'U') IS NULL
        BEGIN
            CREATE TABLE generated_decks (
                id INT IDENTITY(1,1) PRIMARY KEY,
                user_id NVARCHAR(128) NOT NULL,
                template_id NVARCHAR(120) NOT NULL,
                blob_path NVARCHAR(400) NOT NULL,
                updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
                CONSTRAINT uq_user_template UNIQUE (user_id, template_id)
            );
        END
        """)

        c.commit()


# -------------------------
# Uploaded files metadata
# -------------------------

def insert_uploaded_file(
    user_id: str,
    filename: str,
    blob_path: str,
    blob_url: str,
    size: Optional[int] = None,
) -> None:
    ensure_tables()
    with conn() as c:
        cur = c.cursor()
        cur.execute("""
            INSERT INTO uploaded_files (user_id, filename, blob_path, blob_url, size)
            VALUES (?, ?, ?, ?, ?)
        """, user_id, filename, blob_path, blob_url, size)
        c.commit()


def list_uploaded_files(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    ensure_tables()
    with conn() as c:
        cur = c.cursor()
        cur.execute("""
            SELECT TOP (?) filename, blob_path, blob_url, size, created_at
            FROM uploaded_files
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, limit, user_id)
        rows = cur.fetchall()

    return [
        {
            "filename": r[0],
            "blob_path": r[1],
            "blob_url": r[2],
            "size": r[3],
            "created_at": r[4].isoformat() if r[4] else None,
        }
        for r in rows
    ]


# -------------------------
# Latest deck pointer
# -------------------------

def upsert_latest_deck(user_id: str, template_id: str, blob_path: str) -> None:
    """
    Stores/updates the 'latest generated PPT' path for a user+template.
    """
    ensure_tables()
    with conn() as c:
        cur = c.cursor()
        cur.execute("""
        IF EXISTS (SELECT 1 FROM generated_decks WHERE user_id=? AND template_id=?)
            UPDATE generated_decks
            SET blob_path=?, updated_at=SYSUTCDATETIME()
            WHERE user_id=? AND template_id=?
        ELSE
            INSERT INTO generated_decks (user_id, template_id, blob_path)
            VALUES (?, ?, ?)
        """, user_id, template_id, blob_path, user_id, template_id, user_id, template_id, blob_path)
        c.commit()


def get_latest_deck(user_id: str, template_id: str) -> Optional[Dict[str, Any]]:
    """
    Returns latest deck pointer for a user+template, or None.
    """
    ensure_tables()
    with conn() as c:
        cur = c.cursor()
        cur.execute("""
            SELECT blob_path, updated_at
            FROM generated_decks
            WHERE user_id=? AND template_id=?
        """, user_id, template_id)
        row = cur.fetchone()

    if not row:
        return None

    return {
        "blob_path": row[0],
        "updated_at": row[1].isoformat() if row[1] else None,
    }
