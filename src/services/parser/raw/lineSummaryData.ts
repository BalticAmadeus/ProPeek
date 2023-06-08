
export interface LineSummaryData {
  ModuleID      : number,
  LineNo        : number,
  ExecCount     : number,
  ActualTime    : number,
  CumulativeTime: number
}

export function parseLineSummaryLine (line : string) : LineSummaryData {

  const valueList : string[] = line.split(" ");

  const lineSummaryData : LineSummaryData = {
    ModuleID: Number(valueList[0]),
    LineNo: Number(valueList[1]),
    ExecCount: Number(valueList[2]),
    ActualTime: Number(valueList[3]),
    CumulativeTime: Number(valueList[4])
  }

  return lineSummaryData;
}
