import html
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.database import async_engine, sync_engine, Base
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist in dev database
    if not settings.TESTING:
        Base.metadata.create_all(bind=sync_engine)
    yield
    # Shutdown
    await async_engine.dispose()


app = FastAPI(
    title=f"{settings.APP_NAME} — Women's Safety & Rapid Emergency Response API",
    description="Mission-critical REST and Real-Time Gateway powering SafeLink Web and Mobile Applications.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# Security Headers Pure ASGI Middleware
class SecurityHeadersMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-content-type-options", b"nosniff"))
                headers.append((b"x-frame-options", b"DENY"))
                headers.append((b"x-xss-protection", b"1; mode=block"))
                headers.append((b"referrer-policy", b"strict-origin-when-cross-origin"))
                headers.append((b"strict-transport-security", b"max-age=31536000; includeSubDomains"))
                if path.startswith("/t/"):
                    headers.append((b"content-security-policy", b"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src https://www.openstreetmap.org; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';"))
                    headers.append((b"x-robots-tag", b"noindex, nofollow, noarchive"))
                else:
                    headers.append((b"content-security-policy", b"default-src 'self'; frame-ancestors 'none';"))
                headers.append((b"permissions-policy", b"geolocation=(self), camera=(self), microphone=()"))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


app.add_middleware(SecurityHeadersMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.BRAND_NAME} Emergency Response API",
        "status": "operational",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }


@app.get("/t/{token}", response_class=HTMLResponse, tags=["Public Live Tracking"])
async def public_live_tracking_page(token: str):
    """Serve live mobile-ready emergency location tracking page for shared family links."""
    safe_token_js = json.dumps(token)
    safe_brand = html.escape(settings.BRAND_NAME)
    api_prefix = settings.API_V1_STR
    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>{safe_brand} • Live Emergency Tracking</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
    body {{ background: #0b1120; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }}
    .topbar {{ background: #450a0a; border-bottom: 1px solid #7f1d1d; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 20; }}
    .badge {{ display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13px; color: #fecaca; letter-spacing: .5px; }}
    .dot {{ width: 10px; height: 10px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 10px #ef4444; }}
    .call-btn {{ background: #dc2626; color: #fff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 8px 14px; border-radius: 8px; }}
    .wrap {{ max-width: 960px; width: 100%; margin: 0 auto; padding: 16px; flex: 1; display: grid; gap: 16px; }}
    .card {{ background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; padding: 16px; }}
    .map-frame {{ width: 100%; height: 380px; border: 0; border-radius: 12px; background: #0f172a; margin-top: 12px; }}
    .meta {{ display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; }}
    .coords {{ font-family: ui-monospace, monospace; font-size: 13px; color: #93c5fd; }}
    .btn-nav {{ display: block; width: 100%; text-align: center; background: #0d9488; color: #fff; text-decoration: none; font-weight: 800; padding: 14px; border-radius: 12px; margin-top: 14px; font-size: 15px; }}
    .btn-112 {{ display: block; width: 100%; text-align: center; background: #dc2626; color: #fff; text-decoration: none; font-weight: 800; padding: 14px; border-radius: 12px; margin-top: 10px; font-size: 14px; }}
    .muted {{ color: #94a3b8; font-size: 13px; margin-top: 6px; }}
    .stat-row {{ display: flex; gap: 12px; margin-top: 12px; }}
    .stat {{ flex: 1; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 12px; }}
    .stat-val {{ font-size: 20px; font-weight: 800; color: #fff; }}
    .stat-lbl {{ font-size: 12px; color: #94a3b8; margin-top: 2px; }}
    .safe-box {{ background: #ecfdf5; color: #064e3b; padding: 28px; border-radius: 16px; text-align: center; max-width: 480px; margin: 40px auto; }}
  </style>
</head>
<body>
  <div class="topbar">
    <div class="badge"><span class="dot" id="status-dot"></span><span id="status-title">LIVE EMERGENCY TRACKING</span></div>
    <a class="call-btn" href="tel:112">Call 112</a>
  </div>
  <div class="wrap" id="main-content">
    <div class="card">
      <h2 id="member-name">Connecting to SafeLink Telemetry...</h2>
      <p class="muted" id="status-msg">Refreshing GPS location every 4 seconds automatically.</p>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-val" id="coord-box">--</div>
          <div class="stat-lbl" id="acc-box">Waiting for GPS fix</div>
        </div>
        <div class="stat">
          <div class="stat-val" id="resp-count">0</div>
          <div class="stat-lbl">Volunteers Responding</div>
        </div>
      </div>
      <iframe id="map-iframe" class="map-frame" loading="eager"></iframe>
      <a id="gmaps-link" class="btn-nav" href="#" target="_blank" rel="noopener noreferrer">OPEN TURN-BY-TURN IN GOOGLE MAPS</a>
      <a class="btn-112" href="tel:112">CALL NATIONAL EMERGENCY 112</a>
    </div>
  </div>
  <script>
    const TOKEN = {safe_token_js};
    const API_URL = {json.dumps(api_prefix)} + "/tracking/" + encodeURIComponent(TOKEN);
    let lastLat = null, lastLon = null;
    async function poll() {{
      try {{
        const res = await fetch(API_URL, {{ cache: "no-store" }});
        const data = await res.json();
        if (!data.active) {{
          document.getElementById("status-dot").style.background = "#10b981";
          document.getElementById("status-title").textContent = "EMERGENCY CONCLUDED";
          const container = document.getElementById("main-content");
          container.innerHTML = '<div class="safe-box"><h2>Emergency Alert Ended</h2><p id="end-msg" style="margin-top:10px;font-size:14px;"></p><a class="btn-112" style="margin-top:18px;" href="tel:112">Call 112 if Still in Danger</a></div>';
          document.getElementById("end-msg").textContent = data.message || "This emergency tracking session has ended or the member marked safe.";
          return;
        }}
        const lat = Number(data.last_latitude || 0);
        const lon = Number(data.last_longitude || 0);
        const acc = Math.round(Number(data.accuracy_meters || 10));
        document.getElementById("member-name").textContent = (data.woman_name_initial || "SafeLink Member") + " — Live Distress Alert";
        document.getElementById("status-msg").textContent = "Last updated: " + new Date().toLocaleTimeString();
        document.getElementById("coord-box").textContent = lat.toFixed(5) + ", " + lon.toFixed(5);
        document.getElementById("acc-box").textContent = "Accuracy +/-" + acc + "m";
        document.getElementById("resp-count").textContent = String(data.active_responders_count || 0);
        document.getElementById("gmaps-link").href = "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon;
        if (lastLat !== lat || lastLon !== lon) {{
          lastLat = lat; lastLon = lon;
          document.getElementById("map-iframe").src =
            "https://www.openstreetmap.org/export/embed.html?bbox=" + (lon - 0.004) + "%2C" + (lat - 0.004) + "%2C" + (lon + 0.004) + "%2C" + (lat + 0.004) + "&layer=mapnik&marker=" + lat + "%2C" + lon;
        }}
      }} catch (e) {{
        document.getElementById("status-msg").textContent = "Reconnecting telemetry stream...";
      }}
    }}
    poll();
    setInterval(poll, 4000);
  </script>
</body>
</html>"""
    return HTMLResponse(content=page_html, status_code=200)
