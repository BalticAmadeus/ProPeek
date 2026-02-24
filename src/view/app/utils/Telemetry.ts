import { TelemetryReporter } from "@vscode/extension-telemetry";
import * as vscode from "vscode";

interface ParserMetrics {
    [key: string]: number;
    parsingTime: number; // in milliseconds
    fileSize: number; // in MB
    linesOfCode: number; // total lines of code in the profiler file
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

    private static isTelemetryEnabled(): boolean {
        const isFormatterTelemetryOn = vscode.workspace
            .getConfiguration("Telemetry")
            .get("propeekTelemetry") as boolean;
        const isGlobalTelemetryOn = vscode.env.isTelemetryEnabled;
        const isKeyInjected = this.TELEMETRY_KEY.startsWith(
            "InstrumentationKey="
        );

        return isKeyInjected && isFormatterTelemetryOn && isGlobalTelemetryOn;
    }

    public static sendParsingMetrics(): void {
        if (!this.isTelemetryEnabled()) return;

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
        if (!this.isTelemetryEnabled()) return;

        if (!this.parserMetrics) {
            this.parserMetrics = {} as ParserMetrics;
        }
        this.parserMetrics.parsingTime = parsingTime;
    }

    public static setLinesOfCode(linesOfCode: number): void {
        if (!this.isTelemetryEnabled()) return;

        if (!this.parserMetrics) {
            this.parserMetrics = {} as ParserMetrics;
        }
        this.parserMetrics.linesOfCode = linesOfCode;
    }

    public static setFileSize(fileSize: number): void {
        if (!this.isTelemetryEnabled()) return;

        if (!this.parserMetrics) {
            this.parserMetrics = {} as ParserMetrics;
        }
        this.parserMetrics.fileSize = fileSize;
    }

    public static TelemetryDebugLog(message?: String): void {
        console.log("/-------*Telemetry Debug*-------/");
        console.log("instance created? " + this.instance);
        console.log("/--*parserMetrics*--/");

        if (this.parserMetrics) {
        console.log("filesize:    ", this.parserMetrics.fileSize, " MB");
        console.log("parsingTime: ", this.parserMetrics.parsingTime);
        console.log("linesofCode: ", this.parserMetrics.linesOfCode);
        } else {
            console.log("parserMetrics is not initialized.");
        }

        console.log("/-------------------/");
        if (message)
            console.log("Message: ", message);
        console.log("/-------------------------------/");
    }
}