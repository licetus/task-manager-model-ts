"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const restify_errors_1 = require("restify-errors");
class Errors {
    constructor() {
        this.InternalError = restify_errors_1.InternalError;
        this.normalize = (name) => {
            if (!name.endsWith('Error')) {
                return `${name}Error`;
            }
            return name;
        };
        this.lang = (error) => {
            if (error.message) {
                return error.message;
            }
            else {
                const name = error.name.slice(0, -5);
                return this.localization[name];
            }
        };
        this.register = (errors) => {
            Object.keys(errors).forEach((key) => {
                const config = errors[key];
                const errorName = this.normalize(key);
                switch (typeof config) {
                    case 'number':
                        this[errorName] = restify_errors_1.makeConstructor(errorName, {
                            statusCode: config,
                        });
                        break;
                    case 'object':
                        this[errorName] = restify_errors_1.makeConstructor(errorName, config);
                        break;
                    default:
                        throw new Error(`Invalid error config for ${errorName}`);
                }
            });
        };
        this.update = (localization) => {
            this.localization = Object.keys(localization).reduce((previousLocalization, key) => {
                previousLocalization[key] = localization[key];
                return previousLocalization;
            }, this.localization);
        };
        const locales = require('../config/config.json').locales || 'en-US';
        this.localization = require(`./locale.${locales}.json`);
    }
}
const errors = new Errors();
exports.default = errors;
