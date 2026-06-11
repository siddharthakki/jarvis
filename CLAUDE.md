# Jarvis — Agent Orientation Guide

**DO NOT re-read source files on every session.** Load from memory first (`~/.claude/projects/c--Projects-Jarvis/memory/`). Only read a file if it is new or you cannot find it in memory. This saves tokens.

---

## Token Efficiency Rules

1. **Memory first** — check MEMORY.md before exploring any file.
2. **New files only** — run `git status` or `git diff --name-only HEAD~1` to see what changed; only read those.
3. **Delegate heavy work** — see Helper Routing below.
4. **No redundant reads** — if a file was read this session, don't read it again.

---

## Helper Routing (delegate to save tokens)

| Task | Delegate to | Why |
|------|------------|-----|
| Long code generation / boilerplate | **Cline** (VS Code extension) | Keeps code edits out of Claude main context |
| Web research / large doc parsing | **Gemini CLI** (`gemini -p "..."`) | Gemini has 1M context; use for large file summarization |
| Embedding / RAG queries | **Ollama `nomic-embed-text`** | Already configured in AIPlanner; use it |
| Repetitive file transforms | **Cline** | Let it handle multi-file edits |
| Test generation | **Cline** | Boilerplate-heavy, doesn't need Claude reasoning |

**How to call Gemini from terminal:**
```powershell
gemini -p "Summarize this file: $(Get-Content src/agent/AgentRuntime.ts -Raw)"
```

**How to trigger Cline:** open VS Code command palette → `Cline: New Task` → describe the task.

---

## Project: What Jarvis Is

Personal AI desktop assistant (Electron + TypeScript + Ollama). Always-listening, voice-activated, permission-gated tool executor. Runs locally, privacy-first.

**Entry point:** `src/main.ts` → Electron app boots, loads all tools, creates AgentRuntime + MainWindow.

**Core pipeline:**
```
Voice/Text → MainWindow (IPC) → AgentRuntime → AIPlanner (Ollama qwen3:14b)
    → PolicyEngine → ToolExecutor → result → UI response
```

---

## Source Files — What Each Does (cached; don't re-read unless changed)

### Agent Core
| File | Purpose |
|------|---------|
| `src/agent/AgentRuntime.ts` | Orchestrates pipeline: context → plan → policy → execute |
| `src/agent/AIPlanner.ts` | NLP via Ollama; routes to qwen3:14b/coder/vision; returns JSON plan |
| `src/agent/ContextManager.ts` | Session/project/preference memory; persists to `~/.jarvis/memory.json` |
| `src/agent/AutomationEngine.ts` | Multi-step workflow executor (chaining, context passing) — **not yet wired to AgentRuntime** |
| `src/agent/Plan.ts` / `PlanInterface.ts` | Plan data types |

### Policy / Security
| File | Purpose |
|------|---------|
| `src/policy/PolicyEngine.ts` | Combines RiskClassifier + PermissionEvaluator; returns allow/ask/deny |
| `src/policy/RiskClassifier.ts` | Maps tools + shell commands to risk level (safe/low/medium/high/critical) |
| `src/policy/PermissionEvaluator.ts` | Allow-list / deny-list decision maker |
| `src/policy/ApprovalFlow.ts` | Sends approval dialog to UI via IPC; console fallback |

### Tools (all registered at startup in main.ts)
| File | Tools |
|------|-------|
| `src/tools/fileTools.ts` | read_file, write_file, append_file, list_directory |
| `src/tools/searchTools.ts` | search_files |
| `src/tools/commandTools.ts` | run_command (PowerShell) |
| `src/tools/emailTools.ts` | send_email, read_inbox |
| `src/tools/reminderTools.ts` | set_reminder, get_reminders |
| `src/tools/deviceTools.ts` | list_devices, control_device, get_device_status — **stub** |
| `src/tools/webTools.ts` | web_search (SearXNG localhost:8081), fetch_web_page |
| `src/tools/visionTools.ts` | take_screenshot |
| `src/tools/systemTools.ts` | system_control (volume, launch_app, open_url) |

### UI / Services
| File | Purpose |
|------|---------|
| `src/ui/MainWindow.ts` | Electron window; IPC bridge; loads src/ui/index.html |
| `src/ui/VoiceHandler.ts` | Web Speech API; wake word "jarvis"; continuous listen |
| `src/ui/OllamaClient.ts` | HTTP client for Ollama; model role map |
| `src/ui/TrayController.ts` | System tray icon + context menu |
| `src/ui/StatusBarController.ts` | Status / notification updates via IPC |
| `src/services/MailService.ts` | SMTP/IMAP; config from `~/.jarvis/email-config.json` or env |
| `src/services/ReminderService.ts` | In-memory + JSON-persisted reminders; Electron Notification callback |
| `src/services/DeviceService.ts` | Device stub |
| `bridge.py` | Separate FastAPI WebSocket server (port 8000); streams CPU/RAM/GPU/news — **not yet integrated into Electron UI** |

---

## What's Pending (priority order)

| # | Gap | Status | Notes |
|---|-----|--------|-------|
| 1 | **TTS — no voice output** | ✅ Done | say.js wired into AgentRuntime via setSpeakCallback |
| 2 | **AutomationEngine not used** | ✅ Done | Wired into AgentRuntime.executePlan |
| 3 | **No scheduled/proactive tasks** | ✅ Done | SchedulerService + node-cron + schedulerTools.ts |
| 4 | **Windows autostart** | ✅ Done | app.setLoginItemSettings in main.ts |
| 5 | **SearXNG not guaranteed running** | ✅ Done | DuckDuckGo HTML fallback in webTools.ts |
| 6 | **Email setup not guided** | ✅ Done | MailService.isConfigured() check on startup |
| 7 | **bridge.py HUD disconnected** | ✅ Done | WebSocket client in index.html → ws://localhost:8765 |
| 8 | **RAG memory recall** | ✅ Done | embeddings.bin + cosine similarity in ContextManager; wired into AgentRuntime |
| 9 | **Calendar integration** | ✅ Done | CalendarService + Google OAuth + calendarTools.ts |
| 10 | **Device stubs** | ✅ Done | WMI via PowerShell in DeviceService.ts |
| 11 | **Offline wake word** | ⏳ Blocked | Waiting on Porcupine API key; Python sidecar in bridge.py |
| 12 | **Chat UI minimal** | 🔲 Not started | index.html needs real chat history panel |

---

## External Dependencies Required

| Service | Port | Required for |
|---------|------|-------------|
| Ollama | 11434 | All AI features |
| SearXNG | 8081 | web_search tool |
| Email SMTP/IMAP | varies | email tools |
| Microphone | — | voice recognition |

**Ollama models needed:**
```
ollama pull qwen3:14b          # main brain
ollama pull qwen3-coder:30b    # coding tasks
ollama pull qwen2.5vl:7b       # vision
ollama pull nomic-embed-text   # embeddings/RAG
```

---

## Config & Data Paths

| Path | Contents |
|------|---------|
| `~/.jarvis/memory.json` | Persistent agent memory (auto-created) |
| `~/.jarvis/reminders.json` | Saved reminders (auto-created) |
| `~/.jarvis/email-config.json` | SMTP/IMAP credentials (manual setup) |

---

## Build & Run

```powershell
npm run build   # compile TypeScript → dist/
npm start       # build + launch Electron
npm test        # Jest (minimal coverage currently)
npm run watch   # continuous TypeScript compilation
```
