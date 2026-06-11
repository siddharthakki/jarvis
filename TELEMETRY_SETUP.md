# JARVIS Telemetry System Setup Guide

## Overview
JARVIS now includes a complete system telemetry monitoring system that displays:
- **CPU Load** - Real-time CPU usage
- **Memory Usage** - RAM consumption
- **GPU Usage** - GPU load (if available)
- **System Status** - Connection link indicator

## Quick Start

### Option 1: Automatic Setup (Recommended)
Run the complete startup script which installs dependencies and starts everything:

```bash
start-jarvis-complete.bat
```

This will:
1. Install Python dependencies from `requirements.txt`
2. Build the JARVIS TypeScript application
3. Start the telemetry server on `http://localhost:8000`
4. Launch the JARVIS application

### Option 2: Manual Setup

#### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- `fastapi==0.109.0` - Web framework
- `uvicorn==0.27.0` - ASGI server
- `psutil==5.9.8` - System monitoring (CPU, RAM, disk)
- `GPUtil==1.4.0` - GPU monitoring (optional, auto-detected)

#### Step 2: Start Telemetry Server
In a separate terminal/PowerShell window:
```bash
python bridge.py
```

Or use the helper script:
```bash
start-telemetry-server.bat
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
Neural Link established with HUD.
```

#### Step 3: Build and Run JARVIS
```bash
npm run build
npm start
```

## System Telemetry Components

### CPU_LOAD
- Shows real-time CPU usage percentage
- Updates 2 times per second
- Blue cyan color (#00F3FF)

### MEMORY_USAGE
- Shows RAM usage percentage
- Updates 2 times per second
- Green color (#00FF66)

### GPU_USAGE (If Available)
- Shows GPU load percentage
- Only displays if GPU is detected
- Amber/orange color (#FF9F00)
- Automatically displays GPU name (e.g., "NVIDIA RTX 4090 LOAD")

### LINK Indicator
- **LINK: OFFLINE** (Amber) - Telemetry server not connected
- **LINK: ONLINE** (Green) - Telemetry server connected and streaming

## Troubleshooting

### "LINK: OFFLINE" in JARVIS
**Problem**: Telemetry shows offline but server is running

**Solutions**:
1. Ensure telemetry server is running on port 8000
   ```bash
   netstat -ano | findstr :8000
   ```

2. Check firewall isn't blocking localhost connections

3. Verify Python dependencies are installed
   ```bash
   pip list | findstr -E "fastapi|uvicorn|psutil"
   ```

4. Restart both the telemetry server and JARVIS

### GPU Not Showing
**Problem**: GPU_USAGE panel doesn't appear even with dedicated GPU

**Solutions**:
1. GPU monitoring requires GPUtil package
   ```bash
   pip install GPUtil
   ```

2. On NVIDIA GPUs, may need CUDA toolkit installed

3. Check GPU is compatible (requires NVIDIA or AMD with drivers)

4. Run as administrator on Windows for full hardware access

### Python Not Found
**Problem**: "Python is not installed or not in PATH"

**Solution**: 
1. Install Python 3.8+ from https://www.python.org/
2. During installation, CHECK "Add Python to PATH"
3. Restart terminal/PowerShell after installation

## Architecture

### Telemetry Server (bridge.py)
- **Framework**: FastAPI + Uvicorn
- **Endpoint**: `ws://localhost:8000/ws/telemetry`
- **Update Rate**: 2 Hz (500ms)
- **Data**: CPU, RAM, Disk, Network, GPU (if available)

### Frontend (src/ui/index.html)
- **WebSocket Client**: Connects to telemetry endpoint
- **Display Update**: Real-time progress bars and percentages
- **Graceful Degradation**: Works without GPU data

### Data Structure
```json
{
  "cpu": {
    "usage": 45.5,
    "temp": 65
  },
  "ram": {
    "percent": 62.3,
    "used": 10.2,
    "total": 16.0
  },
  "gpu": {
    "available": true,
    "usage": 78.5,
    "memory": 45.2,
    "name": "NVIDIA RTX 4090"
  },
  "disk": {...},
  "network": {...}
}
```

## Files Modified/Created

### New Files
- `requirements.txt` - Python dependencies
- `start-jarvis-complete.bat` - Complete startup script
- `start-telemetry-server.bat` - Telemetry server only script
- `bridge.py` - Updated with GPU support

### Modified Files
- `src/ui/index.html` - Added GPU panel and telemetry handler
- HTML JavaScript - Enhanced to display GPU data

## Performance Notes

- Telemetry updates at 2 Hz (500ms intervals)
- CPU/RAM monitoring has minimal overhead
- GPU monitoring adds ~50-100ms per query (depends on driver)
- WebSocket connection maintains single persistent socket
- All updates are non-blocking async operations

## Future Enhancements

Possible additions:
- Disk I/O monitoring
- Network bandwidth monitoring
- Process-level CPU/memory tracking
- Temperature monitoring with alerts
- Historical data graphing
- Custom threshold warnings
