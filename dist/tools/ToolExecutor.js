"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolExecutor = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
class ToolExecutor {
    async execute(toolName, args, context) {
        const tool = ToolRegistry_1.ToolRegistry.get(toolName);
        if (!tool) {
            return {
                success: false,
                error: `Tool '${toolName}' not found`
            };
        }
        // Validate required args are not undefined/null
        const required = tool.schema?.required || [];
        const missingArgs = required.filter((key) => args[key] === undefined || args[key] === null || args[key] === 'undefined');
        if (missingArgs.length > 0) {
            return {
                success: false,
                error: `Skipped ${toolName}: missing required args: ${missingArgs.join(', ')}`
            };
        }
        try {
            const result = await tool.execute(args, context);
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
exports.ToolExecutor = ToolExecutor;
