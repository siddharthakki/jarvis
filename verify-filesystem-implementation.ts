import { ToolRegistry } from './src/tools/ToolRegistry';
import { readFileTool, writeFileTool, listDirectoryTool } from './src/tools/fileTools';
import { searchFilesTool } from './src/tools/searchTools';

console.log('=== Verifying Filesystem Tools Implementation ===');

// Check if all tools are registered
const tools = ToolRegistry.all();
console.log('Registered tools count:', tools.length);

// Check specific filesystem tools
const fileTools = tools.filter(tool => 
  tool.name.includes('file') || tool.name.includes('directory')
);
console.log('Filesystem-related tools found:', fileTools.length);

// Verify specific tools exist
const readFileToolFound = tools.find(t => t.name === 'read_file');
const writeFileToolFound = tools.find(t => t.name === 'write_file');
const listDirectoryToolFound = tools.find(t => t.name === 'list_directory');
const searchFilesToolFound = tools.find(t => t.name === 'search_files');

console.log('read_file tool found:', !!readFileToolFound);
console.log('write_file tool found:', !!writeFileToolFound);
console.log('list_directory tool found:', !!listDirectoryToolFound);
console.log('search_files tool found:', !!searchFilesToolFound);

// Check risk levels
if (writeFileToolFound) {
  console.log('write_file risk level:', writeFileToolFound.riskLevel);
  console.log('write_file requires approval:', writeFileToolFound.riskLevel === 'high');
}

console.log('\n=== Implementation Verification Complete ===');