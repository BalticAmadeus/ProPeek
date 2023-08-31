export interface ModuleData {
  ModuleID   : number,
  ModuleName : string,
  ListingFile: string,
  CRCVal     : number,
  LineNum   ?: number,
  Signature ?: string
}

/**
 * Parse raw line into ModuleData object
 * Line format: 3 "main.p" "" 33680 0 ""
 */
export function parseModuleLine (line : string, version: number) : ModuleData {

  const valueList : string[] = line.split("\"");

  const moduleData : ModuleData = {
    ModuleID   : Number(valueList[0].trim()),
    ModuleName : valueList[1],
    ListingFile: valueList[3],
    CRCVal     : Number(valueList[4].trim().split(" ")[0])
  };

  if (version >= 3) {
    moduleData.LineNum = Number(valueList[4].trim().split(" ")[1]);
    moduleData.Signature = valueList[5];
  }

  const moduleNameEntries : string[] = moduleData.ModuleName.split(" ");

  if (moduleNameEntries.length === 3 &&
      moduleNameEntries[1] === moduleNameEntries[2]){
    moduleNameEntries.splice(2,1);
    moduleData.ModuleName = moduleNameEntries.join(" ");
  }

  return moduleData;
}
