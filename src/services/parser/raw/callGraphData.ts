
export interface CallGraphData {
  CallerID    : number,
  CallerLineNo: number,
  CalleeID    : number,
  CallCount   : number
}

export function parseCallGraphLine (line : string) : CallGraphData {

  const valueList : string[] = line.split(" ");

  const callGraphData : CallGraphData = {
    CallerID: Number(valueList[0]),
    CallerLineNo: Number(valueList[1]),
    CalleeID: Number(valueList[2]),
    CallCount: Number(valueList[3])
  }

  return callGraphData;
}