import { readFile, readFileLinesSync } from "./helper/fileReader";
import { parseProfilerData } from "./parser/profilerRawData";
import { transformData } from "./parser/presentationData";
import { ComparedData, PresentationData } from "../common/PresentationData";
import { getIncludeFiles } from "./helper/xRefParser";
import { ParserLogger } from "./parser/ParserLogger";
import { compareData } from "./parser/compareData";
import { Telemetry } from "../view/app/utils/Telemetry";

export class ProfilerService {
  private profilerTitle: string = "";
  private comparedData: ComparedData | null = null;

  constructor(title: string) {
    this.profilerTitle = title;
  }

  public async parse(
    fileName: string,
    useTracingData: boolean
  ): Promise<PresentationData> {
    const parsingTimeStart = Date.now();

    ParserLogger.resetErrors();

    try {
      const lineGenerator = readFileLinesSync(fileName);

      const rawData = parseProfilerData(lineGenerator, useTracingData);

      const transformedData = await transformData(
        rawData,
        useTracingData,
        this.profilerTitle
      );

      return transformedData;
    } catch (error) {
      throw error;
    } finally {
      const parsingTimeEnd = Date.now();
      const parsingTime = parsingTimeEnd - parsingTimeStart;
      const fileStats = require("fs").statSync(fileName);
      const fileSizeInMB = fileStats.size / 1024 / 1024; // Convert bytes to MB

      Telemetry.setFileSize(fileSizeInMB);
      Telemetry.setParsingTime(parsingTime);

      Telemetry.sendParsingMetrics();
    }
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
