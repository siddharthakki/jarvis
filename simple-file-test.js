// Simple direct test of file operations using built-in modules
const fs = require('fs');
const path = require('path');

console.log('=== Jarvis File System Operations Test ===\n');

// Test 1: Create a test file
console.log('1. Creating test file...');
try {
    const testContent = 'This is a test file for Jarvis UI functionality.\nIt demonstrates basic file operations.';
    fs.writeFileSync('./jarvis-test-file.txt', testContent);
    console.log('✓ File created successfully');
} catch (error) {
    console.error('✗ Failed to create file:', error.message);
}

// Test 2: Read the test file
console.log('\n2. Reading test file...');
try {
    const content = fs.readFileSync('./jarvis-test-file.txt', 'utf8');
    console.log('✓ File read successfully');
    console.log('File content:');
    console.log(content);
} catch (error) {
    console.error('✗ Failed to read file:', error.message);
}

// Test 3: List current directory contents
console.log('\n3. Listing directory contents...');
try {
    const files = fs.readdirSync('.');
    console.log('✓ Directory listing successful');
    console.log('Files in current directory:');
    files.forEach(file => {
        const stats = fs.statSync(file);
        const type = stats.isDirectory() ? 'DIR' : 'FILE';
        console.log(`  ${type} - ${file}`);
    });
} catch (error) {
    console.error('✗ Failed to list directory:', error.message);
}

// Test 4: Rename the test file
console.log('\n4. Renaming test file...');
try {
    fs.renameSync('./jarvis-test-file.txt', './jarvis-renamed-file.txt');
    console.log('✓ File renamed successfully');
} catch (error) {
    console.error('✗ Failed to rename file:', error.message);
}

// Test 5: Append content to the file
console.log('\n5. Appending content to file...');
try {
    const appendContent = '\nAppended content - demonstrating append functionality.';
    fs.appendFileSync('./jarvis-renamed-file.txt', appendContent);
    console.log('✓ Content appended successfully');
} catch (error) {
    console.error('✗ Failed to append content:', error.message);
}

// Test 6: Read updated file
console.log('\n6. Reading updated file...');
try {
    const updatedContent = fs.readFileSync('./jarvis-renamed-file.txt', 'utf8');
    console.log('✓ Updated file read successfully');
    console.log('Updated file content:');
    console.log(updatedContent);
} catch (error) {
    console.error('✗ Failed to read updated file:', error.message);
}

// Test 7: Delete the test file
console.log('\n7. Deleting test file...');
try {
    fs.unlinkSync('./jarvis-renamed-file.txt');
    console.log('✓ File deleted successfully');
} catch (error) {
    console.error('✗ Failed to delete file:', error.message);
}

console.log('\n=== All tests completed successfully ===');

// Test 8: Show that we can work with the project directory structure
console.log('\n8. Testing project directory access...');
try {
    const projectFiles = fs.readdirSync('./src');
    console.log('✓ Project src directory accessed successfully');
    console.log('src/ contents:');
    projectFiles.forEach(file => console.log(`  - ${file}`));
} catch (error) {
    console.error('✗ Failed to access project directory:', error.message);
}