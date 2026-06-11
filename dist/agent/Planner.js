"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Planner = void 0;
const OllamaClient_1 = require("../ui/OllamaClient");
class Planner {
    async plan(input, context) {
        try {
            // Use Ollama to generate a structured plan from natural language input
            const planResult = await OllamaClient_1.ollamaClient.generatePlan(`Analyze this request and create a structured plan for execution:
      
Request: "${input}"
      
Please provide the response in JSON format with the following structure:
{
  "actions": [
    {
      "toolName": "string",
      "args": {
        "key": "value"
      }
    }
  ],
  "context": {}
}

Make sure to include only the JSON object without any additional text.`);
            if (planResult.success && planResult.data) {
                // Return the structured plan from Ollama
                return planResult.data.parsedPlan;
            }
            else {
                // Fallback to basic planning logic if Ollama fails
                console.warn('Ollama planning failed, falling back to basic planning:', planResult.error);
                return this.fallbackPlan(input, context);
            }
        }
        catch (error) {
            console.error('Error in Ollama-based planning:', error);
            // Fallback to basic planning logic if there's an error
            return this.fallbackPlan(input, context);
        }
    }
    fallbackPlan(input, context) {
        // Enhanced planning logic with better natural language understanding
        const actions = [];
        const lowerInput = input.toLowerCase().trim();
        // Parse input and determine what actions are needed
        if (lowerInput.includes('read file') || lowerInput.includes('open file')) {
            actions.push({
                toolName: 'read_file',
                args: { path: this.extractFilePath(input) }
            });
        }
        else if (lowerInput.includes('write to file') || lowerInput.includes('save to file') || lowerInput.includes('create file')) {
            actions.push({
                toolName: 'write_file',
                args: { path: this.extractFilePath(input), content: this.extractContent(input) }
            });
        }
        else if (lowerInput.includes('search for') || lowerInput.includes('find files') || lowerInput.includes('look for')) {
            actions.push({
                toolName: 'search_files',
                args: { pattern: this.extractSearchPattern(input), path: this.extractSearchPath(input) }
            });
        }
        else if (lowerInput.includes('run command') || lowerInput.includes('execute') || lowerInput.includes('run')) {
            actions.push({
                toolName: 'run_command',
                args: { command: this.extractCommand(input) }
            });
        }
        else if (lowerInput.includes('list directory') || lowerInput.includes('show files')) {
            actions.push({
                toolName: 'list_directory',
                args: { path: this.extractDirectoryPath(input) }
            });
        }
        else if (lowerInput.includes('git status') || lowerInput.includes('git diff') || lowerInput.includes('git log')) {
            actions.push({
                toolName: 'git_status',
                args: { command: this.extractGitCommand(input) }
            });
        }
        return {
            actions,
            context: context || {}
        };
    }
    extractFilePath(input) {
        // Enhanced extraction logic for file paths
        const patterns = [
            /file\s+["']([^"']+)["']/i,
            /file\s+(.+?)(?:\s+with|\s+content|\s+to|$)/i,
            /read\s+file\s+(.+?)(?:\s+with|\s+content|\s+to|$)/i,
            /open\s+file\s+(.+?)(?:\s+with|\s+content|\s+to|$)/i
        ];
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return './';
    }
    extractContent(input) {
        // Enhanced extraction logic for content
        const match = input.match(/with\s+content\s+(.+?)(?:\s+or|$)/i) ||
            input.match(/to\s+(.+?)(?:\s+or|$)/i);
        return match ? match[1] : 'content extracted from input';
    }
    extractSearchPattern(input) {
        // Enhanced extraction logic for search patterns
        const match = input.match(/search\s+(?:for\s+)?(.+?)(?:\s+in|\s+path|$)/i) ||
            input.match(/find\s+(.+?)(?:\s+in|\s+path|$)/i);
        return match ? match[1].trim() : '*';
    }
    extractSearchPath(input) {
        // Extract search path if specified
        const match = input.match(/in\s+(.+?)(?:\s+or|$)/i);
        return match ? match[1].trim() : '.';
    }
    extractCommand(input) {
        // Enhanced extraction logic for commands
        const match = input.match(/command\s+(.+?)(?:\s+with|\s+args|$)/i) ||
            input.match(/run\s+(.+?)(?:\s+with|\s+args|$)/i);
        return match ? match[1].trim() : 'echo "default command"';
    }
    extractDirectoryPath(input) {
        // Extract directory path for listing
        const patterns = [
            /directory\s+(.+?)(?:\s+or|\s+in|\s+path|$)/i,
            /path\s+(.+?)(?:\s+in|\s+or|\s+to|$)/i,
            /list\s+directory\s+(.+?)(?:\s+or|\s+in|\s+path|$)/i,
            /show\s+files\s+(.+?)(?:\s+or|\s+in|\s+path|$)/i
        ];
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return '.';
    }
    extractGitCommand(input) {
        // Extract git command
        if (input.includes('git status'))
            return 'status';
        if (input.includes('git diff'))
            return 'diff';
        if (input.includes('git log'))
            return 'log';
        return 'status'; // default
    }
}
exports.Planner = Planner;
