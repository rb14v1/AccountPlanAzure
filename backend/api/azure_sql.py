# backend/api/azure_sql.py
from __future__ import annotations

import os
import struct
from typing import Any, Dict, List

import pyodbc

# ============================================================
# Helpers
# ============================================================

def _env(key: str, default: str = "") -> str:
    return (os.getenv(key, default) or default).strip()


def _rows_to_dicts(cur) -> List[Dict[str, Any]]:
    if not cur.description:
        return []
    cols = [c[0] for c in cur.description]
    out: List[Dict[str, Any]] = []
    for row in cur.fetchall():
        out.append({cols[i]: row[i] for i in range(len(cols))})
    return out


# ============================================================
# OPTION B: FABRIC WAREHOUSE (AAD TOKEN / MFA)
# ============================================================

SQL_COPT_SS_ACCESS_TOKEN = 1256
FABRIC_SCOPE = "https://database.windows.net/.default"


def fabric_conn() -> pyodbc.Connection:
    """
    Connect to Microsoft Fabric Warehouse using AAD token (MFA).
    Works best for local dev because it opens a browser login.
    Requires: pip install azure-identity
    """
    from azure.identity import InteractiveBrowserCredential

    driver = _env("FABRIC_SQL_DRIVER", "ODBC Driver 18 for SQL Server")
    server = _env("FABRIC_SQL_SERVER")
    db = _env("FABRIC_SQL_DB")

    if not server or not db:
        raise RuntimeError("Missing FABRIC_SQL_SERVER / FABRIC_SQL_DB in .env")

    conn_str = (
        f"Driver={{{driver}}};"
        f"Server={server};"
        f"Database={db};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )

    cred = InteractiveBrowserCredential()
    token = cred.get_token(FABRIC_SCOPE).token

    token_bytes = token.encode("utf-16-le")
    token_struct = struct.pack("<I", len(token_bytes)) + token_bytes

    return pyodbc.connect(conn_str, attrs_before={SQL_COPT_SS_ACCESS_TOKEN: token_struct})


def fetch_fabric_bundle(account_name: str, top_n: int = 50) -> Dict[str, Any]:
    """
    Pull a minimal 'bundle' of data from Fabric views for a given Account_Name.

    Robust rules:
    - Never reference Quarter in SQL (some views may not have it).
    - Try ORDER BY Year DESC first.
    - If Year doesn't exist, fallback to TOP * without ORDER BY.
    - If one view fails, log and return [] for that view (do not crash).
    """
    account_name = (account_name or "").strip()
    if not account_name:
        raise ValueError("account_name required")

    def safe_fetch(cur, view_name: str) -> List[Dict[str, Any]]:
        # 1) Try Year-based ordering (best effort)
        try:
            sql = f"""
                SELECT TOP ({top_n}) *
                FROM {view_name}
                WHERE Account_Name = ?
                ORDER BY Year DESC
            """
            cur.execute(sql, account_name)
            return _rows_to_dicts(cur)
        except Exception as e1:
            # 2) Fallback: no ORDER BY (handles views without Year)
            try:
                sql = f"SELECT TOP ({top_n}) * FROM {view_name} WHERE Account_Name = ?"
                cur.execute(sql, account_name)
                return _rows_to_dicts(cur)
            except Exception as e2:
                print(f"⚠️ Fabric view query failed for {view_name}: {e2}")
                return []

    with fabric_conn() as c:
        cur = c.cursor()

        plan_rows = safe_fetch(cur, "dbo.Account_Plan_View_Updated")
        account_plan = plan_rows[0] if plan_rows else {}

        unified_metrics = safe_fetch(cur, "dbo.Account_Unified_Metrics_View")
        csat = safe_fetch(cur, "dbo.CSAT_View_Account")
        forecast = safe_fetch(cur, "dbo.Forecast_View")
        revenue_employee_margin = safe_fetch(cur, "dbo.Revenue_Employee_Margin_View")
        revenue_kantata = safe_fetch(cur, "dbo.Revenue_View_Kantata")
        tcv_crm = safe_fetch(cur, "dbo.TCV_View_CRM")
        targets = safe_fetch(cur, "dbo.Targets_View_Account")

    return {
        "account_name": account_name,
        "account_plan": account_plan,
        "unified_metrics": unified_metrics,
        "csat": csat,
        "forecast": forecast,
        "revenue_employee_margin": revenue_employee_margin,
        "revenue_kantata": revenue_kantata,
        "tcv_crm": tcv_crm,
        "targets": targets,
    }


# ============================================================
# OPTION A: SQL AUTH (username/password) - OPTIONAL
# Keep if you want to connect to non-Fabric SQL Server later.
# ============================================================

def sql_auth_conn() -> pyodbc.Connection:
    """
    Connect using SQL username/password.
    Uses env vars:
      AZURE_SQL_SERVER, AZURE_SQL_DB, AZURE_SQL_USER, AZURE_SQL_PASSWORD
    """
    driver = _env("AZURE_SQL_DRIVER", "ODBC Driver 18 for SQL Server")
    server = _env("AZURE_SQL_SERVER")
    db = _env("AZURE_SQL_DB")
    user = _env("AZURE_SQL_USER")
    pwd = _env("AZURE_SQL_PASSWORD")

    if not server or not db or not user or not pwd:
        raise RuntimeError("Missing AZURE_SQL_* env vars for sql_auth_conn")

    conn_str = (
        f"Driver={{{driver}}};"
        f"Server={server};"
        f"Database={db};"
        f"UID={user};"
        f"PWD={pwd};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)


def ping_fabric() -> Dict[str, Any]:
    """
    Quick sanity check to ensure Fabric connection works.
    """
    with fabric_conn() as c:
        cur = c.cursor()
        cur.execute("SELECT 1 AS ok")
        row = cur.fetchone()
        return {"ok": int(row[0]) if row else 0}
