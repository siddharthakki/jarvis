"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFilesTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// Search files tool
const searchFilesTool = {
    name: 'search_files',
    description: 'Search for files matching a pattern in a directory',
    schema: {
        type: 'object',
        properties: {
            pattern: {
                type: 'string',
                description: 'Pattern to search for (e.g., "*.ts", "test*.js")'
            },
            path: {
                type: 'string',
                description: 'Path to search in'
            }
        },
        required: ['pattern', 'path']
    },
    riskLevel: 'safe',
    mutatesWorkspace: false,
    requiresWorkspace: true,
    async execute(args, context) {
        const pattern = args.pattern;
        const searchPath = args.path;
        try {
            // In a real implementation, we would use a proper file search algorithm
            // For now, we'll simulate it by listing directory contents and filtering
            const items = await fs.readdir(searchPath);
            // Simple pattern matching (this is a simplified version)
            const results = [];
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            for (const item of items) {
                if (regex.test(item)) {
                    results.push(path.join(searchPath, item));
                }
            }
            return {
                success: true,
                data: results
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search files'
            };
        }
    }
};
exports.searchFilesTool = searchFilesTool;
// Register the tool
ToolRegistry_1.ToolRegistry.register(searchFilesTool);
