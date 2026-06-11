// Simple test to verify our implementation works
import { ToolRegistry } from '../src/tools/ToolRegistry';
import { readFileTool, writeFileTool, listDirectoryTool } from '../src/tools/fileTools';
import { searchFilesTool } from '../src/tools/searchTools';

console.log('Testing tool registration...');

// Check that tools are properly defined
console.log('readFileTool exists:', !!readFileTool);
console.log('writeFileTool exists:', !!writeFileTool);
console.log('listDirectoryTool exists:', !!listDirectoryTool);
console.log('searchFilesTool exists:', !!searchFilesTool);

// Check registry directly 
console.log('\nChecking registry contents...');
const allTools = ToolRegistry.all();
console.log('Total tools in registry:', allTools.length);

// Test specific tools
const readTool = ToolRegistry.get('read_file');
const writeTool = ToolRegistry.get('write_file');  
const listTool = ToolRegistry.get('list_directory');
const searchTool = ToolRegistry.get('search_files');

console.log('\nTool registration status:');
console.log('Read file tool registered:', !!readTool);
console.log('Write file tool registered:', !!writeTool);
console.log('List directory tool registered:', !!listTool);
console.log('Search files tool registered:', !!searchTool);

// Show risk levels
if (readTool) console.log('Read file risk level:', readTool.riskLevel);
if (writeTool) console.log('Write file risk level:', writeTool.riskLevel);
if (listTool) console.log('List directory risk level:', listTool.riskLevel);
if (searchTool) console.log('Search files risk level:', searchTool.riskLevel);

console.log('\nVerification completed.');