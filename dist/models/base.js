"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
const db_1 = require("../db");
const errors_1 = tslib_1.__importDefault(require("../errors"));
const ERRORS = {
    InvalidId: 400,
    DatabaseCreateFailed: 400,
    DatabaseUpdateFailed: 400,
    DatabaseDeleteFailed: 400,
    DatabaseFetchFailed: 400,
};
errors_1.default.register(ERRORS);
class DataModel {
    constructor(schemaName, tableName, config) {
        this.independentId = true;
        this.returnCreateTime = true;
        this.returnLastUpdateTime = true;
        this.pkey = 'id';
        this.props = {};
        this.schemaName = schemaName;
        this.tableName = tableName;
        if (config && config.independentId)
            this.independentId = config.independentId;
        if (config && config.returnCreateTime)
            this.returnCreateTime = config.returnCreateTime;
        if (config && config.returnLastUpdateTime)
            this.returnLastUpdateTime = config.returnLastUpdateTime;
        if (config && config.pkey)
            this.pkey = config.pkey;
    }
    setPkeyValue(val) {
        this.props[this.pkey] = val;
    }
    generateResult(data) {
        const res = {};
        this.getShema().forEach((key) => {
            res[key] = data[lodash_1.snakeCase(key)];
        });
        if (this.returnCreateTime)
            res.createTime = data.create_time;
        if (this.returnLastUpdateTime)
            res.lastUpdateTime = data.last_update_time;
        return res;
    }
    async isExist(pkeyValue) {
        const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${this.pkey} = $1;`;
        const res = await db_1.db.query(query, [pkeyValue]);
        return res.rowCount > 0;
    }
    async isExistByKey(key, value) {
        const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${lodash_1.snakeCase(key)} = $1;`;
        const res = await db_1.db.query(query, [value]);
        return res.rowCount > 0;
    }
    async create() {
        if (this.independentId) {
            if (this.props[this.pkey])
                delete this.props[this.pkey];
        }
        const propKeys = Object.keys(this.props).map((prop) => lodash_1.snakeCase(prop)).join(',');
        const propIndex = Object.keys(this.props).map((prop, index) => `$${index + 1}`).join(',');
        const propValues = Object.values(this.props);
        const query = `
      INSERT INTO "${this.schemaName}".${this.tableName} (
        ${propKeys}
      ) VALUES (
        ${propIndex}
      ) RETURNING ${this.pkey}
    ;`;
        const res = await db_1.db.query(query, propValues);
        if (res.rowCount <= 0)
            throw new errors_1.default.DatabaseCreateFailedError();
        this.setPkeyValue(res.rows[0][this.pkey]);
    }
    async update() {
        const { pkey } = this;
        const propAssigns = Object.keys(this.props).filter(key => key !== pkey).map((prop, index) => `${lodash_1.snakeCase(prop)}=$${index + 2}`);
        propAssigns.push('last_update_time = unix_now()');
        const keyIndexStr = propAssigns.join(',');
        const propValues = Object.values(this.props);
        const query = `
      UPDATE "${this.schemaName}".${this.tableName}
      SET ${keyIndexStr}
      WHERE ${this.pkey} = $1
    ;`;
        const res = await db_1.db.query(query, propValues);
        if (res.rowCount <= 0)
            throw new errors_1.default.DatabaseUpdateFailedError();
    }
    async get(pkeyValue) {
        const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${this.pkey} = $1;`;
        const res = await db_1.db.query(query, [pkeyValue]);
        if (res.rowCount <= 0)
            throw new errors_1.default.DatabaseFetchFailedError();
        return this.generateResult(res.rows[0]);
    }
    async getByKey(key, value) {
        const query = `SELECT * FROM "${this.schemaName}".${this.tableName} WHERE ${key} = $1;`;
        const res = await db_1.db.query(query, [value]);
        if (res.rowCount <= 0)
            throw new errors_1.default.DatabaseFetchFailedError();
        return this.generateResult(res.rows[0]);
    }
    async getList(params) {
        const paramsString = utils_1.sqlizeListParams(this.pkey, params);
        const query = `SELECT * from "${this.schemaName}".${this.tableName} ${paramsString};`;
        const res = await db_1.db.query(query);
        return res.rows.map((item) => {
            return this.generateResult(item);
        });
    }
    async getViewList(viewName, pkey, params) {
        const paramsString = utils_1.sqlizeListParams(pkey, params);
        const query = `SELECT * from "${this.schemaName}".${viewName} ${paramsString};`;
        const res = await db_1.db.query(query);
        return res.rows.map((item) => {
            return this.generateResult(item);
        });
    }
    async getViewListCount(viewName, pkey, params) {
        const paramsString = utils_1.sqlizeListParams(pkey, params, true);
        const query = `SELECT COUNT(*) as total from "${this.schemaName}".${viewName} ${paramsString};`;
        const res = await db_1.db.query(query);
        return res.rows[0].total;
    }
    async getListCount(params) {
        const res = await this.getViewListCount(this.tableName, this.pkey, params);
        return res;
    }
    async save() {
        try {
            if (this.props[this.pkey]) {
                const isExist = await this.isExist(this.props[this.pkey]);
                if (!isExist) {
                    await this.create();
                }
                else {
                    const object = await this.get(this.props[this.pkey]);
                    this.getShema().forEach((key) => {
                        if (key !== this.pkey) {
                            if (!this.props[key])
                                this.props[key] = object[key];
                        }
                    });
                    await this.update();
                }
            }
            else {
                await this.create();
            }
        }
        catch (err) {
            throw err;
        }
        return lodash_1.cloneDeep(this);
    }
    async delete(pkeyValue) {
        try {
            let isExist = await this.isExist(pkeyValue);
            if (!isExist) {
                throw new errors_1.default.InvalidIdError();
            }
            else {
                const query = `DELETE FROM "${this.schemaName}".${this.tableName} WHERE ${this.pkey} = $1;`;
                await db_1.db.query(query, [pkeyValue]);
                isExist = await this.isExist(pkeyValue);
                if (isExist)
                    throw new errors_1.default.DatabaseDeleteFailedError();
            }
        }
        catch (err) {
            throw err;
        }
    }
    static async transaction(actions) {
        await db_1.db.transaction(db_1.db, actions);
    }
}
exports.DataModel = DataModel;
