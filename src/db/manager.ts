import * as fs from 'fs'
import * as path from 'path'
import { db, Database, DatabaseConfig } from '../db'

export interface PgManagerConfig {
  pgConfig?: DatabaseConfig
  version?: string | number
}

export class PgManager {
  public version?: string | number

  constructor(config?: PgManagerConfig) {
    if (config) {
      if (config.version) {
        this.version = config.version
      }
    }
  }
  private async dropDbIfExists() {
    const dbname = db.getLocalDatabase()
    const queryTerminate = `
			SELECT pg_terminate_backend(pg_stat_activity.pid)
			FROM pg_stat_activity
			WHERE pg_stat_activity.datname = $1
			;`
    await db.query('postgres', queryTerminate, [dbname])
    const queryDrop = `DROP DATABASE IF EXISTS "${dbname}";`
    await db.query('postgres', queryDrop)
  }

  private async createDbIfNotExist() {
    const dbname = db.getLocalDatabase()
    const queryCheck = `
      SELECT 1 AS exists
      FROM pg_database
      WHERE datname = $1
    `
    const res = await db.query('postgres', queryCheck, [dbname])
    if (res.rowCount === 0) {
      const queryCreate = `CREATE DATABASE "${dbname}"`
      await db.query('postgres', queryCreate)
    }
  }

  public async getCurrentVersion() {
    const queryCheck = `
      SELECT 1 AS exists FROM pg_class WHERE relname = 'version'
    `
    const resCheck = await db.query(queryCheck)
    if (resCheck.rowCount === 0) {
      return -1
    }
    const queryGetVersion = 'SELECT ver FROM version ORDER BY ver DESC LIMIT 1;'
    const resVersion = await db.query(queryGetVersion)
    if (resVersion.rowCount === 0) {
      return -1
    }
    const currentVer = resVersion.rows[0].ver
    this.version = currentVer
    return currentVer
  }

  private async getPatchFolders() {
    const patchMainPath = path.join(__dirname, 'patches')
    const currentVer = await this.getCurrentVersion()
    const clusters = fs.readdirSync(patchMainPath)
    const patchFolders: any[] = []
    for (const c of clusters) {
      if (c.charAt(0) === '.') continue
      const folders = fs.readdirSync(path.join(patchMainPath, c))
      for (const f of folders) {
        if (f.charAt(0) === '.') continue
        const ver = Number.parseFloat(f)
        if (ver > currentVer) {
          patchFolders.push([ver, path.join(patchMainPath, c, f)])
        }
      }
    }
    patchFolders.sort((a: any[], b: any[]) => {
      return a[0] - b[0]
    })
    return patchFolders
  }

  async updateVersion(client: Database, patchVer: any) {
    const currentVer = await this.getCurrentVersion()
    if (patchVer <= currentVer) return
    const query = 'INSERT INTO version (ver) VALUES ($1);'
    await client.query(query, [patchVer])
    this.version = patchVer
  }

  public async update() {
    await this.createDbIfNotExist()
    const patchFolders = await this.getPatchFolders()
    await db.transaction(db, async () => {
      for (const patchFolder of patchFolders) {
        const patchVer = patchFolder[0] as number
        const patchPath = patchFolder[1] as string
        const ver = await this.getCurrentVersion()
        if (patchVer <= ver) continue
        const files = fs.readdirSync(patchPath)
        if (files.includes('update.js')) {
          const updatorPath = '.' + path.join(patchPath, 'update.js').slice(__dirname.length)
          const updator = require(updatorPath)
          await updator.putPatch(db)
        } else if (files.includes('query.sql')) {
          const query = fs.readFileSync(path.join(patchPath, 'query.sql'), 'utf8')
          await db.query(query)
        } else {
          continue
        }
        await this.updateVersion(db, patchVer)
      }
    })
  }

  public async rebuild() {
    await this.dropDbIfExists()
    await this.update()
  }
}