export class ParserLogger {
    public static parserLogger: ParserLogger = new ParserLogger();
    private static errors: string[] = [];

    private constructor () {

    }

    public static logError(errorName: string, ...optionalParams: any[]) {
        console.error(errorName, optionalParams);
        ParserLogger.errors.push(errorName);
    }

    public static getErrors(): string[] {
        return ParserLogger.errors;
    }

    public static resetErrors(): void {
        ParserLogger.errors = [];
    }

}