import { readFile } from './helper/fileReader';
import { parseProfilerData } from './parser/profilerRawData';
import { transformData } from './parser/presentationData';
import { PresentationData } from '../common/PresentationData';

export class ProfilerService {
    public parse(fileName: string): PresentationData {
        const readData = readFile(fileName);
        const rawData = parseProfilerData(readData);
        const transformedData = transformData(rawData);
        return transformedData;
    }
}