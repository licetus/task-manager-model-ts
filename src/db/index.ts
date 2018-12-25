import pgPromise from 'pg-promise'
import { findIndex } from 'lodash'
import { PgClientConfig, PgQueryConfig } from './classes'
import * as config from '../../test/config/config.json'
import { QueryConfig } from 'pg';
import { disconnect } from 'cluster';
import { SSL_OP_TLS_BLOCK_PADDING_BUG } from 'constants';

const pgp = pgPromise({
  connect(client) {
    console.log(`----- Connect to database [${client.database}]`)
  },
  disconnect(client) {
    console.log(`----- Disconnect database [${client.database}]\n`)
  },
  query(e) {
    console.log('----- Query: ', e.query)
  },
  transact(e) {
    if (e.ctx.finish) {
      console.log('Duration: ', e.ctx.duration)
      if (e.ctx.success) {
        // e.ctx.result = resolved data
      } else {
        // e.ctx.result = error/rejection reason
      }
    } else {
      console.log('Start Time:', e.ctx.start)
    }
  }
})

export class Database {
  readonly database: { postgres: PgClientConfig[] }
  readonly secret: any = { hash: '' }
  private localClientConfig: PgClientConfig

  constructor(dbConfig: Database) {
    this.database = dbConfig.database
    if (dbConfig.secret) {
      if (dbConfig.secret.hash) this.secret.hash = dbConfig.secret.hash
    }
    this.localClientConfig = this.getDefaultClientConfig(dbConfig.database.postgres)
  }

  private getDefaultClientConfig(configs: PgClientConfig[]) {
    if (configs.length === 0) {
      throw new Error('No Connection')
    }
    const index = findIndex(configs, ['default', true])
    if (index === -1) {
      console.log(`No default client config. Set first client config [${configs[0].database}] as default`)
      return configs[0]
    }
    else {
      console.log(`Set default client config [${configs[index].database}]`)
      return configs[index]
    }
  }

  private getClient(configs: PgClientConfig[], dbname?: string) {
    if (dbname) {
      const index = findIndex(configs, ['database', dbname])
      if (index !== -1) {
        return pgp(configs[index])
      }
    }
    return pgp(this.localClientConfig)
  }

  public getLocalDatabase() {
    return this.localClientConfig.database
  }

  public query = async (...args: any[]) => {
    const queryConfig = new PgQueryConfig(...args)
    const client = this.getClient(this.database.postgres, queryConfig.name)
    try {
      const res = await client.query(queryConfig)
      console.log(res)
      return res
    } catch (error) {
      throw error
    } finally {
      client.$pool.end()
    }
  }

  public transaction = async (actions: Function, dbname?: string) => {
    const client = this.getClient(this.database.postgres, dbname)
    try {
      await client.query('BEGIN')
      const res = await actions(client)
      await client.query('COMMIT')
      return res
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.$pool.end()
    }
  }
}

export const db = new Database(config as Database)



