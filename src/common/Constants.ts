"user strict";

import { ExtensionContext } from "vscode";

export class Constants {
    public static extensionId = "ProfilerName";
    public static globalExtensionKey = "ProfilerName";
    public static context: ExtensionContext;
    public static fileSearchLimit = 100;
    public static defaultXREFPath = "/.builder/.pct0/";
    public static defaultListingPath = "/listing/";
    public static moduleIdMult = 100000;
    public static webinarBannerDismissedKey = "profiler.webinarSeptember2026BannerDismissed";
    public static webinarInfoURL = "https://github.com/BalticAmadeus/ProPeek/discussions/241";
}


