/**
 * Windows Command Compatibility Test
 * This script verifies that J.A.R.V.I.S. can successfully interface with
 * PowerShell and execute native Windows commands.
 */
import { runCommandTool } from '../src/tools/commandTools';

async function runTest() {
  console.log('=== JARVIS WINDOWS COMPATIBILITY DIAGNOSTIC ===');

  const tests = [
    {
      name: 'PowerShell Basic Connectivity',
      command: 'echo "Neural link established"'
    },
    {
      name: 'File System Recon (Local)',
      command: 'Get-ChildItem -Path . | Select-Object -First 5'
    },
    {
      name: 'System Resource Check',
      command: 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 3'
    },
    {
      name: 'Environment Verification',
      command: '$PSVersionTable.PSVersion'
    }
  ];

  for (const test of tests) {
    console.log(`\n> Testing: ${test.name}...`);
    try {
      const result = await runCommandTool.execute({ command: test.command, timeout: 10000 });
      if (result.success) {
        console.log(`  ✓ Success`);
        console.log(`  Output Preview: ${String((result.data as any).stdout).substring(0, 100).replace(/\n/g, ' ')}...`);
      } else {
        console.log(`  ✗ Failed: ${result.error}`);
      }
    } catch (e) {
      console.log(`  ✗ Critical Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

runTest();
