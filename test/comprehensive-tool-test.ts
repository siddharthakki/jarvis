// Comprehensive test to check all tools are properly registered
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { readFileTool, writeFileTool, listDirectoryTool } from '../src/tools/fileTools';
import { runCommandTool } from '../src/tools/commandTools';

console.log('=== Comprehensive Tool Registration Test ===');

// Check each tool individually
console.log('\n1. Checking individual tool imports:');
console.log('readFileTool:', !!readFileTool ? '✓ Found' : '✗ Not found');
console.log('writeFileTool:', !!writeFileTool ? '✓ Found' : '✗ Not found');
console.log('listDirectoryTool:', !!listDirectoryTool ? '✓ Found' : '✗ Not found');
console.log('runCommandTool:', !!runCommandTool ? '✓ Found' : '✗ Not found');

// Register them manually to see if they work
console.log('\n2. Testing manual registration:');
try {
  ToolRegistry.register(readFileTool);
  ToolRegistry.register(writeFileTool);
  ToolRegistry.register(listDirectoryTool);
  ToolRegistry.register(runCommandTool);
  console.log('✓ All tools registered successfully');
} catch (error) {
  console.error('✗ Error during manual registration:', error);
}

// Check registry contents
console.log('\n3. Checking registry contents:');
const allTools = ToolRegistry.all();
console.log(`Total tools in registry: ${allTools.length}`);

allTools.forEach(tool => {
  console.log(`- ${tool.name}: riskLevel=${tool.riskLevel}, mutatesWorkspace=${tool.mutatesWorkspace}`);
});

// Check for specific tools
console.log('\n4. Specific tool verification:');
const toolNames = allTools.map(t => t.name);
console.log('read_file:', toolNames.includes('read_file') ? '✓ Found' : '✗ Missing');
console.log('write_file:', toolNames.includes('write_file') ? '✓ Found' : '✗ Missing');
console.log('list_directory:', toolNames.includes('list_directory') ? '✓ Found' : '✗ Missing');
console.log('run_command:', toolNames.includes('run_command') ? '✓ Found' : '✗ Missing');

console.log('\n=== Test completed ===');