
import { XRefInfo } from "../../view/app/model";

export function collectData(readData: string, procedureName: string): XRefInfo{
    let xrefInfo: XRefInfo = {
        fileName: "",
        endLine: 1,
        type: "",
        procedureName: procedureName
    };

    const xRefLine =  findLine(readData, procedureName);

    if(xRefLine) {
        xrefInfo = parseLine(xRefLine);
        xrefInfo.procedureName = procedureName;
    }

    return xrefInfo;
}

function findLine(fileContent: string, procedureName: string): string | null {
    const lines = fileContent.split('\n');
    const line = lines.find(line => line.includes(procedureName + ","));

    return line || null;
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


