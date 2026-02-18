import os
import requests
from io import BytesIO
from PIL import Image
from duckduckgo_search import DDGS

from django.conf import settings

OUTPUT_DIR = settings.MEDIA_ROOT  # backend/api/logos
BASE_URL = "http://127.0.0.1:8000" + settings.MEDIA_URL

os.makedirs(OUTPUT_DIR, exist_ok=True)


def clean_name(company):
    return company.lower().replace(" ", "_").replace("&", "and")


# ----------------------------
# helper: safe filename
# ----------------------------
def clean_company_name(company: str):
    return company.lower().replace(" ", "_").replace("&", "and")


# ----------------------------
# 1. Try Clearbit
# ----------------------------
def try_clearbit(company):
    try:
        safe_name = clean_company_name(company)
        domain_guess = safe_name.replace("_", "") + ".com"
        url = f"https://logo.clearbit.com/{domain_guess}"

        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            img = Image.open(BytesIO(r.content)).convert("RGBA")
            filename = clean_name(company) + ".png"
            path = os.path.join(OUTPUT_DIR, filename)
            img.save(path)

            return f"{BASE_URL}{filename}"


    except Exception as e:
        print("Clearbit error:", e)

    return None


# ----------------------------
# 2. DuckDuckGo fallback
# ----------------------------
def try_ddgs(company):
    try:
        safe_name = clean_company_name(company)

        query = f"{company} official logo transparent png"

        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=5))

        for r in results:
            try:
                img_url = r.get("image")
                if not img_url:
                    continue

                resp = requests.get(img_url, timeout=10)
                img = Image.open(BytesIO(resp.content)).convert("RGBA")

                filename = clean_name(company) + ".png"
                path = os.path.join(OUTPUT_DIR, filename)
                img.save(path)

                return f"{BASE_URL}{filename}"


            except:
                continue

    except Exception as e:
        print("DDGS Error:", e)

    return None


# ----------------------------
# MAIN FUNCTION
# ----------------------------
def fetch_company_logo(company):
    if not company:
        return None

    safe_name = clean_company_name(company)
    filename = f"{safe_name}.png"
    path = os.path.join(OUTPUT_DIR, filename)

    # ✅ If already downloaded, reuse
    if os.path.exists(path):
        return f"{BASE_URL}/{filename}"

    print("🔍 Trying Clearbit for:", company)
    url = try_clearbit(company)

    if url:
        return url

    print("🔍 Clearbit failed → Trying DuckDuckGo...")
    url = try_ddgs(company)

    if url:
        return url

    print("❌ Could not fetch logo")
    return None
