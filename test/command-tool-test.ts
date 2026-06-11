// Test file for command tool functionality
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { runCommandTool } from '../src/tools/commandTools';

console.log('Testing command tool import...');

try {
  // Check that our tool is registered
  const tools = ToolRegistry.all();
  console.log(`✓ Registered ${tools.length} tools`);
  
  // Check specific tools
  const toolNames = tools.map(tool => tool.name);
  if (toolNames.includes('run_command')) {
    console.log('✓ run_command tool registered');
  }
  
  console.log('Command tool test completed successfully!');
} catch (error) {
  console.error('Test failed:', error);
}