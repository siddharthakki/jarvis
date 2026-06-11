// Simple test to check if tools are registered properly
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { readFileTool, writeFileTool, listDirectoryTool } from '../src/tools/fileTools';

console.log('Checking tool registration...');

// Check the registry directly
const allTools = ToolRegistry.all();
console.log('Total tools in registry:', allTools.length);

// Check for specific tools by name
const readTool = ToolRegistry.get('read_file');
const writeTool = ToolRegistry.get('write_file');
const listTool = ToolRegistry.get('list_directory');

console.log('Read file tool registered:', !!readTool);
console.log('Write file tool registered:', !!writeTool);
console.log('List directory tool registered:', !!listTool);

// Print all tools in registry
console.log('\nAll registered tools:');
allTools.forEach(tool => {
  console.log(`- ${tool.name}: riskLevel=${tool.riskLevel}`);
});

console.log('\nManual test completed successfully!');