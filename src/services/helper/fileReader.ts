const fs = require('fs');

export function readFile ( fileName: string ) : string {

  const allFileContents = fs.readFileSync(fileName, 'utf-8');

  return allFileContents;
}

export function readUntilLineNumber(filePath: string, lineNumber: number): string | null {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      const contentUntilLine = lines.slice(0, lineNumber).join('\n');

      return contentUntilLine || null;
  }
