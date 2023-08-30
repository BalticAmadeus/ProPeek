export interface DescriptionData {
  Version     : number,
  Date        : string,
  Description : string,
  SystemTime  : string,
  UnusedString: string,
  Information : string
}

/**
 * Parse raw line into DescriptionData object
 * Line format: 3 05/11/2023 "PROFILER TEST" 19:15:44 "" {"StmtCnt":119,"DataPts":256,"NumWrites":0,"TotTime":0.009183,"BufferSize":131040,"Directory":".","Propath":"."}
 */
export function parseDescriptionLine ( line : string ) : DescriptionData {

  const valueList : string[] = line.split("\"");

  const descriptionData : DescriptionData = {
    Version     : Number(valueList[0].trim().split(" ")[0]),
    Date        : valueList[0].trim().split(" ")[1],
    Description : valueList[1],
    SystemTime  : valueList[2].trim(),
    UnusedString: valueList[3],
    Information : line.substring(line.indexOf("{")) //could be problematic if description field contains this symbol
  }

  return descriptionData;
}


