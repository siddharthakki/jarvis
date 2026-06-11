import express from 'express';
import { AgentRuntime } from './dist/agent/AgentRuntime';
import { ToolRegistry } from './dist/tools/ToolRegistry';
import path from 'path';

// Register all tools
import './dist/tools/fileTools';
import './dist/tools/searchTools';
import './dist/tools/commandTools';
import './dist/tools/emailTools';
import './dist/tools/reminderTools';
import './dist/tools/deviceTools';

const app = express();
const PORT = 3000;

// Initialize agent
const agentRuntime = new AgentRuntime();
console.log('✓ Jarvis Agent Runtime initialized');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/ui')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ui/index.html'));
});

// API endpoint for processing user input
app.post('/api/process', async (req, res) => {
  try {
    const { input } = req.body;
    console.log(`📨 User input: ${input}`);
    
    const result = await agentRuntime.processInput(input);
    
    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint for getting available tools
app.get('/api/tools', (req, res) => {
  const tools = ToolRegistry.all().map(tool => ({
    name: tool.name,
    description: tool.description,
    riskLevel: tool.riskLevel,
    mutatesWorkspace: tool.mutatesWorkspace
  }));
  
  res.json({
    tools: tools,
    count: tools.length
  });
});

// API endpoint for status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    agent: 'Jarvis',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    toolsAvailable: ToolRegistry.all().length
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Jarvis Desktop Assistant - Web Interface');
  console.log(`✓ Server running at http://localhost:${PORT}`);
  console.log(`✓ Open your browser and navigate to http://localhost:${PORT}`);
  console.log('\n📋 Available API endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/process - Process user commands`);
  console.log(`   GET  http://localhost:${PORT}/api/tools - List available tools`);
  console.log(`   GET  http://localhost:${PORT}/api/status - Get Jarvis status`);
  console.log('\n✨ Jarvis is ready to assist!\n');
});
