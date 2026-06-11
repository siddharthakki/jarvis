# JARVIS Security Architecture

JARVIS has been upgraded with a multi-layered security model to ensure safe and reliable local operation.

## 1. Electron Hardening
- **Context Isolation**: The renderer process is fully isolated from the main Node.js environment.
- **Node Integration Disabled**: Renderer cannot access Node.js APIs directly.
- **Preload Scripts**: Only specific, safe IPC methods are exposed to the UI via `window.jarvis`.
- **Web Security**: Standard web security features are enabled to prevent unauthorized resource loading.

## 2. Telemetry Bridge Security
- **Localhost Binding**: `bridge.py` only listens on `127.0.0.1`. It is not accessible from the network.
- **Auth Token**: A unique 32-byte hex token is generated on first run (`~/.jarvis/bridge.token`).
- **Authorization**: All sensitive commands sent to `/control` require this token.
- **CORS Restricted**: Only local origins are permitted to communicate with the bridge.

## 3. Tool Policy & Risk Levels
- **Risk Classification**: Every tool has a defined `riskLevel` (`safe`, `low`, `medium`, `high`, `critical`).
- **Policy Engine**: Evaluates tool calls against configuration and risk levels.
- **Approval Flow**: High-risk tools (e.g., `run_command`, `write_file`, `computer_control`) always require explicit user approval via a secure HUD overlay.
- **Request IDs**: Every approval request has a unique ID and a 60-second timeout to prevent cross-resolution or hanging requests.

## 4. Path Containment
- **Restricted Access**: Filesystem tools are restricted to specific "Allowed Roots" (e.g., `C:\Projects`, `~/.jarvis`).
- **Traversal Protection**: Uses robust path normalization and relative path checks to prevent `../` directory traversal attacks.

## 5. Command Safety
- **Risk Classifier**: Analyzes shell commands for destructive patterns (e.g., `rm -rf`, `format`).
- **Critical Block**: Commands classified as `critical` risk are automatically blocked regardless of user approval settings.
