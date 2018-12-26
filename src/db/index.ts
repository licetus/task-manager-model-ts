import pgPromise from 'pg-promise'
import { findIndex } from 'lodash'
import { ClientConfig, QueryConfig } from 'pg'
import config from '../../test/config/config.json'

const pgp = pgPromise({
  // connect(client) {
  //   console.log(`----- Connect to database [${client.database}]`)
  // },
  // disconnect(client) {
  //   console.log(`----- Disconnect database [${client.database}]\n`)
  // },
  // query(e) {
  //   let query = e.query.text
  //   if (query.length > 50) query = '\n......\n......[query content]\n......'
  //   console.log('----- Query: ', query)
  // },
})

class PgClientConfig implements ClientConfig {
  readonly host?: string
  readonly port?: number
  readonly database?: string
  readonly user?: string
  readonly password?: string
  readonly default?: boolean = false

  constructor(config: PgClientConfig) {
    this.host = config.host
    this.port = config.port
    this.database = config.database
    this.user = config.user
    this.password = config.password
    this.default = config.default
  }
}

class PgQueryConfig implements QueryConfig {
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
          this.name = args[0]
          this.text = args[1]
        } else {
          this.text = args[0]
          this.values = args[1]
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

export interface DatabaseConfig {
  database: { postgres: PgClientConfig[] }
  secret?: any
}

export class Database {
  readonly database: { postgres: PgClientConfig[] }
  readonly secret?: any = { hash: '' }
  private localClientConfig: PgClientConfig

  constructor(dbConfig?: DatabaseConfig) {
    if (!dbConfig) dbConfig = config
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
      // console.log(`Set default client config [${configs[index].database}]`)
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
      return res
    } catch (error) {
      throw error
    } finally {
      client.$pool.end()
    }
  }

  public transaction = async (actions: Function, dbname?: string) => {
    const client = new Database(config as Database)
    try {
      await client.query('BEGIN')
      const res = await actions(client)
      await client.query('COMMIT')
      return res
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
    }
  }
}
