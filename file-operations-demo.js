// Jarvis UI File Operations Demo
// This script demonstrates various file operations that would be available in the Jarvis UI

const fs = require('fs');
const path = require('path');

console.log('=== Jarvis UI File Operations Demo ===\n');

// Create a test directory structure
console.log('1. Creating test directory structure...');
try {
    if (!fs.existsSync('./test-demo')) {
        fs.mkdirSync('./test-demo');
        console.log('✓ Test directory created');
    }
    
    if (!fs.existsSync('./test-demo/subdir')) {
        fs.mkdirSync('./test-demo/subdir');
        console.log('✓ Subdirectory created');
    }
} catch (error) {
    console.error('✗ Failed to create directories:', error.message);
}

// Create test files
console.log('\n2. Creating test files...');
try {
    // Create a main file
    const mainContent = `# Jarvis Demo File
    
This is a demonstration of file operations in the Jarvis UI.
Features include:
- Creating files
- Reading files
- Editing files
- Renaming files
- Deleting files
- Directory listing

Created on: ${new Date().toLocaleString()}`;
    
    fs.writeFileSync('./test-demo/main.md', mainContent);
    console.log('✓ Main demo file created');
    
    // Create a config file
    const configContent = `{
  "appName": "Jarvis Desktop Assistant",
  "version": "1.0.0",
  "features": {
    "voiceAssistant": true,
    "fileManager": true,
    "automation": true
  }
}`;
    
    fs.writeFileSync('./test-demo/config.json', configContent);
    console.log('✓ Config file created');
    
} catch (error) {
    console.error('✗ Failed to create test files:', error.message);
}

// List directory contents
console.log('\n3. Listing directory contents...');
try {
    const files = fs.readdirSync('./test-demo');
    console.log('Files in test-demo directory:');
    files.forEach(file => {
        const fullPath = path.join('./test-demo', file);
        const stats = fs.statSync(fullPath);
        const type = stats.isDirectory() ? 'DIR' : 'FILE';
        const size = stats.size;
        console.log(`  ${type} - ${file} (${size} bytes)`);
    });
} catch (error) {
    console.error('✗ Failed to list directory:', error.message);
}

// Read a file
console.log('\n4. Reading main demo file...');
try {
    const content = fs.readFileSync('./test-demo/main.md', 'utf8');
    console.log('✓ File read successfully');
    console.log('Main file content preview:');
    console.log(content.substring(0, 100) + '...');
} catch (error) {
    console.error('✗ Failed to read file:', error.message);
}

// Edit a file (append content)
console.log('\n5. Editing files...');
try {
    const appendContent = `\n\n## Additional Information
    
This section was added through the Jarvis UI file editor.
The interface allows for:
- Real-time editing
- Syntax highlighting
- File search
- Version history`;
    
    fs.appendFileSync('./test-demo/main.md', appendContent);
    console.log('✓ Content appended to main file');
    
    // Read updated content
    const updatedContent = fs.readFileSync('./test-demo/main.md', 'utf8');
    console.log('✓ Updated file read successfully');
    console.log('Updated file length:', updatedContent.length, 'characters');
} catch (error) {
    console.error('✗ Failed to edit file:', error.message);
}

// Rename a file
console.log('\n6. Renaming files...');
try {
    fs.renameSync('./test-demo/config.json', './test-demo/settings.json');
    console.log('✓ File renamed successfully');
    
    // Verify rename
    const files = fs.readdirSync('./test-demo');
    console.log('Files after rename:');
    files.forEach(file => console.log(`  - ${file}`));
} catch (error) {
    console.error('✗ Failed to rename file:', error.message);
}

// Create a new file in subdirectory
console.log('\n7. Creating file in subdirectory...');
try {
    const subdirContent = `# Subdirectory File
    
This file exists in the subdirectory.
It demonstrates nested directory operations.`;
    
    fs.writeFileSync('./test-demo/subdir/readme.txt', subdirContent);
    console.log('✓ File created in subdirectory');
} catch (error) {
    console.error('✗ Failed to create file in subdirectory:', error.message);
}

// Show that we can work with the project directory structure
console.log('\n8. Working with project directory...');
try {
    const projectFiles = fs.readdirSync('./src/tools');
    console.log('✓ Project src/tools directory accessed successfully');
    console.log('Available tools:');
    projectFiles.forEach(file => console.log(`  - ${file}`));
} catch (error) {
    console.error('✗ Failed to access project directory:', error.message);
}

// Cleanup test files
console.log('\n9. Cleaning up test files...');
try {
    // Delete the entire test-demo directory
    function deleteRecursive(dirPath) {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    deleteRecursive(filePath); // Recursive call for directories
                } else {
                    fs.unlinkSync(filePath); // Delete file
                }
            });
            fs.rmdirSync(dirPath); // Remove the empty directory
        }
    }
    
    deleteRecursive('./test-demo');
    console.log('✓ Test files cleaned up successfully');
} catch (error) {
    console.error('✗ Failed to clean up test files:', error.message);
}

console.log('\n=== Demo completed successfully ===');
console.log('\nThis demo shows the file operations that would be available in the Jarvis UI:');
console.log('• Create files and directories');
console.log('• Read and edit existing files');
console.log('• Rename and delete files');
console.log('• List directory contents');
console.log('• Work with nested directory structures');
console.log('• File operations through a graphical interface');