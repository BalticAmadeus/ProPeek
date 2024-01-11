
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
