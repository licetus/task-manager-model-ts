export class PgConfig {
  readonly database: string
  readonly user: string
  readonly password: string
  readonly host: string
  readonly port: number
  readonly ssl?: any
  readonly types?: any
  readonly statement_timeout?: number
  readonly default?: boolean

  constructor(config: PgConfig) {
    this.database = config.database
    this.user = config.user
    this.password = config.password
    this.host = config.host
    this.port = config.port
    this.ssl = config.ssl
    this.types = config.types
    this.statement_timeout = config.statement_timeout
    this.default = config.default
  }
}

export class PgConnection extends PgConfig {
  readonly connectionString: string

  constructor(config: PgConfig) {
    super(config)
    this.connectionString = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`
  }
}

interface PgConnections {
  postgres: PgConnection[]
}

interface DbConfigSecret {
  hash?: string
}

export class DbConfig {
  readonly database: {
    postgres: PgConnections
  }
  readonly secret: DbConfigSecret = { hash: '' }
  constructor(config: DbConfig) {
    this.database = config.database
    if (config.secret) {
      if (config.secret.hash) this.secret.hash = config.secret.hash
    }
  }
}
