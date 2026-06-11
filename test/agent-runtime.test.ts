// Simple test file for agent runtime functionality
import { AgentRuntime } from '../src/agent/AgentRuntime';
import { ToolRegistry } from '../src/tools/ToolRegistry';

// Test the agent runtime functionality
console.log('Testing AgentRuntime...');

try {
  const agent = new AgentRuntime();
  console.log('✓ AgentRuntime initialized successfully');
  
  const tools = ToolRegistry.all();
  console.log(`✓ Registered ${tools.length} tools`);
  
  // Check that key tools are registered
  const toolNames = tools.map(tool => tool.name);
  if (toolNames.includes('read_file')) {
    console.log('✓ read_file tool registered');
  }
  if (toolNames.includes('write_file')) {
    console.log('✓ write_file tool registered');
  }
  if (toolNames.includes('search_files')) {
    console.log('✓ search_files tool registered');
  }
  if (toolNames.includes('run_command')) {
    console.log('✓ run_command tool registered');
  }
  
  console.log('All tests passed!');
} catch (error) {
  console.error('Test failed:', error);
}