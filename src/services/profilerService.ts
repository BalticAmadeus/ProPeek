import { readFile } from './helper/fileReader';
import { parseProfilerData } from './parser/profilerRawData';
import { transformData } from './parser/presentationData';
import { PresentationData } from '../common/PresentationData';
import { getIncludeFiles } from './helper/xRefParser';
import { ParserLogger } from './parser/ParserLogger';

export class ProfilerService {

    public parse(fileName: string): PresentationData {
        ParserLogger.resetErrors();

        const readData = readFile(fileName);
        const rawData = parseProfilerData(readData);
        const transformedData = transformData(rawData);

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