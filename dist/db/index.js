"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const pg_promise_1 = tslib_1.__importDefault(require("pg-promise"));
const lodash_1 = require("lodash");
const config_json_1 = tslib_1.__importDefault(require("./config.json"));
const pgp = pg_promise_1.default({
    error(err, e) {
        console.log(err.toString());
        console.log('Query: ', e.query.text);
    },
});
// set numeric
pgp.pg.types.setTypeParser(1700, function (value) {
    return parseFloat(value);
});
// set bigint
pgp.pg.types.setTypeParser(20, function (value) {
    return parseInt(value);
});
class PgClientConfig {
    constructor(config) {
        this.default = false;
        this.host = config.host;
        this.port = config.port;
        this.database = config.database;
        this.user = config.user;
        this.password = config.password;
        this.default = config.default;
    }
}
class PgQueryConfig {
    constructor(...args) {
        this.text = '';
        switch (args.length) {
            case 3:
                this.name = args[0];
                this.text = args[1];
                this.values = args[2];
                break;
            case 2:
                if (typeof args[1] === 'string') {
                    this.name = args[0];
                    this.text = args[1];
                }
                else {
                    this.text = args[0];
                    this.values = args[1];
                }
                break;
            case 1:
                this.text = args[0];
                break;
            default:
                break;
        }
    }
}
class Database {
    constructor(dbConfig) {
        this.secret = { hash: '' };
        this.query = async (...args) => {
            const queryConfig = new PgQueryConfig(...args);
            const client = this.getClient(this.database.postgres, queryConfig.name);
            try {
                const res = await client.result(queryConfig, null, function (res) {
                    return res;
                });
                return res;
            }
            catch (error) {
                throw error;
            }
            finally {
                client.$pool.end();
            }
        };
        this.transaction = async (client, actions) => {
            try {
                await client.query('BEGIN');
                const res = await actions(client);
                await client.query('COMMIT');
                return res;
            }
            catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
            finally {
            }
        };
        if (!dbConfig)
            dbConfig = config_json_1.default;
        this.database = dbConfig.database;
        if (dbConfig.secret) {
            if (dbConfig.secret.hash)
                this.secret.hash = dbConfig.secret.hash;
        }
        this.localClientConfig = this.getDefaultClientConfig(dbConfig.database.postgres);
    }
    getDefaultClientConfig(configs) {
        if (configs.length === 0) {
            throw new Error('No Connection');
        }
        const index = lodash_1.findIndex(configs, ['default', true]);
        if (index === -1) {
            console.log(`No default client config. Set first client config [${configs[0].database}] as default`);
            return configs[0];
        }
        else {
            // console.log(`Set default client config [${configs[index].database}]`)
            return configs[index];
        }
    }
    getClient(configs, dbname) {
        if (dbname) {
            const index = lodash_1.findIndex(configs, ['database', dbname]);
            if (index !== -1) {
                return pgp(configs[index]);
            }
        }
        return pgp(this.localClientConfig);
    }
    getLocalDatabase() {
        return this.localClientConfig.database;
    }
}
exports.Database = Database;
exports.db = new Database(process.env.NODE_ENV === 'test' ? require('../../test/config/config.json') : null);
