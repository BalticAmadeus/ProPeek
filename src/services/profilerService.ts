import { readFile } from './helper/fileReader';
import { parseProfilerData } from './parser/profilerRawData';
import { transformData } from './parser/presentationData';
import { PresentationData } from '../common/PresentationData';
import { getIncludeFiles } from './helper/xRefParser';
import { ParserLogger } from './parser/ParserLogger';

export class ProfilerService {
    private profilerTitle: string = "";

    constructor(title: string) {
        this.profilerTitle = title;
    }

    public async parse(fileName: string, showStartTime: boolean): Promise<PresentationData> {
        ParserLogger.resetErrors();

        const readData = readFile(fileName);
        const rawData = parseProfilerData(readData);
        const transformedData = await transformData(rawData, showStartTime, this.profilerTitle);
        return transformedData;
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