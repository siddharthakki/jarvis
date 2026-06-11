// Simple verification script to check if filesystem implementation is correctly updated
const fs = require('fs');
const path = require('path');

console.log('=== Verifying JARVIS Filesystem Tools Implementation ===\n');

// Check if key files exist
const filesToCheck = [
    'src/tools/fileTools.ts',
    'src/tools/searchTools.ts',
    'src/extension.ts'
];

let allFilesExist = true;
filesToCheck.forEach(filePath => {
    const exists = fs.existsSync(filePath);
    console.log(`✓ ${filePath}: ${exists ? 'Exists' : 'MISSING'}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ Some key files are missing!');
    process.exit(1);
}

// Check fileTools.ts content
try {
    const fileToolsContent = fs.readFileSync('src/tools/fileTools.ts', 'utf8');
    
    console.log('\n=== Checking fileTools.ts ===');
    
    // Verify it uses fs/promises
    if (fileToolsContent.includes('fs/promises')) {
        console.log('✓ Uses fs/promises module');
    } else {
        console.log('❌ Does not use fs/promises module');
    }
    
    // Verify read_file function exists
    if (fileToolsContent.includes('read_file')) {
        console.log('✓ read_file function exists');
    } else {
        console.log('❌ read_file function missing');
    }
    
    // Verify write_file function exists  
    if (fileToolsContent.includes('write_file')) {
        console.log('✓ write_file function exists');
    } else {
        console.log('❌ write_file function missing');
    }
    
    // Verify list_directory function exists
    if (fileToolsContent.includes('list_directory')) {
        console.log('✓ list_directory function exists');
    } else {
        console.log('❌ list_directory function missing');
    }
    
    // Check that write_file requires approval (has policy check)
    if (fileToolsContent.includes('requireApproval')) {
        console.log('✓ write_file requires approval through policy engine');
    } else {
        console.log('⚠ write_file may not require approval (check implementation)');
    }
    
} catch (error) {
    console.log('Error reading fileTools.ts:', error.message);
}

// Check searchTools.ts content
try {
    const searchToolsContent = fs.readFileSync('src/tools/searchTools.ts', 'utf8');
    
    console.log('\n=== Checking searchTools.ts ===');
    
    // Verify it uses fs/promises
    if (searchToolsContent.includes('fs/promises')) {
        console.log('✓ Uses fs/promises module');
    } else {
        console.log('❌ Does not use fs/promises module');
    }
    
    // Verify search_files function exists
    if (searchToolsContent.includes('search_files')) {
        console.log('✓ search_files function exists');
    } else {
        console.log('❌ search_files function missing');
    }
    
} catch (error) {
    console.log('Error reading searchTools.ts:', error.message);
}

// Check extension.ts for tool registration
try {
    const extensionContent = fs.readFileSync('src/extension.ts', 'utf8');
    
    console.log('\n=== Checking extension.ts ===');
    
    // Verify file tools are registered
    if (extensionContent.includes('fileTools')) {
        console.log('✓ fileTools registered');
    } else {
        console.log('❌ fileTools not registered');
    }
    
    // Verify search tools are registered
    if (extensionContent.includes('searchTools')) {
        console.log('✓ searchTools registered');
    } else {
        console.log('❌ searchTools not registered');
    }
    
    // Verify list_directory tool is registered
    if (extensionContent.includes('list_directory')) {
        console.log('✓ list_directory tool registered');
    } else {
        console.log('❌ list_directory tool not registered');
    }
    
} catch (error) {
    console.log('Error reading extension.ts:', error.message);
}

console.log('\n=== Verification Complete ===');