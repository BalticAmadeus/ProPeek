import { TelemetryReporter } from "@vscode/extension-telemetry";
import * as vscode from "vscode";
import { ParserMetrics } from "./Metrics/ParserMetrics";

export class Telemetry {
    private static instance: TelemetryReporter;
    private static readonly TELEMETRY_KEY = "__TELEMETRY_KEY__";

    public static ParsingData = new ParserMetrics();

    private constructor() { }

    private static getInstance(): TelemetryReporter {
        if (!Telemetry.instance) {
            Telemetry.instance = new TelemetryReporter(this.TELEMETRY_KEY);
        }
        return Telemetry.instance;
    }

    public static getTimeStamp(): number {
        return Date.now();
    }

    private static isTelemetryEnabled(): boolean {
        const isFormatterTelemetryOn = vscode.workspace
            .getConfiguration("Telemetry")
            .get("propeekTelemetry") as boolean;
        const isGlobalTelemetryOn = vscode.env.isTelemetryEnabled;
        const isKeyInjected = this.TELEMETRY_KEY.startsWith("InstrumentationKey=");

        return isKeyInjected && isFormatterTelemetryOn && isGlobalTelemetryOn;
    }

    public static startCollectingParsingMetrics() {
        if (!this.isTelemetryEnabled()) return;
        this.ParsingData.start();
    }

    public static endCollectingParsingMetrics() {
        const instance = this.getInstance();
        if (!instance) return;

        const snapshot = this.ParsingData.end();
        if (!snapshot) return;

        instance.sendTelemetryEvent("ParserMetrics", {}, snapshot);
    }

}