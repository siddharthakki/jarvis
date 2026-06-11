"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIPlanner = void 0;
const OllamaClient_1 = require("../ui/OllamaClient");
class AIPlanner {
    async plan(input, context, statusCallback) {
        const status = statusCallback ?? (() => { });
        try {
            const routing = this.routeTask(input);
            const os = require('os');
            const platform = os.platform();
            const isWindows = platform === 'win32';
            const systemPrompt = `
You are JARVIS, a real-world multi-agent AI operating system.
Mission: Autonomous chief-of-staff, technical architect, automation engineer, researcher, and productivity manager.

MODEL ROUTING:
- Brain (Deep Reasoning): deepseek-r1:14b
- Coding (Architect): qwen3-coder:30b
- Coding (Express): qwen2.5-coder:14b
- Tool Specialist: nexusraven:13b
- Vision: qwen2.5vl:7b
- Instant Chat: llama3.2:1b
- Memory: nomic-embed-text

HOST PLATFORM: ${platform} (${isWindows ? 'Windows' : 'Unix'})
CURRENT DIRECTORY: ${process.cwd()}
PYTHON VERSION: Python 3.14.5 (Available via 'python')

CORE OPERATING PRINCIPLES:
1. Reduce manual effort.
2. Automate repetitive tasks.
3. Prioritize privacy, safety, and reliability.
4. You have FULL access to the local filesystem via tools. You can create, read, and modify any file (subject to user approval).
5. Do not hallucinate restrictions. If you need to create a file, use 'write_file'.

TASK EXECUTION LOOP:
1. Understand intent. 2. Check memory. 3. Classify. 4. Execute safely. 5. Verify.

AVAILABLE TOOLS:
- read_file(path), write_file(path, content), append_file(path, content), list_directory(path), search_files(pattern, path): Filesystem tools.
- run_command(command): Execute shell (PowerShell/Bash).
- web_search(query): Internet intelligence retrieval.
- fetch_web_page(url): Deep site reconnaissance.
- take_screenshot(): Optical sensors (Captures screen).
- system_control(action, value): Controls (volume_up, volume_down, mute, launch_app, open_url, stop_speech).
- remember_fact(fact, tags): Store important info in long-term memory.
- search_knowledge_base(query): Search long-term memory and indexed files.
- index_file(path): Add a file to the knowledge base for future RAG.
- list_ollama_models(): List all locally installed Ollama models.
- generate_image(prompt): Create a high-quality image locally. Utilizes ComfyUI (RTX 3090) for ultra-hd or Ollama for rapid prototyping.

AGENT STRATEGY:
- For "create a file", "write code", or "save this", ALWAYS use 'write_file'.
- You can write Python, JavaScript, TypeScript, HTML, CSS, or any other format.
- For "Latest News" or "What is happening", ALWAYS use 'web_search' first.

OUTPUT FORMAT (JSON ONLY):
{
  "actions": [
    { "toolName": "tool_name", "args": { "key": "value" } }
  ],
  "response": "### Understanding\\n...\\n\\n### Plan\\n...\\n\\n### Agents Used\\n...\\n\\n### Result\\n[Your polite, British-accented J.A.R.V.I.S. response to Sir here]\\n\\n### Next Best Action\\n...",
  "context": { "agent": "${routing.role}", "platform": "${platform}" }
}

Constraint: The '### Result' section must be the actual message you speak to Sir. Use double backslashes for Windows paths. Respond ONLY with JSON.
`;
            status(`Routing to ${routing.reason} (${this.modelMap()[routing.role]})...`);
            status(`Thinking...`);
            const planResult = await OllamaClient_1.ollamaClient.generatePlan(`${systemPrompt}\n\nUser Request: "${input}"\n\nContext Memory: ${JSON.stringify(context || {})}`, routing.role);
            if (planResult.success && planResult.data?.parsedPlan) {
                const plan = planResult.data.parsedPlan;
                if (plan.actions?.length) {
                    status(`Plan ready — executing ${plan.actions.length} action(s)...`);
                }
                return plan;
            }
            else {
                status(`Neural link timeout — using fallback plan.`);
                return this.fallbackPlan(input, context);
            }
        }
        catch (error) {
            const msg = error instanceof Error && error.message.includes('abort')
                ? `Neural link timed out after 2 minutes, Sir. Try a simpler query.`
                : `Planning error — using fallback.`;
            status(msg);
            return this.fallbackPlan(input, context);
        }
    }
    modelMap() {
        return {
            chat: 'llama3.2:1b',
            brain: 'deepseek-r1:14b',
            coding: 'qwen3-coder:30b',
            coding_fast: 'qwen2.5-coder:14b',
            tool_use: 'nexusraven:13b',
            vision: 'qwen2.5vl:7b',
            embedding: 'nomic-embed-text',
        };
    }
    routeTask(input) {
        const lower = input.toLowerCase();
        // 1. Vision Tasks
        if (lower.includes('look at') || lower.includes('see') || lower.includes('screenshot'))
            return { role: 'vision', reason: 'Vision' };
        // 2. Heavy Coding
        if (lower.includes('code') || lower.includes('debug') || lower.includes('refactor') || lower.includes('architecture')) {
            return { role: 'coding', reason: 'Architectural Coding' };
        }
        // 3. Fast Scripts
        if (lower.includes('script') || lower.includes('python') || lower.includes('small fix')) {
            return { role: 'coding_fast', reason: 'Fast Scripting' };
        }
        // 4. Automation & Multi-Tool Workflow
        if (lower.includes('automate') || lower.includes('workflow') || lower.includes('scheduler') || lower.includes('generate image') || lower.includes('paint') || lower.includes('draw') || lower.includes('ollama') || lower.includes('models')) {
            return { role: 'tool_use', reason: 'Automation Engine' };
        }
        // 5. High-Level Reasoning / "Thinking" Questions
        if (lower.includes('why') || lower.includes('how') || lower.includes('compare') || lower.includes('analyze')) {
            return { role: 'brain', reason: 'Deep Reasoning (DeepSeek-R1)' };
        }
        // 6. Default: Instant Chat for everything else (Greetings, simple requests)
        return { role: 'chat', reason: 'Instant Interface' };
    }
    fallbackPlan(input, context) {
        const actions = [];
        const lowerInput = input.toLowerCase().trim();
        let response = `### Result
I'm working on that for you, Sir.`;
        // Check for specific queries first (before greeting shortcuts)
        if (lowerInput.includes('weather')) {
            // Extract location if mentioned, otherwise use generic weather query
            const locationMatch = input.match(/weather\s+(?:in|for|at)?\s+(.+?)(?:\?|$)/i);
            const location = locationMatch ? locationMatch[1].trim() : 'your location';
            const query = `weather in ${location}`;
            actions.push({ toolName: 'web_search', args: { query } });
            response = `### Understanding
You've asked about weather conditions.

### Plan
1. Search for current weather information in ${location}.

### Result
Searching for weather information in ${location}, Sir. Stand by for meteorological data.`;
        }
        else if (lowerInput.includes('news') || lowerInput.includes('today')) {
            // Handle news/what's new queries
            const query = lowerInput.includes('today')
                ? 'top news today'
                : 'latest news';
            actions.push({ toolName: 'web_search', args: { query } });
            response = `### Understanding
You've requested current information about today's developments.

### Plan
1. Query the global intelligence network for latest developments.
2. Retrieve top news and insights.

### Result
Accessing the intelligence network for today's briefing, Sir. Retrieving latest developments now.`;
        }
        else if (lowerInput.includes('search') || lowerInput.includes('find')) {
            // Handle generic search queries
            const searchQuery = this.extractSearchQuery(input);
            if (searchQuery) {
                actions.push({ toolName: 'web_search', args: { query: searchQuery } });
                response = `### Understanding
You've requested information search.

### Plan
1. Query the global network for "${searchQuery}".

### Result
Searching for ${searchQuery}, Sir. Accessing intelligence network.`;
            }
        }
        else if (lowerInput.includes('read file')) {
            actions.push({ toolName: 'read_file', args: { path: this.extractFilePath(input) } });
            response = `### Understanding
You've requested file retrieval.

### Plan
1. Read file from the filesystem.

### Result
Accessing file system, Sir.`;
        }
        else if (lowerInput.includes('list directory')) {
            actions.push({ toolName: 'list_directory', args: { path: this.extractDirectoryPath(input) } });
            response = `### Understanding
You've requested directory listing.

### Plan
1. List directory contents.

### Result
Enumerating directory, Sir.`;
        }
        else if (lowerInput.includes('ollama') || lowerInput.includes('models')) {
            actions.push({ toolName: 'list_ollama_models', args: {} });
            response = `### Understanding
You've requested a list of installed neural models.

### Plan
1. Query the local Ollama instance for installed models.

### Result
Retrieving the list of installed neural models for you, Sir.`;
        }
        else if (lowerInput.includes('stop talking') || lowerInput.includes('be quiet') || lowerInput.includes('shut up') || lowerInput.includes('kill tts')) {
            actions.push({ toolName: 'system_control', args: { action: 'stop_speech' } });
            response = `### Result
Understood, Sir. Silencing all audio outputs immediately.`;
        }
        else if (lowerInput.includes('hi') || lowerInput.includes('hello')) {
            response = `### Result
Hello Sir. All systems are operational. How can I assist you today?`;
        }
        return { actions, response, context: context || {} };
    }
    extractFilePath(input) {
        const match = input.match(/file\s+["']([^"']+)["']/i) || input.match(/file\s+(.+?)(?:\s|$)/i);
        return match ? match[1].trim() : './';
    }
    extractDirectoryPath(input) {
        const match = input.match(/directory\s+(.+?)(?:\s|$)/i) || input.match(/path\s+(.+?)(?:\s|$)/i);
        return match ? match[1].trim() : '.';
    }
    extractSearchQuery(input) {
        // Remove search/find keywords and return the rest as query
        const match = input.match(/(?:search|find|look for)\s+(?:for\s+)?(.+?)(?:\?|$)/i);
        return match ? match[1].trim() : '';
    }
}
exports.AIPlanner = AIPlanner;
