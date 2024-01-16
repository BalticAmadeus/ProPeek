const fs = require('fs');

export function readFile(fileName: string): string {
  const allFileContents = fs.readFileSync(fileName, 'utf-8');

  return allFileContents;
}
