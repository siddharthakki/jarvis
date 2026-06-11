// Simple test for file operations
const fs = require('fs');
const path = require('path');

console.log('Testing basic file operations...');

// Test 1: Create a test file
try {
    const testContent = 'Hello, Jarvis!';
    fs.writeFileSync('./test-file.txt', testContent);
    console.log('✓ File created successfully');
} catch (error) {
    console.error('✗ Failed to create file:', error.message);
}

// Test 2: Read the test file
try {
    const content = fs.readFileSync('./test-file.txt', 'utf8');
    console.log('✓ File read successfully:', content);
} catch (error) {
    console.error('✗ Failed to read file:', error.message);
}

// Test 3: List current directory
try {
    const files = fs.readdirSync('.');
    console.log('✓ Directory listing successful:');
    files.forEach(file => console.log('  -', file));
} catch (error) {
    console.error('✗ Failed to list directory:', error.message);
}

// Test 4: Rename the test file
try {
    fs.renameSync('./test-file.txt', './renamed-test-file.txt');
    console.log('✓ File renamed successfully');
} catch (error) {
    console.error('✗ Failed to rename file:', error.message);
}

// Test 5: Delete the test file
try {
    fs.unlinkSync('./renamed-test-file.txt');
    console.log('✓ File deleted successfully');
} catch (error) {
    console.error('✗ Failed to delete file:', error.message);
}

console.log('File operations test completed.');