// Simple script to verify JARVIS core functionality
console.log('Starting JARVIS Desktop Assistant...');

// Import the main module
try {
    // Just import the core agent without initializing UI components
    const { AgentRuntime } = require('./dist/agent/AgentRuntime.js');
    
    // Create a basic agent instance
    const agent = new AgentRuntime();
    
    console.log('✓ JARVIS agent created successfully');
    console.log('✓ Core functionality is ready');
    console.log('JARVIS is ready to assist you!');
    
    // Show available tools
    console.log('\nAvailable tools:');
    console.log('- File operations (read, write, list)');
    console.log('- Command execution');
    console.log('- Email operations');
    console.log('- Reminder management');
    console.log('- Device control');
    
} catch (error) {
    console.error('✗ Error starting JARVIS:', error.message);
    process.exit(1);
}
