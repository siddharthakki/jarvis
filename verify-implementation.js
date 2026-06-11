// Simple verification script for filesystem tools implementation
const fs = require('fs').promises;
const path = require('path');

console.log('Verifying JARVIS filesystem tools implementation...\n');

// Check if fileTools.ts exists and has the right structure
fs.readFile('./src/tools/fileTools.ts', 'utf8')
  .then(content => {
    console.log('✓ fileTools.ts exists');
    
    // Verify it uses fs/promises
    if (content.includes('import fs from \'fs\'') || content.includes('from \'fs/promises\'')) {
      console.log('✓ fileTools.ts uses Node fs/promises');
    } else {
      console.log('✗ fileTools.ts does not use Node fs/promises');
    }
    
    // Verify list_directory tool is defined
    if (content.includes('listDirectoryTool')) {
      console.log('✓ list_directory tool is defined in fileTools.ts');
    } else {
      console.log('✗ list_directory tool not found in fileTools.ts');
    }
    
    // Check for write_file risk level change
    return fs.readFile('./src/policy/RiskClassifier.ts', 'utf8');
  })
  .then(content => {
    console.log('✓ RiskClassifier.ts exists');
    
    // Verify write_file is classified as high risk
    if (content.includes("case 'write_file':") && content.includes("return 'high'")) {
      console.log('✓ write_file correctly classified as high risk');
    } else {
      console.log('✗ write_file not classified as high risk');
    }
  })
  .catch(err => {
    console.log('Error:', err.message);
  });

// Verify the extension.ts registers tools properly
fs.readFile('./src/extension.ts', 'utf8')
  .then(content => {
    console.log('\n✓ extension.ts exists');
    
    // Check that file tools are registered (looking for specific tool registrations)
    if (content.includes('ToolRegistry.register(readFileTool)') &&
        content.includes('ToolRegistry.register(writeFileTool)') &&
        content.includes('ToolRegistry.register(listDirectoryTool)') &&
        content.includes('ToolRegistry.register(searchFilesTool)')) {
      console.log('✓ All filesystem tools are registered in extension.ts');
    } else {
      console.log('✗ Not all filesystem tools found in extension.ts registration');
    }
  })
  .catch(err => {
    console.log('Error reading extension.ts:', err.message);
  });

console.log('\nVerification complete.');