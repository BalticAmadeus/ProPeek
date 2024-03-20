"user strict";

import { ExtensionContext } from "vscode";

export class Constants {
    public static extensionId = "ProfilerName";
    public static globalExtensionKey = "ProfilerName";
    public static context: ExtensionContext;
    public static fileSearchLimit = 100;
    public static defaultXREFPath = "/.builder/.pct0/";
    public static defaultListingPath = "/listing/";
}


