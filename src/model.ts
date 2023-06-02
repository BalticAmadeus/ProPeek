export interface IConfig {
    name: string;
}

export enum ConnectionStatus {
    Connected,
    Connecting,
    NotConnected
}

export interface IQueryParams {
    tableName: string;
}


export enum CommandAction {
    Save,
    Test,
    Query,
    FieldsRefresh,
    Export,
    CRUD,
    Submit,
    UpdateColumns
}

export interface FieldRow {
    order: number;
    name: string;
    type: string;
    format: string;
    label: string;
    initial: string;
    columnLabel: string;
    mandatory: string;
    extent: number;
    decimals: number;
    rpos: number;
    valexp: string;
    valMessage: string;
    helpMsg: string;
    description: string;
    viewAs: string;
}

export interface IndexRow {
    cName: string;
    cFlags: string;
    cFields: string;
}

export interface TableDetails {
    fields: FieldRow[],
    indexes: IndexRow[],
    selectedColumns?: string[]
}

export enum ProcessAction {
    Insert,
    Update,
    Delete,
    Submit,
    Read,
    Copy
}

export enum DataToExport {
    Table,
    Filter,
    Selection
}

export interface TableCount {
    tableName: string | undefined,
    count: number
}

export interface IPort {
    port: number,
    isInUse: boolean,
    timestamp: number | undefined
}