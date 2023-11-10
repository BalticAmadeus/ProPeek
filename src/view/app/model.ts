
export interface IConfig {
    id: string;
    name: string;
    path: string;
}

export enum ConnectionStatus {
    Connected,
    Connecting,
    NotConnected
}

export interface XRefInfo {
    fileName: string;
    endLine: number;
    type: string;
    procedureName: string;
}

export interface ProcedureNames {
    procedureName: string;
    fileName: string;
}
