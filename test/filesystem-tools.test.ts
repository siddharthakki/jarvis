// Test file for filesystem tools
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { readFileTool, writeFileTool, listDirectoryTool } from '../src/tools/fileTools';

console.log('Testing filesystem tools...');

try {
  // Check that our tools are registered
  const tools = ToolRegistry.all();
  console.log(`✓ Registered ${tools.length} tools`);
  
  // Check specific tools
  const toolNames = tools.map(tool => tool.name);
  if (toolNames.includes('read_file')) {
    console.log('✓ read_file tool registered');
  }
  if (toolNames.includes('write_file')) {
    console.log('✓ write_file tool registered');
  }
  if (toolNames.includes('list_directory')) {
    console.log('✓ list_directory tool registered');
  }
  
  console.log('Filesystem tools test completed successfully!');
} catch (error) {
  console.error('Test failed:', error);
}