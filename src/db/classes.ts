import { ClientConfig, QueryConfig } from 'pg'

export class PgClientConfig implements ClientConfig {
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

export class PgQueryConfig implements QueryConfig {
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