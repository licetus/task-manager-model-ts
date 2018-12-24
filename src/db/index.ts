import { Client as PgClient, QueryConfig as QC } from 'pg'
import { PgConnection } from './connections'
import * as config from '../../test/config/config.json'

// const config = require('../../test/config/config.json')

class QueryConfig implements QC {
  readonly name?: string
  readonly text: string = ''
  readonly values?: any[]
  constructor(...args: any[]) {
    switch (args.length) {
      case 3:
        this.name = args[0]
        this.text = args[1]
        this.values = args[2]
        break
      case 2:
        if (typeof args[1] === 'string') {
          this.text = args[0]
          this.values = args[1]
        } else {
          this.name = args[0]
          this.text = args[1]
        }
        break
      case 1:
        this.text = args[0]
        break
      default:
        break
    }
  }
}

export class Database {
  readonly database: { postgres: PgConnection[] }
  readonly secret: any = { hash: '' }
  constructor(config: Database) {
    this.database = config.database
    if (config.secret) {
      if (config.secret.hash) this.secret.hash = config.secret.hash
    }
  }

  public query = async (...args: any[]) => {
    const config = new QueryConfig(args)
    const dbname = config.name
    if (this.database.postgres.length === 0) {
      throw new Error('No Connection')
    }
    let connection: PgConnection | null = null
    for (const item of this.database.postgres) {
      if (item.database === dbname) {
        connection = new PgConnection(item)
        break
      }
    }
    if (!connection) {
      console.error(`Connection[${dbname}] does not exist.`)
      for (const item of this.database.postgres) {
        if (item.default === true) {
          console.log('Use default connection.')
          connection = new PgConnection(item)
          break
        }
      }
    }
    if (!connection) {
      console.error(`Default connection does not exit, use first connection as default.`)
      connection = new PgConnection(this.database.postgres[0])
    }
    const client = new PgClient(connection)
    try {
      const res = await client.query(config).then((res) => res)
      return res
    } catch (error) {
      throw error
    } finally {
      client.end()
    }
  }

  public transaction = async (actions: Function, dbname?: string) => {
    if (this.database.postgres.length === 0) {
      throw new Error('No Connection')
    }
    let connection: PgConnection | null = null
    if (dbname) {
      for (const item of this.database.postgres) {
        if (item.database === dbname) {
          connection = new PgConnection(item)
          break
        }
      }
      if (!connection) {
        console.error(`Connection[${dbname}] does not exist.`)
        for (const item of this.database.postgres) {
          if (item.default === true) {
            console.log('Use default connection.')
            connection = new PgConnection(item)
            break
          }
        }
      }
    }
    if (!connection) {
      console.error('Defaut connection does not exist, use first connection as default.')
      connection = new PgConnection(this.database.postgres[0])
    }
    const client = new PgClient(connection)
    try {
      await client.query('BEGIN')
      const res = await actions(client)
      await client.query('COMMIT')
      return res
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.end()
    }
  }
}

export const db = new Database(config as Database)



