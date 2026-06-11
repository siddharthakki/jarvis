// Simple test to check if command tool is properly exported and can be imported
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { runCommandTool } from '../src/tools/commandTools';

console.log('Testing simple tool import and registration...');

// Check if the tool exists
if (runCommandTool) {
  console.log('✓ runCommandTool imported successfully');
  console.log('Tool name:', runCommandTool.name);
  console.log('Tool description:', runCommandTool.description);
} else {
  console.log('✗ Failed to import runCommandTool');
}

// Try to register it manually
try {
  ToolRegistry.register(runCommandTool);
  console.log('✓ Tool registered successfully to registry');
  
  // Check if it's in the registry now
  const allTools = ToolRegistry.all();
  console.log(`Total tools in registry after manual registration: ${allTools.length}`);
  
  const toolNames = allTools.map(tool => tool.name);
  if (toolNames.includes('run_command')) {
    console.log('✓ run_command tool found in registry');
  } else {
    console.log('✗ run_command tool NOT found in registry');
  }
  
} catch (error) {
  console.error('Error during manual registration:', error);
}

console.log('Simple test completed!');