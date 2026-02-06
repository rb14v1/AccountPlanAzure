import pyodbc

SERVER = "3seaaprja3tevkumqe7huklpka-eh4rmivb2b2exi26djjy7nzvpm.datawarehouse.fabric.microsoft.com"
DATABASE = "V1BATSReportsCommercialGoldWH"

USERNAME = "muthudhanush.r@version1.com"
PASSWORD = "Iusedtolovetiger@1234567890"

conn_str = (
    "Driver={ODBC Driver 18 for SQL Server};"
    f"Server={SERVER};"
    f"Database={DATABASE};"
    f"UID={USERNAME};"
    f"PWD={PASSWORD};"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
    "Connection Timeout=30;"
)

try:
    conn = pyodbc.connect(conn_str)
    print("✅ Connected successfully")

    cursor = conn.cursor()
    cursor.execute("SELECT TOP 5 * FROM dbo.Forecast_View")

    for row in cursor.fetchall():
        print(row)

except Exception as e:
    print("❌ Connection failed")
    print(e)
