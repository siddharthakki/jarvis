# JARVIS Local Setup Guide

Follow these steps to initialize JARVIS on your local workstation.

## Prerequisites
- **Node.js**: v18+ recommended.
- **Python**: 3.10+ (for Telemetry Bridge).
- **Ollama**: Installed and running locally.
- **ComfyUI** (Optional): For high-fidelity image generation.
- **SearXNG** (Optional): For private web search (run via Docker).

## Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/siddharthakki/jarvis
    cd jarvis
    ```

2.  **Install Node Dependencies**:
    ```bash
    npm install
    ```

3.  **Install Python Requirements**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Prepare Credentials**:
    Create a `credentials.env` file in the root directory if you plan to use Google APIs or other external services.

## Running JARVIS

1.  **Start Ollama**: Ensure Ollama is running in the background.
2.  **Start JARVIS**:
    ```bash
    npm start
    ```
    This will automatically build the TypeScript source and launch the Electron HUD. The `bridge.py` server will be started as a background process by the main application.

## Troubleshooting

- **Bridge Token**: If you see "Unauthorized" errors, check `~/.jarvis/bridge.token` and ensure the bridge server has been restarted.
- **Model Loading**: JARVIS expects models like `qwen2.5-coder:14b` and `deepseek-r1:14b`. You can pull them via `ollama pull <model_name>`.
- **Path Access**: If JARVIS says "Access Denied" to a file, ensure the directory is listed in the `ALLOWED_ROOTS` in `src/tools/fileTools.ts` or configured as your `workspaceRoot`.
