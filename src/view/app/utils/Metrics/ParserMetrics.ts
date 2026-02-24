export class ParserMetrics {
    private parsingTime = 0;
    private fileSize = 0;
    private linesOfCode = 0;
    private active = false;

    start() {
        this.reset();
        this.active = true;
    }

    end(): Record<string, number> | undefined {
        if (!this.active) return undefined;
        this.active = false;

        const snapshot = this.getSnapshot();
        this.reset();

        return snapshot;
    }

    setParsingTime(value: number) {
        if (!this.active) return;
        this.parsingTime = value;
    }

    setFileSize(value: number) {
        if (!this.active) return;
        this.fileSize = value;
    }

    setLinesOfCode(value: number) {
        if (!this.active) return;
        this.linesOfCode = value;
    }

    debugLog(message?: string): void {
        console.log("/-------*ParserMetrics Debug*-------/");
        console.log("active session:", this.active);
        console.log("parsingTime:", this.parsingTime, "ms");
        console.log("fileSize:", this.fileSize, "MiB");
        console.log("linesOfCode:", this.linesOfCode);

        if (message) console.log("Message:", message);
        console.log("/-----------------------------------/");
    }

    private getSnapshot(): Record<string, number> {
        return {
            parsingTime: this.parsingTime,
            fileSize: this.fileSize,
            linesOfCode: this.linesOfCode,
        };
    }

    private reset() {
        this.parsingTime = 0;
        this.fileSize = 0;
        this.linesOfCode = 0;
    }
}