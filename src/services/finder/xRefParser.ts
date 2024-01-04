
import { XRefInfo, IncludesInfo } from "../../view/app/model";
import { readFile } from "./../helper/fileReader";

export function collectData(readData: string, procedureName: string): XRefInfo{
    let xrefInfo: XRefInfo[] = [];

    const xRefLine =  findLines(readData, procedureName + ",");

    if(xRefLine.length > 0) {
        xrefInfo = xRefLine.map(parseLine);
        xrefInfo[0].procedureName = procedureName;
    }

    return xrefInfo[0];
}

function findLines(fileContent: string, procedureName: string): string[] {
    const fileLines = fileContent.split('\n');
    const lines = fileLines.filter(line => line.includes(procedureName));
    return lines;
}

function parseLine(xRefLine: string) {

    const splitInformation = xRefLine.split(" ");

    const xrefInfo: XRefInfo = {
        fileName: splitInformation[1],
        endLine: Number(splitInformation[2]),
        type: splitInformation[3],
        procedureName: ""
    };

    return xrefInfo;
}

function parseIncludeLine(xRefLine: string) {

    const splitInformation = xRefLine.split(" ");

    const includesInfo: IncludesInfo = {
        fileName: splitInformation[1],
        includeLine: Number(splitInformation[2]),
        includeName: splitInformation[4],
    };

    return includesInfo;
}

export function collectIncludes(readData: string): IncludesInfo[] {
    let includesInfoArray: IncludesInfo[] = [];

    const includeLines = findLines(readData, "INCLUDE");

    if (includeLines.length > 0) {
        includesInfoArray = includeLines.map(parseIncludeLine);
    }

    return includesInfoArray;
}