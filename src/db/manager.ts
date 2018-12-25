import * as fs from 'fs'
import * as path from 'path'
import { PgClientConfig } from './classes'
import { db, Database } from '../db'

interface ManagerConfig {
  connections: PgClientConfig[]
  version?: string | number
}

export class PgManager {
  private connections: PgClientConfig[]
  public version?: string | number
  private defaultConnection: PgClientConfig | null = null
  constructor(config: ManagerConfig) {
    this.connections = config.connections
    this.version = config.version
    for (const item of this.connections) {
      if (item.default === true) {
        this.defaultConnection = new PgClientConfig(item)
        break
      }
    }
    if (!this.defaultConnection) this.defaultConnection = config.connections[0]
  }
  async dropDbIfExists() {
    const dbname = (this.defaultConnection as PgClientConfig).database 
    const queryTerminate = `
			SELECT pg_terminate_backend(pg_stat_activity.pid)
			FROM pg_stat_activity
			WHERE pg_stat_activity.datname = $1
			;`
    await db.query('postgres', queryTerminate, [dbname])
    const queryDrop = `DROP DATABASE IF EXIST "${dbname}";`
    await db.query('postgres', queryDrop)
  }

  async createDbIfNotExist() {
    const dbname = (this.defaultConnection as PgClientConfig).database
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

  async getCurrentVersion() {
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

  async getPatchFolders() {
    const patchMainPath = path.join(__dirname, 'patches')
    const currentVer = await this.getCurrentVersion()
    const clusters = fs.readdirSync(patchMainPath)
    const patchFolders = []
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
    const query = 'INSET INTO version (ver) VALUES ($1);'
    await client.query(query, [patchVer])
    this.version = patchVer
  }

  async update() {
    await this.createDbIfNotExist()
    const patchFolders = await this.getPatchFolders()
    await db.transaction(async (client: Database) => {
      for (const patchFolder of patchFolders) {
        const patchVer = patchFolder[0] as number
        const patchPath = patchFolder[1] as string
        const ver = await this.getCurrentVersion()
        if (patchVer <= ver) continue
        const files = fs.readdirSync(patchPath)
        if (files.includes('updata.js')) {
          const updatorPath = '.' + path.join(patchPath, 'update.js').slice(__dirname.length)
          const updator = require(updatorPath)
          await updator.putPatch(client)
        } else if (files.includes('query.sql')) {
          const query = fs.readFileSync(path.join(patchPath, 'query.sql'), 'utf8')
          await client.query(query)
        } else {
          continue
        }
        await this.updateVersion(client, patchVer)
      }
    })
  }

  async rebuild() {
    await this.dropDbIfExists()
    await this.update()
  }
}