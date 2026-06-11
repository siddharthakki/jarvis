// Test script to verify weather query handling in JARVIS
const { AIPlanner } = require('./dist/agent/AIPlanner');

const planner = new AIPlanner();

async function testWeatherQuery() {
  console.log('Testing weather query handling...\n');
  
  const testQueries = [
    'hi what is the weather today',
    'what is the weather',
    'weather in New York',
    'tell me the weather for London today',
    'weather',
    'hello, what\'s the weather like?'
  ];
  
  for (const query of testQueries) {
    console.log(`Query: "${query}"`);
    const plan = await planner.plan(query);
    console.log(`Response: ${plan.response}`);
    console.log(`Actions: ${JSON.stringify(plan.actions, null, 2)}`);
    console.log('---\n');
  }
}

testWeatherQuery().catch(console.error);
