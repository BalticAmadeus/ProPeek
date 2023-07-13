export interface TracingData {
  ModuleID  : number,
  LineNo    : number,
  ActualTime: number,
  StartTime : number
}

/**
 * Parse raw line into TracingData object
 * Line format: 2 7 0.000004 0.122525
 */
export function parseTracingLine (line : string) : TracingData {

  const valueList : string[] = line.split(" ");

  const tracingData : TracingData = {
    ModuleID  : Number(valueList[0]),
    LineNo    : Number(valueList[1]),
    ActualTime: Number(valueList[2]),
    StartTime : Number(valueList[3])
  }

  return tracingData;
}
