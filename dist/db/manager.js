"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const db_1 = require("../db");
class PgManager {
    constructor(config) {
        if (config) {
            if (config.version) {
                this.version = config.version;
            }
        }
    }
    async dropDbIfExists() {
        const dbname = db_1.db.getLocalDatabase();
        const queryTerminate = `
			SELECT pg_terminate_backend(pg_stat_activity.pid)
			FROM pg_stat_activity
			WHERE pg_stat_activity.datname = $1
			;`;
        await db_1.db.query('postgres', queryTerminate, [dbname]);
        const queryDrop = `DROP DATABASE IF EXISTS "${dbname}";`;
        await db_1.db.query('postgres', queryDrop);
    }
    async createDbIfNotExist() {
        const dbname = db_1.db.getLocalDatabase();
        const queryCheck = `
      SELECT 1 AS exists
      FROM pg_database
      WHERE datname = $1
    `;
        const res = await db_1.db.query('postgres', queryCheck, [dbname]);
        if (res.rowCount === 0) {
            const queryCreate = `CREATE DATABASE "${dbname}"`;
            await db_1.db.query('postgres', queryCreate);
        }
    }
    async getCurrentVersion() {
        const queryCheck = `
      SELECT 1 AS exists FROM pg_class WHERE relname = 'version'
    `;
        const resCheck = await db_1.db.query(queryCheck);
        if (resCheck.rowCount === 0) {
            return -1;
        }
        const queryGetVersion = 'SELECT ver FROM version ORDER BY ver DESC LIMIT 1;';
        const resVersion = await db_1.db.query(queryGetVersion);
        if (resVersion.rowCount === 0) {
            return -1;
        }
        const currentVer = resVersion.rows[0].ver;
        this.version = currentVer;
        return currentVer;
    }
    async getPatchFolders() {
        const patchMainPath = path.join(__dirname, 'patches');
        const currentVer = await this.getCurrentVersion();
        const clusters = fs.readdirSync(patchMainPath);
        const patchFolders = [];
        for (const c of clusters) {
            if (c.charAt(0) === '.')
                continue;
            const folders = fs.readdirSync(path.join(patchMainPath, c));
            for (const f of folders) {
                if (f.charAt(0) === '.')
                    continue;
                const ver = Number.parseFloat(f);
                if (ver > currentVer) {
                    patchFolders.push([ver, path.join(patchMainPath, c, f)]);
                }
            }
        }
        patchFolders.sort((a, b) => {
            return a[0] - b[0];
        });
        return patchFolders;
    }
    async updateVersion(client, patchVer) {
        const currentVer = await this.getCurrentVersion();
        if (patchVer <= currentVer)
            return;
        const query = 'INSERT INTO version (ver) VALUES ($1);';
        await client.query(query, [patchVer]);
        this.version = patchVer;
    }
    async update() {
        await this.createDbIfNotExist();
        const patchFolders = await this.getPatchFolders();
        await db_1.db.transaction(db_1.db, async () => {
            for (const patchFolder of patchFolders) {
                const patchVer = patchFolder[0];
                const patchPath = patchFolder[1];
                const ver = await this.getCurrentVersion();
                if (patchVer <= ver)
                    continue;
                const files = fs.readdirSync(patchPath);
                if (files.includes('update.js')) {
                    const updatorPath = '.' + path.join(patchPath, 'update.js').slice(__dirname.length);
                    const updator = require(updatorPath);
                    await updator.putPatch(db_1.db);
                }
                else if (files.includes('query.sql')) {
                    const query = fs.readFileSync(path.join(patchPath, 'query.sql'), 'utf8');
                    await db_1.db.query(query);
                }
                else {
                    continue;
                }
                await this.updateVersion(db_1.db, patchVer);
            }
        });
    }
    async rebuild() {
        await this.dropDbIfExists();
        await this.update();
    }
}
exports.PgManager = PgManager;