
export function readFile ( fileName: string ) : string {

  const fs = require('fs');

  const allFileContents = fs.readFileSync(fileName, 'utf-8');

  return allFileContents;
}
