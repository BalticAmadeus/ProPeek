
export interface CallTreeData {
  NodeID         : number,
  ParentID       : number,
  ModuleID       : number,
  LineNum        : number,
  NumCalls       : number,
  CumulativeTime : number,
  ChildrenNodeIDs: number[]
}

export function parseCallTreeLine (line : string) : CallTreeData {

  const valueList : string[] = line.split(" ");

  const callTreeData : CallTreeData = {
    NodeID: Number(valueList[0]),
    ParentID: Number(valueList[1]),
    ModuleID: Number(valueList[2]),
    LineNum: Number(valueList[3]),
    NumCalls: Number(valueList[4]),
    CumulativeTime: Number(valueList[5]),
    ChildrenNodeIDs: valueList.slice(6).map(Number)
  }

  return callTreeData;
}
