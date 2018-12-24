import { ConnectionConfig } from 'pg'

export class PgConnection implements ConnectionConfig {
  readonly database?: string
  readonly user?: string
  readonly password?: string
  readonly host?: string
  readonly port?: number
  readonly connectionString?: string
  readonly default?: boolean

  constructor(config: PgConnection) {
    this.database = config.database
    this.user = config.user
    this.password = config.password
    this.host = config.host
    this.port = config.port
    this.connectionString = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
    this.default = config.default
  }
}
