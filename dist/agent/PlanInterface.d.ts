export interface Plan {
    actions: Array<{
        toolName: string;
        args: Record<string, any>;
    }>;
    response?: string;
    context: Record<string, any>;
}
