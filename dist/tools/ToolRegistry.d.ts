import { Tool } from './ToolTypes';
export declare class ToolRegistry {
    private static registry;
    static register(tool: Tool): void;
    static get(name: string): Tool | undefined;
    static all(): Tool[];
    static unregister(name: string): boolean;
}
