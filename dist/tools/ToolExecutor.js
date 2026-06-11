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
