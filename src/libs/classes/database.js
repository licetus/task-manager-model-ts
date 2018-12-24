export class PgConfig {
    constructor(config) {
        this.database = config.database;
        this.user = config.user;
        this.password = config.password;
        this.host = config.host;
        this.port = config.port;
        this.ssl = config.ssl;
        this.types = config.types;
        this.statement_timeout = config.statement_timeout;
        this.default = config.default;
    }
}
export class PgConnection extends PgConfig {
    constructor(config) {
        super(config);
        this.connectionString = `postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    }
}
export class DbConfig {
    constructor(config) {
        this.secret = { hash: '' };
        this.database = config.database;
        if (config.secret) {
            if (config.secret.hash)
                this.secret.hash = config.secret.hash;
        }
    }
}
//# sourceMappingURL=database.js.map