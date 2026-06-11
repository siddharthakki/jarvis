const { readFileTool, writeFileTool, listDirectoryTool } = require('../src/tools/fileTools');
const { searchFilesTool } = require('../src/tools/searchTools');

// Test the filesystem tools
async function testFileTools() {
  console.log('Testing filesystem tools implementation...');
  
  // Test read file tool (should work without approval)
  try {
    console.log('\n1. Testing read_file tool:');
    const readResult = await readFileTool.execute({ path: './README.md' });
    console.log('Read result:', readResult.success ? 'Success' : `Failed: ${readResult.error}`);
  } catch (error) {
    console.log('Error reading file:', error);
  }
  
  // Test list directory tool (should work without approval)
  try {
    console.log('\n2. Testing list_directory tool:');
    const listResult = await listDirectoryTool.execute({ path: './src' });
    console.log('List result:', listResult.success ? `Found ${Array.isArray(listResult.data) ? listResult.data.length : 0} items` : `Failed: ${listResult.error}`);
  } catch (error) {
    console.log('Error listing directory:', error);
  }
  
  // Test search files tool (should work without approval)
  try {
    console.log('\n3. Testing search_files tool:');
    const searchResult = await searchFilesTool.execute({ pattern: '*.ts', directory: './src' });
    console.log('Search result:', searchResult.success ? `Found ${Array.isArray(searchResult.data) ? searchResult.data.length : 0} files` : `Failed: ${searchResult.error}`);
  } catch (error) {
    console.log('Error searching files:', error);
  }
  
  // Test write file tool (should require approval)
  try {
    console.log('\n4. Testing write_file tool:');
    const writeResult = await writeFileTool.execute({ path: './test-write.txt', content: 'Test content' });
    console.log('Write result:', writeResult.success ? 'Success' : `Failed: ${writeResult.error}`);
  } catch (error) {
    console.log('Error writing file:', error);
  }
  
  console.log('\nFilesystem tools test completed.');
}

// Run the test
testFileTools().catch(console.error);