import { readFile } from "./helper/fileReader";
import { parseProfilerData } from "./parser/profilerRawData";
import { transformData } from "./parser/presentationData";
import { ComparedData, PresentationData } from "../common/PresentationData";
import { getIncludeFiles } from "./helper/xRefParser";
import { ParserLogger } from "./parser/ParserLogger";
import { compareData } from "./parser/compareData";

export class ProfilerService {
  private profilerTitle: string = "";
  private comparedData: ComparedData | null = null;

  constructor(title: string) {
    this.profilerTitle = title;
  }

  public async parse(
    fileName: string,
    showStartTime: boolean
  ): Promise<PresentationData> {
    ParserLogger.resetErrors();

    const readData = readFile(fileName);
    const rawData = parseProfilerData(readData);
    const transformedData = await transformData(
      rawData,
      showStartTime,
      this.profilerTitle
    );

    return transformedData;
  }

  public async compare(
    presentationData: PresentationData,
    secondPresentationData: PresentationData
  ): Promise<ComparedData> {
    const comparedData = await compareData(
      presentationData,
      secondPresentationData
    );
    this.comparedData = comparedData;
    console.log("Compared Data Cached");
    console.log(this.comparedData);

    return comparedData;
  }

  public getComparedData(): ComparedData | null {
    return this.comparedData;
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
