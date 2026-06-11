"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
class ToolRegistry {
    static register(tool) {
        this.registry.set(tool.name, tool);
    }
    static get(name) {
        return this.registry.get(name);
    }
    static all() {
        return Array.from(this.registry.values());
    }
    static unregister(name) {
        return this.registry.delete(name);
    }
}
exports.ToolRegistry = ToolRegistry;
ToolRegistry.registry = new Map();
