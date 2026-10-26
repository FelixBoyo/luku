/**
 * Single boot path for server environment variables.
 *
 * Imported for its side effect before anything else in `server.ts`, because ES
 * module bodies are evaluated before the importing module's top-level code —
 * anything reading `process.env` at module scope would otherwise see nothing.
 *
 * `.env` is the shared base and `.env.local` the machine-local override, so a
 * key set in either reaches the server. Files win over inherited shell values:
 * a stale exported key silently outranking the file it was supposed to replace
 * is the exact failure this module exists to prevent. Anything shadowed that
 * way is reported so the swap is never invisible.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ENV_FILE_NAMES = ['.env', '.env.local'] as const;

export type EnvLoadReport = {
    /** Repo root the files were resolved against. */
    root: string;
    files: { file: string; found: boolean }[];
    /** Vars whose inherited shell value was replaced by a file value. */
    shadowed: string[];
};

let report: EnvLoadReport | null = null;

export const loadServerEnv = (): EnvLoadReport => {
    if (report) {
        return report;
    }

    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    const inherited = { ...process.env };
    const files: EnvLoadReport['files'] = [];
    const shadowed = new Set<string>();

    for (const file of ENV_FILE_NAMES) {
        const full = path.join(root, file);
        if (!fs.existsSync(full)) {
            files.push({ file, found: false });
            continue;
        }

        const parsed = dotenv.parse(fs.readFileSync(full));
        for (const [key, value] of Object.entries(parsed)) {
            if (inherited[key] !== undefined && inherited[key] !== value) {
                shadowed.add(key);
            }
            process.env[key] = value;
        }

        files.push({ file, found: true });
    }

    report = { root, files, shadowed: [...shadowed] };
    return report;
};

loadServerEnv();
