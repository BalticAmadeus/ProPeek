import { readFileLinesSync } from "./helper/fileReader";
import { parseProfilerData } from "./parser/profilerRawData";
import { transformData } from "./parser/presentationData";
import { ComparedData, PresentationData } from "../common/PresentationData";
import { ParserLogger } from "./parser/ParserLogger";
import { compareData } from "./parser/compareData";
import { Telemetry } from "../view/app/utils/Telemetry";
import { statSync } from "fs";
import { DescriptionData } from "./parser/raw/descriptionData";

export class ProfilerService {
  private profilerTitle: string = "";
  private comparedData: ComparedData | null = null;
  private descriptionData?: DescriptionData;

  constructor(title: string) {
    this.profilerTitle = title;
  }

  public async parse(
    fileName: string,
    useTracingData: boolean
  ): Promise<PresentationData> {
    Telemetry.startCollectingParsingMetrics();
    const parsingTimeStart = Telemetry.getTimeStamp();

    ParserLogger.resetErrors();

    try {
      const lineGenerator = readFileLinesSync(fileName);

      const rawData = parseProfilerData(lineGenerator, useTracingData);
      this.descriptionData = rawData.DescriptionData;

      const transformedData = await transformData(
        rawData,
        useTracingData,
        this.profilerTitle
      );

      return transformedData;
    } catch (error) {
      throw error;
    } finally {
      const parsingTimeEnd = Telemetry.getTimeStamp();
      const parsingTime = parsingTimeEnd - parsingTimeStart;
      const fileStats = statSync(fileName);
      const fileSizeInMB = fileStats.size / 1024 / 1024;

      Telemetry.ParsingData.setFileSize(fileSizeInMB);
      Telemetry.ParsingData.setParsingTime(parsingTime);

      Telemetry.endCollectingParsingMetrics();
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


  public getDescriptionData(): DescriptionData | undefined {
    return this.descriptionData;
  }
}