export function findLinesWithFunction(content: string, functionName: string) {
    const lines = content.split('\n').reverse();
    let lineNumber = 1;

    lines.shift();

    lines.some((line, index) => { // need to fix this to count correctly
        if (line.toLowerCase().includes(functionName.toLowerCase())) {
            lineNumber = index;
            return lineNumber;
        }
    });
    return lineNumber;
  }