import asyncio
import json
import psutil
import time
import urllib.request
import xml.etree.ElementTree as ET
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Try to import GPU monitoring library
try:
    import GPUtil
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False

# Allow connections from the dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_news_cache: list[str] = []
_news_fetched_at: float = 0.0

async def fetch_news() -> list[str]:
    global _news_cache, _news_fetched_at
    if time.time() - _news_fetched_at < 300:
        return _news_cache

    def _do_fetch() -> list[str]:
        req = urllib.request.Request(
            "https://feeds.bbci.co.uk/news/rss.xml",
            headers={"User-Agent": "JARVIS/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            root = ET.fromstring(resp.read())
        headlines = []
        for item in root.findall("./channel/item")[:6]:
            title = item.findtext("title", "").strip()
            if title:
                headlines.append(title.upper())
        return headlines

    try:
        headlines = await asyncio.to_thread(_do_fetch)
        if headlines:
            _news_cache = headlines
            _news_fetched_at = time.time()
    except Exception as e:
        print(f"News fetch error: {e}")

    return _news_cache


@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket):
    await websocket.accept()
    print("Neural Link established with HUD.")

    try:
        tick = 0
        while True:
            try:
                # Collect actual OS metrics
                disk_path = 'C:\\' if psutil.WINDOWS else '/'

                data = {
                    "cpu": {
                        "usage": psutil.cpu_percent(interval=None),
                        "temp": 42
                    },
                    "ram": {
                        "percent": psutil.virtual_memory().percent,
                        "used": round(psutil.virtual_memory().used / (1024**3), 1),
                        "total": round(psutil.virtual_memory().total / (1024**3), 1)
                    },
                    "disk": {
                        "percent": psutil.disk_usage(disk_path).percent,
                        "free": round(psutil.disk_usage(disk_path).free / (1024**3), 1)
                    },
                    "network": {
                        "sent": psutil.net_io_counters().bytes_sent,
                        "recv": psutil.net_io_counters().bytes_recv
                    },
                    "gpu": {
                        "available": False,
                        "usage": 0,
                        "memory": 0
                    }
                }

                # Temperature handling (more robust)
                try:
                    temps = psutil.sensors_temperatures()
                    if temps and 'cpu_thermal' in temps:
                        data["cpu"]["temp"] = temps['cpu_thermal'][0].current
                except:
                    pass

                # Try to get GPU metrics
                if GPU_AVAILABLE:
                    try:
                        gpus = GPUtil.getGPUs()
                        if gpus:
                            gpu = gpus[0]
                            data["gpu"] = {
                                "available": True,
                                "usage": gpu.load * 100,
                                "memory": gpu.memoryUtil * 100,
                                "name": gpu.name
                            }
                    except Exception as e:
                        print(f"GPU monitoring error: {e}")

                # Fetch news
                if tick % 120 == 0:
                    headlines = await fetch_news()
                    if headlines:
                        data["news"] = headlines

                await websocket.send_text(json.dumps(data))
            except Exception as loop_err:
                print(f"Telemetry loop error: {loop_err}")

            await asyncio.sleep(0.5)  # 2Hz refresh rate
            tick += 1
    except Exception as e:
        print(f"Neural Link Severed: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

def free_port(port: int) -> None:
    """Kill any process already bound to *port* so we can claim it cleanly."""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            for conn in proc.connections(kind='inet'):
                if conn.laddr.port == port and conn.status in ('LISTEN', 'ESTABLISHED'):
                    print(f"Port {port} in use by PID {proc.pid} ({proc.name()}) — terminating.")
                    proc.terminate()
                    try:
                        proc.wait(timeout=3)
                    except psutil.TimeoutExpired:
                        proc.kill()
                    return
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass


if __name__ == "__main__":
    PORT = 8765
    free_port(PORT)
    print(f"Starting JARVIS Telemetry Server on http://0.0.0.0:{PORT}")
    # Bind to 0.0.0.0 to ensure accessibility across all interfaces
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
