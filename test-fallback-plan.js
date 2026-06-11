// Direct test of AIPlanner fallback logic
const { AIPlanner } = require('./dist/agent/AIPlanner');

// Create a minimal test that just checks the fallback plan generation
const planner = new AIPlanner();

// Test the fallbackPlan method directly by calling a private method
// We'll need to test via the plan method which should hit fallback if Ollama fails

async function testFallback() {
  console.log('Testing AIPlanner fallback logic...\n');
  
  const testCases = [
    {
      input: 'hi what is the weather today',
      expectedAction: 'web_search',
      expectedKeywords: ['weather', 'current location']
    },
    {
      input: 'what is the weather in Paris',
      expectedAction: 'web_search',
      expectedKeywords: ['weather', 'Paris']
    },
    {
      input: 'search for python tutorials',
      expectedAction: 'web_search',
      expectedKeywords: ['python', 'tutorials']
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.input}"`);
    
    try {
      const plan = await planner.plan(testCase.input);
      
      console.log(`Response: ${plan.response}`);
      console.log(`Number of actions: ${plan.actions.length}`);
      
      if (plan.actions.length > 0) {
        console.log(`First action: ${JSON.stringify(plan.actions[0])}`);
        
        // Check if the action matches expected
        if (plan.actions[0].toolName === testCase.expectedAction) {
          console.log(`✓ Correct action type: ${testCase.expectedAction}`);
        } else {
          console.log(`✗ Wrong action type. Expected: ${testCase.expectedAction}, Got: ${plan.actions[0].toolName}`);
        }
      }
      
      console.log('---\n');
    } catch (error) {
      console.error(`Error testing "${testCase.input}":`, error.message);
    }
  }
}

// Run with a timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('Test timed out! The OllamaClient initialization is taking too long.');
  process.exit(1);
}, 5000);

testFallback()
  .then(() => {
    clearTimeout(timeout);
    process.exit(0);
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error('Test failed:', err);
    process.exit(1);
  });
