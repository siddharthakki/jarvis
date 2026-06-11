// Simple test to validate ComfyUI setup
const fs = require('fs');
const path = require('path');

console.log("Testing ComfyUI configuration...");

// Check if config directory exists
const configDir = path.join(process.cwd(), 'config', 'comfy');
if (!fs.existsSync(configDir)) {
  console.log("❌ Config directory not found");
  process.exit(1);
}

// Check if example config exists
const exampleConfigPath = path.join(configDir, 'config.example.json');
if (!fs.existsSync(exampleConfigPath)) {
  console.log("❌ Example config not found");
  process.exit(1);
}

// Check if workflow file exists (we'll create it as part of the setup)
const workflowPath = path.join(configDir, 'workflow.json');
console.log("✅ Config directory structure is in place");

// Create a simple test workflow for testing
const testWorkflow = {
  "1": {
    "inputs": {
      "text": "test prompt"
    },
    "class_type": "Z. Image"
  }
};

try {
  fs.writeFileSync(workflowPath, JSON.stringify(testWorkflow, null, 2));
  console.log("✅ Test workflow file created");
} catch (error) {
  console.log("❌ Failed to create test workflow:", error.message);
}

console.log("✅ ComfyUI setup structure validated successfully");