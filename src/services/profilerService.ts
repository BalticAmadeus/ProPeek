import { readFile, readUntilLineNumber } from './helper/fileReader';
import { parseProfilerData } from './parser/profilerRawData';
import { transformData } from './parser/presentationData';
import { PresentationData } from '../common/PresentationData';
import { collectData } from  './finder/xRefParser';
import {findLinesWithFunction } from './finder/lineFinder';

export class ProfilerService {
    public parse(fileName: string): PresentationData {
        const readData = readFile(fileName);
        const rawData = parseProfilerData(readData);
        const transformedData = transformData(rawData);
        return transformedData;
    }

    public parseXRef(fileName: string, procedureName: string) {
        const readData = readFile(fileName);
        const xRefInfo = collectData(readData, procedureName);
        return xRefInfo;
    }

    public findFunctionStart(filePath: string, lastLine: number, functionName: string) {
        const readData = readUntilLineNumber(filePath, lastLine);
        if (readData) {
            let lineNumber = findLinesWithFunction(readData, functionName);

            lineNumber = lastLine - lineNumber - 1;
            lineNumber = Math.max(lineNumber, 1);
            return lineNumber;
        }
        return 1;
    }
}

