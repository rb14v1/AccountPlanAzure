# backend/api/azure_sql.py
from __future__ import annotations

import os
import struct
import time
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
# FABRIC WAREHOUSE CONNECTION
# ============================================================

SQL_COPT_SS_ACCESS_TOKEN = 1256

def fabric_conn() -> pyodbc.Connection:
    """
    Connect to Microsoft Fabric Warehouse using AAD token (MFA).
    Includes detailed logging to debug Timeouts vs Auth failures.
    """
    from azure.identity import InteractiveBrowserCredential

    driver = _env("FABRIC_SQL_DRIVER", "ODBC Driver 18 for SQL Server")
    server = _env("FABRIC_SQL_SERVER")
    db = _env("FABRIC_SQL_DB")
    
    # Robust Scope Fallback:
    # 1. Use .env value if present
    # 2. Fallback to standard SQL scope if missing (Fixes 'NoneType' error)
    scope = _env("FABRIC_SQL_SCOPE")
    if not scope:
        scope = "https://database.windows.net//.default"

    if not server or not db:
        raise RuntimeError("Missing FABRIC_SQL_SERVER / FABRIC_SQL_DB in .env")

    print(f"\n🚀 [SQL] Initiating connection to: {server}")
    print(f"🔑 [SQL] Auth Scope: {scope}")

    # 1. Acquire Token
    t0 = time.time()
    try:
        cred = InteractiveBrowserCredential()
        # Explicitly requesting token for the scope
        token_obj = cred.get_token(scope)
        token = token_obj.token
        print(f"✅ [SQL] Token acquired in {time.time() - t0:.2f}s")
    except Exception as e:
        print(f"❌ [SQL] Token generation failed: {e}")
        raise

    # 2. Prepare Connection String
    # TrustServerCertificate=yes is CRITICAL for preventing SSL errors on local dev
    conn_str = (
        f"Driver={{{driver}}};"
        f"Server={server};"
        f"Database={db};"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
        "Connection Timeout=30;"
    )

    token_bytes = token.encode("utf-16-le")
    token_struct = struct.pack("<I", len(token_bytes)) + token_bytes

    # 3. Connect
    t1 = time.time()
    print(f"⏳ [SQL] Connecting to Database... (Timeout=30s)")
    try:
        conn = pyodbc.connect(conn_str, attrs_before={SQL_COPT_SS_ACCESS_TOKEN: token_struct})
        print(f"✅ [SQL] Connection established in {time.time() - t1:.2f}s")
        return conn
    except pyodbc.Error as e:
        elapsed = time.time() - t1
        print(f"❌ [SQL] Connection FAILED after {elapsed:.2f}s")
        
        # Debugging Helper
        available_drivers = pyodbc.drivers()
        print("\n" + "="*60)
        print(f"🚨 ODBC ERROR: {e}")
        print(f"Attempted Driver: '{driver}'")
        print(f"System Drivers: {available_drivers}")
        print("="*60 + "\n")
        raise

def fetch_fabric_bundle(account_name: str, top_n: int = 50) -> Dict[str, Any]:
    """
    Pull a minimal 'bundle' of data from Fabric views for a given Account_Name.
    """
    account_name = (account_name or "").strip()
    print(f"\n📦 [Fabric] Fetching bundle for Account: '{account_name}'")

    if not account_name:
        return {}

    def safe_fetch(cur, view_name: str) -> List[Dict[str, Any]]:
        # 1) Try Year-based ordering (best effort)
        try:
            start_q = time.time()
            sql = f"""
                SELECT TOP ({top_n}) *
                FROM {view_name}
                WHERE Account_Name = ?
                ORDER BY Year DESC
            """
            cur.execute(sql, account_name)
            rows = _rows_to_dicts(cur)
            print(f"   📄 {view_name}: Found {len(rows)} rows ({time.time() - start_q:.2f}s)")
            return rows
        except Exception:
            # 2) Fallback: no ORDER BY (handles views without Year column)
            try:
                sql = f"SELECT TOP ({top_n}) * FROM {view_name} WHERE Account_Name = ?"
                cur.execute(sql, account_name)
                rows = _rows_to_dicts(cur)
                print(f"   📄 {view_name} (Fallback): Found {len(rows)} rows")
                return rows
            except Exception as e2:
                print(f"   ⚠️ {view_name}: Query Failed - {e2}")
                return []

    try:
        with fabric_conn() as c:
            cur = c.cursor()

            plan_rows = safe_fetch(cur, "dbo.Account_Plan_View_Updated")
            account_plan = plan_rows[0] if plan_rows else {}

            return {
                "account_name": account_name,
                "account_plan": account_plan,
                "unified_metrics": safe_fetch(cur, "dbo.Account_Unified_Metrics_View"),
                "csat": safe_fetch(cur, "dbo.CSAT_View_Account"),
                "forecast": safe_fetch(cur, "dbo.Forecast_View"),
                "revenue_employee_margin": safe_fetch(cur, "dbo.Revenue_Employee_Margin_View"),
                "revenue_kantata": safe_fetch(cur, "dbo.Revenue_View_Kantata"),
                "tcv_crm": safe_fetch(cur, "dbo.TCV_View_CRM"),
                "targets": safe_fetch(cur, "dbo.Targets_View_Account"),
            }
    except Exception as e:
        print(f"❌ [Fabric] Fetch Bundle Global Failure: {e}")
        return {}

# ============================================================
# OPTIONAL: SQL AUTH & PING
# ============================================================

def ping_fabric() -> Dict[str, Any]:
    with fabric_conn() as c:
        cur = c.cursor()
        cur.execute("SELECT 1 AS ok")
        row = cur.fetchone()
        return {"ok": int(row[0]) if row else 0}