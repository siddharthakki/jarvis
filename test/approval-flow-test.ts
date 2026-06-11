// Test to verify the approval flow implementation
import { ApprovalFlow } from '../src/policy/ApprovalFlow';

async function testApprovalFlow() {
  console.log('=== Testing Approval Flow Implementation ===');
  
  const approvalFlow = new ApprovalFlow();
  
  try {
    // Test with a low-risk tool (write_file)
    console.log('\n1. Testing write_file approval request:');
    const result1 = await approvalFlow.requestApproval(
      'write_file',
      { path: 'test.txt', content: 'Hello World' },
      'Writing test file',
      'low'
    );
    console.log('Result:', result1);
    
    // Test with a safe tool (read_file)
    console.log('\n2. Testing read_file approval request:');
    const result2 = await approvalFlow.requestApproval(
      'read_file',
      { path: 'test.txt' },
      'Reading test file',
      'safe'
    );
    console.log('Result:', result2);
    
    console.log('\n=== Test completed ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testApprovalFlow();