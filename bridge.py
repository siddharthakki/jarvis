import asyncio
import json
import psutil
import time
import urllib.request
import xml.etree.ElementTree as ET
import uvicorn
import os
import secrets
from pathlib import Path
from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- Auth Token Management ---
def get_auth_token():
    # Use .jarvis directory in home folder for persistence
    jarvis_dir = Path.home() / ".jarvis"
    jarvis_dir.mkdir(parents=True, exist_ok=True)
    token_path = jarvis_dir / "bridge.token"

    if token_path.exists():
        try:
            return token_path.read_text().strip()
        except Exception as e:
            print(f"Error reading token: {e}")

    # Generate new token if not exists or unreadable
    token = secrets.token_hex(32)
    try:
        token_path.write_text(token)
        # Set permissions to read/write only by owner if on Unix
        if os.name != 'nt':
            os.chmod(token_path, 0o600)
        print(f"✓ Generated new JARVIS bridge auth token: {token_path}")
    except Exception as e:
        print(f"Warning: Could not save auth token to disk: {e}")

    return token

AUTH_TOKEN = get_auth_token()

# Try to import GPU monitoring library
try:
    import GPUtil
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False

# Try to import pyautogui for computer control
try:
    import pyautogui
    # Fail-safe settings for pyautogui
    pyautogui.FAILSAFE = True
    PYAUTOGUI_AVAILABLE = True
except ImportError:
    PYAUTOGUI_AVAILABLE = False

# Try to import faster-whisper for offline STT
try:
    import numpy as np
    from faster_whisper import WhisperModel
    # Load the model once at startup
    model = WhisperModel("base", device="cpu", compute_type="int8")
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    print("Warning: faster-whisper not installed. /ws/stt endpoint will be disabled.")
    FASTER_WHISPER_AVAILABLE = False

# Restrict CORS to localhost only for security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1"],
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

@app.post("/control")
async def computer_control(payload: dict):
    # Security: Verify auth token
    if payload.get("token") != AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid bridge token")

    if not PYAUTOGUI_AVAILABLE:
        return {"success": False, "error": "pyautogui not installed"}

    action = payload.get("action")
    try:
        if action == "mouse_move":
            pyautogui.moveTo(payload["x"], payload["y"], duration=0.2)
        elif action == "mouse_click":
            pyautogui.click(payload.get("x"), payload.get("y"), button=payload.get("button", "left"))
        elif action == "mouse_double_click":
            pyautogui.doubleClick(payload.get("x"), payload.get("y"))
        elif action == "key_press":
            pyautogui.press(payload["key"])
        elif action == "type_text":
            pyautogui.typewrite(payload["text"], interval=0.05)
        elif action == "hotkey":
            pyautogui.hotkey(*payload["keys"])
        elif action == "scroll":
            pyautogui.scroll(payload.get("clicks", 3), x=payload.get("x"), y=payload.get("y"))
        elif action == "screenshot":
            img = pyautogui.screenshot()
            import io, base64
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            return {"success": True, "image": base64.b64encode(buf.getvalue()).decode()}
        else:
            return {"success": False, "error": f"Unknown action: {action}"}
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

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


# Add STT WebSocket endpoint if faster-whisper is available
if FASTER_WHISPER_AVAILABLE:
    @app.websocket("/ws/stt")
    async def stt_stream(websocket: WebSocket):
        await websocket.accept()
        print("STT connection established")
        
        # Buffer to accumulate audio data
        audio_buffer = bytearray()
        buffer_size = 96000  # ~3 seconds of 16kHz int16 audio (96000 bytes)
        
        try:
            while True:
                try:
                    # Accept either binary audio or JSON control messages
                    message = await websocket.receive()
                    if "text" in message:
                        try:
                            ctrl = json.loads(message["text"])
                            # Check token for control messages if needed
                            # token = ctrl.get("token")
                            if ctrl.get("type") == "clear":
                                audio_buffer.clear()
                        except Exception:
                            pass
                        continue
                    data = message.get("bytes", b"")
                    if not data:
                        continue
                    audio_buffer.extend(data)

                    # Process when buffer is full
                    if len(audio_buffer) >= buffer_size:
                        # Convert to float32 normalized to [-1, 1] as faster-whisper requires
                        audio_array = np.frombuffer(audio_buffer, dtype=np.int16).astype(np.float32) / 32768.0

                        # Run transcription
                        segments, info = model.transcribe(audio_array, language="en", beam_size=1)
                        text = "".join(segment.text for segment in segments).strip()
                        
                        # Check for wake word
                        wake_word_detected = "jarvis" in text.lower()
                        
                        # Send back result
                        response = {
                            "text": text,
                            "is_final": True,
                            "wake_word": wake_word_detected
                        }
                        
                        await websocket.send_text(json.dumps(response))
                        
                        # Clear buffer for next chunk
                        audio_buffer.clear()
                        
                except Exception as e:
                    print(f"STT processing error: {e}")
                    # Send empty response on error
                    await websocket.send_text(json.dumps({"text": "", "is_final": True}))
        except Exception as e:
            print(f"STT connection error: {e}")
        finally:
            try:
                await websocket.close()
            except:
                pass


if __name__ == "__main__":
    PORT = 8765
    print(f"Starting JARVIS Telemetry Server on http://127.0.0.1:{PORT}")
    # Bind to 127.0.0.1 for security - local only!
    try:
        uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="info")
    except Exception as e:
        print(f"CRITICAL ERROR: Could not start bridge server. Port {PORT} might be in use.")
        print(f"Details: {e}")
        os._exit(1)
