export interface CallGraphData {
  CallerID    : number,
  CallerLineNo: number,
  CalleeID    : number,
  CallCount   : number
}

/**
 * Parse raw line into CallGraphData object
 * Line format: 0 0 1 1
 */
export function parseCallGraphLine (line : string) : CallGraphData {

  const valueList : string[] = line.split(" ");

  const callGraphData : CallGraphData = {
    CallerID    : Number(valueList[0]),
    CallerLineNo: Number(valueList[1]),
    CalleeID    : Number(valueList[2]),
    CallCount   : Number(valueList[3])
  };

  return callGraphData;
}