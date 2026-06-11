import * as fs from 'fs/promises';
import * as path from 'path';

describe('Filesystem Tools', () => {
  const testDir = path.join(__dirname, 'test-files');
  
  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Create some test files
    await fs.writeFile(path.join(testDir, 'test1.txt'), 'This is test file 1');
    await fs.writeFile(path.join(testDir, 'test2.txt'), 'This is test file 2');
    await fs.writeFile(path.join(testDir, 'data.json'), '{"name": "test", "value": 123}');
  });
  
  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
  
  it('should read a file', async () => {
    // Import and execute tools directly without using the registry for testing
    const { readFileTool } = await import('./fileTools');
    
    const result = await readFileTool.execute({
      path: path.join(testDir, 'test1.txt')
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBe('This is test file 1');
  });
  
  it('should write a file', async () => {
    const { writeFileTool } = await import('./fileTools');
    const newFilePath = path.join(testDir, 'newfile.txt');
    
    const result = await writeFileTool.execute({
      path: newFilePath,
      content: 'New file content'
    });
    
    expect(result.success).toBe(true);
    
    const content = await fs.readFile(newFilePath, 'utf8');
    expect(content).toBe('New file content');
  });
  
  it('should list directory contents', async () => {
    const { listDirectoryTool } = await import('./fileTools');
    
    const result = await listDirectoryTool.execute({
      path: testDir
    });
    
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });
  
  it('should search files with pattern', async () => {
    const { searchFilesTool } = await import('./searchTools');
    
    const result = await searchFilesTool.execute({
      path: testDir,
      pattern: 'test'
    });
    
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });
  
  it('should find files by extension', async () => {
    const { searchFilesTool } = await import('./searchTools');
    
    const result = await searchFilesTool.execute({
      path: testDir,
      pattern: '.txt'
    });
    
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });
});
