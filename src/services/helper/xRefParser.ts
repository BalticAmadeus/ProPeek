import { IncludeFile } from "../../common/XRefData";

export function getIncludeFiles(readData: string): IncludeFile[] {
    let includeFiles: IncludeFile[] = [];
    const includeLines = findLinesByType(readData, "INCLUDE");

    if (includeLines.length > 0) {
        includeFiles = includeLines.map(parseIncludeLine);
    }

    return includeFiles;
}

function findLinesByType(fileContent: string, lineType: string): string[] {
    const fileLines = fileContent.split('\n');
    const lines = fileLines.filter(line => line.split(" ")[3] === lineType);

    return lines;
}

function parseIncludeLine(xRefLine: string) {
    const splitInformation = xRefLine.split(" ");
    const includeFile: IncludeFile = {
        parentFileName: splitInformation[1],
        includeLine: Number(splitInformation[2]),
        includeFileName: splitInformation[4]
    };

    return includeFile;
}