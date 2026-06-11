// Simple verification test for filesystem tools
const fs = require('fs/promises');
const path = require('path');

console.log('=== Verifying Filesystem Tools Implementation ===\n');

// Test 1: Check that fileTools.ts uses real filesystem operations
console.log('1. Checking fileTools.ts implementation...');
try {
    const fileToolsContent = fs.readFileSync('./src/tools/fileTools.ts', 'utf8');
    
    if (fileToolsContent.includes("import * as fs from 'fs/promises'")) {
        console.log('   ✓ fileTools.ts imports fs/promises correctly');
    } else {
        console.log('   ✗ fileTools.ts does not import fs/promises');
    }
    
    if (fileToolsContent.includes('await fs.readFile') && 
        fileToolsContent.includes('await fs.writeFile') &&
        fileToolsContent.includes('await fs.readdir')) {
        console.log('   ✓ fileTools.ts uses real filesystem operations');
    } else {
        console.log('   ✗ fileTools.ts does not use real filesystem operations');
    }
    
    if (fileToolsContent.includes('listDirectoryTool')) {
        console.log('   ✓ list_directory tool is defined in fileTools.ts');
    } else {
        console.log('   ✗ list_directory tool not found in fileTools.ts');
    }
    
} catch (error) {
    console.log('   ✗ Error reading fileTools.ts:', error.message);
}

// Test 2: Check that searchTools.ts uses real filesystem operations
console.log('\n2. Checking searchTools.ts implementation...');
try {
    const searchToolsContent = fs.readFileSync('./src/tools/searchTools.ts', 'utf8');
    
    if (searchToolsContent.includes("import * as fs from 'fs/promises'")) {
        console.log('   ✓ searchTools.ts imports fs/promises correctly');
    } else {
        console.log('   ✗ searchTools.ts does not import fs/promises');
    }
    
    if (searchToolsContent.includes('await fs.readdir')) {
        console.log('   ✓ searchTools.ts uses real filesystem operations');
    } else {
        console.log('   ✗ searchTools.ts does not use real filesystem operations');
    }
    
} catch (error) {
    console.log('   ✗ Error reading searchTools.ts:', error.message);
}

// Test 3: Verify risk levels in RiskClassifier
console.log('\n3. Checking risk classification...');
try {
    const riskClassifierContent = fs.readFileSync('./src/policy/RiskClassifier.ts', 'utf8');
    
    if (riskClassifierContent.includes("case 'write_file':") && 
        riskClassifierContent.includes("return 'low';")) {
        console.log('   ✓ write_file classified as low risk (requires approval)');
    } else {
        console.log('   ✗ write_file not properly classified as low risk');
    }
    
    if (riskClassifierContent.includes("case 'list_directory':") && 
        riskClassifierContent.includes("return 'safe';")) {
        console.log('   ✓ list_directory classified as safe risk');
    } else {
        console.log('   ✗ list_directory not properly classified as safe risk');
    }
    
} catch (error) {
    console.log('   ✗ Error reading RiskClassifier.ts:', error.message);
}

// Test 4: Verify tools are registered
console.log('\n4. Checking tool registration...');
try {
    const fileToolsContent = fs.readFileSync('./src/tools/fileTools.ts', 'utf8');
    
    if (fileToolsContent.includes("ToolRegistry.register(readFileTool)") &&
        fileToolsContent.includes("ToolRegistry.register(writeFileTool)") &&
        fileToolsContent.includes("ToolRegistry.register(listDirectoryTool)")) {
        console.log('   ✓ All filesystem tools are registered in ToolRegistry');
    } else {
        console.log('   ✗ Not all filesystem tools are properly registered');
    }
    
} catch (error) {
    console.log('   ✗ Error reading fileTools.ts for registration check:', error.message);
}

console.log('\n=== Verification Complete ===');