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
exports.takeScreenshotTool = void 0;
const ToolRegistry_1 = require("./ToolRegistry");
const electron_1 = require("electron");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Vision Tool - Allows JARVIS to see your screen
 */
const takeScreenshotTool = {
    name: 'take_screenshot',
    description: 'Captures the current screen contents so JARVIS can analyze what you are looking at',
    schema: {
        type: 'object',
        properties: {
            displayId: {
                type: 'string',
                description: 'ID of the display to capture (defaults to primary)'
            }
        }
    },
    riskLevel: 'medium',
    mutatesWorkspace: false,
    requiresWorkspace: false,
    async execute(args, context) {
        try {
            const sources = await electron_1.desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: electron_1.screen.getPrimaryDisplay().workAreaSize
            });
            const primarySource = sources[0];
            if (!primarySource)
                throw new Error('No screen source found');
            // Create a temporary file for the screenshot
            const tempPath = path.join(process.cwd(), 'temp_vision_capture.png');
            const imageBuffer = primarySource.thumbnail.toPNG();
            await fs.writeFile(tempPath, imageBuffer);
            return {
                success: true,
                data: {
                    path: tempPath,
                    message: "Screen captured. Analyzing optical data, Sir.",
                    base64: imageBuffer.toString('base64')
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to initialize optical sensors'
            };
        }
    }
};
exports.takeScreenshotTool = takeScreenshotTool;
ToolRegistry_1.ToolRegistry.register(takeScreenshotTool);
