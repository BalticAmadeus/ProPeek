import { Constants } from "../../common/Constants";
import { ProfilerRawData } from "../parser/profilerRawData";
import { DescriptionData } from "../parser/raw/descriptionData";
import { ModuleData } from "../parser/raw/moduleData";
import { getCombinedProPath, getFileAndProcedureName } from "../parser/presentation/common";
import { existsSync, readdirSync, readFileSync } from "fs";
import type { Dirent } from "fs";
import * as vscode from "vscode";
import * as path from "path";

// --- Xref file parsing ----------------------------------------------------

export interface DefinitionRecord {
    fileName: string;
    endLine: number;
    name: string;
    kind: string;
}

const definitionRecordsCache = new Map<string, DefinitionRecord[]>();

const baseNameKey = (value: string): string => {
    const posix = (value ?? "").replace(/\\/g, "/");
    return posix.slice(posix.lastIndexOf("/") + 1).toLowerCase();
};

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, "");

function readFileSyncOrEmpty(filePath: string): string {
    try {
        return existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
    } catch {
        return "";
    }
}

/** Parses the PROCEDURE/FUNCTION/METHOD records of an xref file (cached). */
export function getDefinitionRecordsFromXrefFile(xrefFilePath: string): DefinitionRecord[] {
    const cached = definitionRecordsCache.get(xrefFilePath);
    if (cached) {
        return cached;
    }

    const records: DefinitionRecord[] = [];

    for (const line of readFileSyncOrEmpty(xrefFilePath).split(/\r?\n/)) {
        const tokens = line.split(" ").map((token) => token.trim());
        const kind = tokens[3];

        if (kind !== "PROCEDURE" && kind !== "FUNCTION" && kind !== "METHOD") {
            continue;
        }

        const name = (tokens[4] ?? "").split(",")[0].trim();
        const endLine = Number(tokens[2]);

        if (!name || !Number.isFinite(endLine) || endLine < 1) {
            continue;
        }
        records.push({ fileName: (tokens[1] ?? "").trim(), endLine, name, kind });
    }

    records.sort((a, b) => a.endLine - b.endLine);
    definitionRecordsCache.set(xrefFilePath, records);
    return records;
}

/**
 * Finds a module's definition record. Namesake modules ordered by profiler
 * start line correspond to same-name records ordered by end line, so
 * occurrenceIndex disambiguates overloaded procedures.
  */
export function findModuleDefinitionRecord(
    defs: DefinitionRecord[],
    moduleFileName: string,
    procedureName: string,
    occurrenceIndex = 0
): DefinitionRecord | undefined {
    const nameMatches = defs.filter(
        (d) => d.name.toLowerCase() === procedureName.toLowerCase()
    );
    const ownFileMatches = nameMatches.filter(
        (d) => baseNameKey(d.fileName) === baseNameKey(moduleFileName)
    );
    const matches = ownFileMatches.length > 0 ? ownFileMatches : nameMatches;
    return matches.length > 0
        ? matches[Math.min(Math.max(occurrenceIndex, 0), matches.length - 1)]
        : undefined;
}

// --- Xref file discovery ----------------------------------------------------

const xrefFileCache = new Map<string, string>();
let xrefIndexPromise: Promise<XRefIndex> | undefined;

interface XRefIndex {
    byRelativePath: Map<string, string>;
    byFileName: Map<string, string[]>;
}

const getXRefIndex = (descriptionData: DescriptionData): Promise<XRefIndex> =>
    (xrefIndexPromise ??= buildXRefIndex(descriptionData));

async function buildXRefIndex(descriptionData: DescriptionData): Promise<XRefIndex> {
    const index: XRefIndex = { byRelativePath: new Map(), byFileName: new Map() };
    const limits = { maxFiles: 50_000, maxDepth: 20 };

    // Project roots: workspace folders + absolute/resolvable propath entries.
    const roots = new Set<string>(
        (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath)
    );
    const relativeEntries: string[] = [];
    for (const entry of getCombinedProPath(descriptionData)) {
        if (!entry) {
            continue;
        }
        if (path.isAbsolute(entry)) {
            roots.add(entry);
            continue;
        }
        const normalized = entry.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").toLowerCase();
        if (normalized) {
            relativeEntries.push(normalized);
        }
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            const joined = path.join(folder.uri.fsPath, entry);
            if (existsSync(joined)) {
                roots.add(joined);
                break;
            }
        }
    }

    const walk = (dirPath: string, indexRoot: string, depth: number): void => {
        if (depth > limits.maxDepth || index.byRelativePath.size >= limits.maxFiles) {
            return;
        }
        let entries: Dirent[];
        try {
            entries = readdirSync(dirPath, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath, indexRoot, depth + 1);
                continue;
            }
            if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xref")) {
                continue;
            }
            const key = fullPath.slice(indexRoot.length + 1).replace(/\\/g, "/").toLowerCase();
            if (!index.byRelativePath.has(key)) {
                index.byRelativePath.set(key, fullPath);
            }
            for (const prefix of relativeEntries) {
                if (key.startsWith(`${prefix}/`)) {
                    const trimmed = key.slice(prefix.length + 1);
                    if (!index.byRelativePath.has(trimmed)) {
                        index.byRelativePath.set(trimmed, fullPath);
                    }
                }
            }
            const paths = index.byFileName.get(entry.name.toLowerCase()) ?? [];
            if (!paths.includes(fullPath)) {
                paths.push(fullPath);
            }
            index.byFileName.set(entry.name.toLowerCase(), paths);
        }
    };

    for (const root of roots) {
        // Xrefs live under <root>/.builder/.pct<N>/<source-path>/ and <root>/xref/
        const builderDirectory = path.join(root, trimSlashes(Constants.defaultXREFPath).split("/")[0]);
        let pctDirectories: string[] = [];
        try {
            pctDirectories = readdirSync(builderDirectory, { withFileTypes: true })
                .filter((entry) => entry.isDirectory() && /^\.pct\d+$/i.test(entry.name))
                .map((entry) => path.join(builderDirectory, entry.name));
        } catch {
            // no builder directory at this root
        }
        for (const dir of [...pctDirectories, path.join(root, trimSlashes(Constants.defaultXRefRelativePath))]) {
            walk(dir, dir, 0);
        }
    }

    return index;
}

/** Locates a module's xref file via the index. */
const findXRefFile = async (xrefFileName: string, descriptionData: DescriptionData): Promise<string> => {
    const index = await getXRefIndex(descriptionData);
    if (index.byRelativePath.size === 0 && index.byFileName.size === 0) {
        return "";
    }

    const normalizedKey = xrefFileName.replace(/\\/g, "/").toLowerCase();
    const directHit = index.byRelativePath.get(normalizedKey);
    if (directHit) {
        return directHit;
    }

    const baseKey = normalizedKey.split("/").pop() ?? "";
    const candidates = index.byFileName.get(baseKey) ?? [];
    return candidates.length === 1 ? candidates[0] : "";
};

/** Returns the full path of a module's xref file, or "" when there is none. */
export const getXRefFile = async (
    moduleData: ModuleData,
    descriptionData: DescriptionData,
    profilerTitle: string
): Promise<string> => {
    const { fileName } = getFileAndProcedureName(moduleData.ModuleName);
    if (!fileName) {
        return "";
    }

    const cacheKey = `${profilerTitle}_${moduleData.ModuleName}`;
    const cachedValue = xrefFileCache.get(cacheKey);
    if (cachedValue !== undefined) {
        return cachedValue;
    }

    const foundPath = await findXRefFile(`${fileName}.xref`, descriptionData);
    xrefFileCache.set(cacheKey, foundPath);
    return foundPath;
};

export const getHasXRefDirectories = async (descriptionData: DescriptionData): Promise<boolean> => {
    const index = await getXRefIndex(descriptionData);
    return index.byRelativePath.size > 0;
};

export const getHasXRefFiles = async (rawData: ProfilerRawData, profilerTitle: string): Promise<boolean> => {
    if (!(await getHasXRefDirectories(rawData.DescriptionData))) {
        return false;
    }
    for (const module of rawData?.ModuleData ?? []) {
        if ((await getXRefFile(module, rawData.DescriptionData, profilerTitle)).length > 0) {
            return true;
        }
    }
    return false;
};
