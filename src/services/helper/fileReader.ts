import * as readline from 'readline';
const fs = require('fs');

export function* readFileLinesSync(fileName: string): Generator<string> {
  const fd = fs.openSync(fileName, 'r');
  const bufferSize = 64 * 1024 * 1024; // 64MB
  const buffer = Buffer.alloc(bufferSize);

  let leftover = '';
  let bytesRead: number;

  while ((bytesRead = fs.readSync(fd, buffer, 0, bufferSize, null)) > 0) {
    const chunk = leftover + buffer.toString('utf-8', 0, bytesRead);
    const lines = chunk.split(/\r?\n/);
    leftover = lines.pop() || '';

    for (const line of lines) {
      yield line;
    }
  }

  if (leftover) {
    yield leftover;
  }

  fs.closeSync(fd);
}

export function readFile(fileName: string): string {
  const allFileContents = fs.readFileSync(fileName, 'utf-8');

  return allFileContents;
}
