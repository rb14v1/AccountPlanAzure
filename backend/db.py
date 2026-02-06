import struct
import pyodbc
from azure.identity import InteractiveBrowserCredential

SERVER = "3seaaprja3tevkumqe7huklpka-eh4rmivb2b2exi26djjy7nzvpm.datawarehouse.fabric.microsoft.com"
DATABASE = "V1BATSReportsCommercialGoldWH"

# Resource for Azure SQL / Fabric Warehouse
SCOPE = "https://database.windows.net/.default"

# 1) Get an AAD token via browser login (MFA will happen here)
credential = InteractiveBrowserCredential()
access_token = credential.get_token(SCOPE).token

# 2) Build connection string (NO UID/PWD here)
conn_str = (
    "Driver={ODBC Driver 18 for SQL Server};"
    f"Server={SERVER};"
    f"Database={DATABASE};"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
    "Connection Timeout=30;"
)

# 3) Pass token to ODBC (required format is little-endian UTF-16 with length prefix)
token_bytes = access_token.encode("utf-16-le")
token_struct = struct.pack("<I", len(token_bytes)) + token_bytes

SQL_COPT_SS_ACCESS_TOKEN = 1256

try:
    cnxn = pyodbc.connect(conn_str, attrs_before={SQL_COPT_SS_ACCESS_TOKEN: token_struct})
    print("✅ Connected successfully via AAD (MFA)")

    cur = cnxn.cursor()
    cur.execute("SELECT TOP 5 * FROM dbo.Forecast_View")
    rows = cur.fetchall()

    for r in rows:
        print(r)

except Exception as e:
    print("❌ Connection failed")
    print(repr(e))
