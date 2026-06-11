// Full desktop application startup for JARVIS
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Ensure we're in the correct directory for relative paths
process.chdir(__dirname);

console.log('Starting JARVIS Desktop Assistant with full UI...');

try {
    // Import and initialize the agent
    const { AgentRuntime } = require('./dist/agent/AgentRuntime.js');
    
    // Create a basic agent instance
    const agent = new AgentRuntime();
    
    console.log('✓ JARVIS agent created successfully');
    console.log('✓ Core functionality is ready');
    
    // Initialize desktop components using Electron properly
    const { MainWindow } = require('./dist/ui/MainWindow.js');
    
    // Handle app initialization
    app.whenReady().then(() => {
        try {
            const mainWindow = new MainWindow();
            console.log('✓ Desktop UI initialized successfully');
            console.log('JARVIS is ready to assist you with full UI!');
            
            // Show available tools
            console.log('\nAvailable tools:');
            console.log('- File operations (read, write, list)');
            console.log('- Command execution');
            console.log('- Email operations');
            console.log('- Reminder management');
            console.log('- Device control');
            
        } catch (uiError) {
            console.error('✗ UI initialization error:', uiError.message);
            console.error('This might be due to Electron environment issues in test mode.');
        }
    });
    
} catch (error) {
    console.error('✗ Error starting JARVIS:', error.message);
    process.exit(1);
}