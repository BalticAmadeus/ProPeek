import { TelemetryReporter } from "@vscode/extension-telemetry";

interface ParserMetrics {
    [key: string]: number;
    parsingTime: number; // in milliseconds
    fileSize: number; // in KB
    linesOfCode: number; // **Not implemented** total lines of code in the profiler file
}

export class Telemetry {
    private static instance: TelemetryReporter;
    private static parserMetrics: ParserMetrics;
    private static readonly TELEMETRY_KEY =
        "__TELEMETRY_KEY__"; // Replace with your actual telemetry key
    private constructor() { }

    private static getInstance(): TelemetryReporter {
        if (!Telemetry.instance) {
            Telemetry.instance = new TelemetryReporter(this.TELEMETRY_KEY);
        }
        return Telemetry.instance;
    }

    public static sendParsingMetrics(): void {
        if (!this.instance) {
            this.getInstance();
        }
        if (this.parserMetrics) {
            this.instance.sendTelemetryEvent(
                "ParserMetrics",
                {},
                this.parserMetrics
            );
        }

    }

    public static setParsingTime(parsingTime: number): void {
        if (!this.parserMetrics) {
            this.parserMetrics = {} as ParserMetrics;
        }
        this.parserMetrics.parsingTime = parsingTime;
    }

    public static setLinesOfCode(linesOfCode: number): void {
        if (!this.parserMetrics) {
            this.parserMetrics = {} as ParserMetrics;
        }
        this.parserMetrics.linesOfCode = linesOfCode;
    }

    public static setFileSize(fileSize: number): void {
        if (!this.parserMetrics) {
            this.parserMetrics = {} as ParserMetrics;
        }
        this.parserMetrics.fileSize = fileSize;
    }

    public static TelemetryDebugLog(): void {
        console.log("/-------*Telemetry Debug*-------/");
        console.log("instance created? " + this.instance);
        console.log("/--*parserMetrics*--/");
        console.log("filesize:    ", this.parserMetrics.fileSize);
        console.log("parsingTime: ", this.parserMetrics.parsingTime);
        console.log("linesofCode: ", this.parserMetrics.linesOfCode);
        console.log("/-------------------/");
        console.log("/-------------------------------/");
    }
}