export declare class ApprovalFlow {
    private mainWindow;
    setMainWindow(mainWindow: any): void;
    requestApproval(toolName: string, args: Record<string, unknown>, reason: string, riskLevel: RiskLevel): Promise<'approved' | 'denied'>;
}
export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
