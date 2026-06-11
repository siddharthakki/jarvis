import { Tool } from './ToolTypes';

export class ToolRegistry {
  private static registry = new Map<string, Tool>();
  
  static register(
    tool: Tool
  ): void {
    this.registry.set(tool.name, tool);
  }
  
  static get(name: string): Tool | undefined {
    return this.registry.get(name);
  }
  
  static all(): Tool[] {
    return Array.from(this.registry.values());
  }
  
  static unregister(name: string): boolean {
    return this.registry.delete(name);
  }
}