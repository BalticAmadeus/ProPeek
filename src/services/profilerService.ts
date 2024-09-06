import { readFile } from "./helper/fileReader";
import { parseProfilerData } from "./parser/profilerRawData";
import { transformData } from "./parser/presentationData";
import { ComparedData, PresentationData } from "../common/PresentationData";
import { getIncludeFiles } from "./helper/xRefParser";
import { ParserLogger } from "./parser/ParserLogger";
import { compareData } from "./parser/compareData";

export class ProfilerService {
  private profilerTitle: string = "";
  private parsedDataCache: PresentationData | null = null;
  private firstComparedData: ComparedData | null = null;
  private secondComparedData: ComparedData | null = null;

  constructor(title: string) {
    this.profilerTitle = title;
  }

  public async parse(
    fileName: string,
    showStartTime: boolean
  ): Promise<PresentationData> {
    if (this.parsedDataCache) {
      console.log("Using Cached Data Profile Service");
      return this.parsedDataCache;  
    }

    ParserLogger.resetErrors();

    const readData = readFile(fileName);
    const rawData = parseProfilerData(readData);
    const transformedData = await transformData(
      rawData,
      showStartTime,
      this.profilerTitle
    );

    this.parsedDataCache = transformedData;
    
    return transformedData;
  }
  public getCachedData(): PresentationData | null {
    return this.parsedDataCache;
  }
  public async compare(
    presentationData: PresentationData,
    secondPresentationData: PresentationData
  ): Promise<ComparedData> {
    const comparedData = await compareData(
      presentationData,
      secondPresentationData
    );
    this.firstComparedData = comparedData;
    console.log("Compared Data Cached");
    console.log(this.firstComparedData);    

    return comparedData;
  }

  public getComparedData(): ComparedData | null{
    return this.firstComparedData;
  }

  public getErrors(): string[] {
    return ParserLogger.getErrors();
  }

  public getIncludeFilesFromXref(fileName: string) {
    const readData = readFile(fileName);
    const includeFiles = getIncludeFiles(readData);

    return includeFiles;
  }
}
