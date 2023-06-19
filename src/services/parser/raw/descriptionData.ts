
/**
 * Interface for storing Description data from the file
 */
export interface DescriptionData {
  Version: number,
  Date: string,
  Description: string,
  SystemTime: string,
  UnusedString: string,
  Information: string
}

/**
 * Parse raw line and create DescriptionData object
 * @param line line which needs to be processed
 * @returns DescriptionData object
 */
export function parseDescriptionLine ( line : string ) : DescriptionData {

  const valueList : string[] = line.split("\"");

  const descriptionData : DescriptionData = {
    Version: Number(valueList[0].trim().split(" ")[0]),
    Date: valueList[0].trim().split(" ")[1],
    Description: valueList[1],
    SystemTime: valueList[2].trim(),
    UnusedString: valueList[3],
    Information: line.substring(line.indexOf("{")) //could be problematic if description field contains this symbol
  }

  return descriptionData;
}


