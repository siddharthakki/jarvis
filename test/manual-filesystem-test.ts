import { ToolRegistry } from '../src/tools/ToolRegistry';

// Test that tools are properly registered
console.log('Testing tool registration...');

// Check if tools are registered by directly checking the registry
const readTool = ToolRegistry.get('read_file');
const writeTool = ToolRegistry.get('write_file');
const listTool = ToolRegistry.get('list_directory');

console.log('Read file tool registered:', !!readTool);
console.log('Write file tool registered:', !!writeTool);
console.log('List directory tool registered:', !!listTool);

// Test that tools have correct properties
if (readTool) {
  console.log('Read file tool name:', readTool.name);
  console.log('Read file tool risk level:', readTool.riskLevel);
}

if (writeTool) {
  console.log('Write file tool name:', writeTool.name);
  console.log('Write file tool risk level:', writeTool.riskLevel);
}

if (listTool) {
  console.log('List directory tool name:', listTool.name);
  console.log('List directory tool risk level:', listTool.riskLevel);
}

console.log('Manual test completed successfully!');
