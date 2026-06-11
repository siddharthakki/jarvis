import * as path from 'path';
import * as os from 'os';
import { Config } from '../src/config/Config';

// Mocking ALLOWED_ROOTS locally for test
const ALLOWED_ROOTS = [
  path.join(os.homedir(), '.jarvis'),
  'C:\\Projects',
  path.join(os.homedir(), 'Documents'),
  path.join(os.homedir(), 'Desktop'),
  os.tmpdir(),
  process.cwd()
];

function isPathAllowed(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  const config = Config.getInstance();
  const workspaceRoot = config.get('workspaceRoot');

  const roots = [...ALLOWED_ROOTS];
  if (workspaceRoot) roots.push(workspaceRoot);

  return roots.some(root => {
    const resolvedRoot = path.resolve(root);
    const relative = path.relative(resolvedRoot, resolved);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });
}

describe('Path Safety', () => {
  it('should allow paths inside allowed roots', () => {
    expect(isPathAllowed('C:\\Projects\\Jarvis\\src\\main.ts')).toBe(true);
    expect(isPathAllowed(path.join(os.homedir(), '.jarvis', 'config.json'))).toBe(true);
  });

  it('should deny paths outside allowed roots', () => {
    expect(isPathAllowed('C:\\Windows\\System32\\cmd.exe')).toBe(false);
    expect(isPathAllowed('C:\\ProjectsX\\file.txt')).toBe(false);
  });

  it('should deny directory traversal', () => {
    expect(isPathAllowed('C:\\Projects\\..\\Windows\\System32')).toBe(false);
  });
});
