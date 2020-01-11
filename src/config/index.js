/**
 * Config module. Reads configuration file located at __projectdir/config/config.ini
 * and loads it into the exported object.
 * @file config.js
 * @module config
 */
const fs = require("fs");
const ini = require("ini");
const path = require("path");

const __projectdir = path.resolve(__dirname, "../..");
let configFile = path.join(__projectdir, "/config/config.ini");
// eslint-disable-next-line no-process-env
if (process.env.NODE_ENV === "test") {
    configFile = path.join(__projectdir, "/test/config.ini");
}
const config = ini.parse(fs.readFileSync(configFile, "utf-8"));

function configure(file) {
    const newConfig = ini.parse(fs.readFileSync(file, "utf-8"));
    newConfig.file = file;

    return newConfig;
}

module.exports = {
    /**
     * __projectdir is a string that denotes the installation path of the eNuk
     * web application. This is useful for any modules that require access to
     * static resource paths.
     * @type {string}
     */
    __projectdir: __projectdir,
    /**
     * configFile is the path to the config.ini file
     * @type {string}
     */
    file: configFile,
    /**
     * database is an object that contains the database connection parameters
     * @property {string} db
     * @property {Number} port
     * @property {string} host
     * @property {string} user
     * @property {string} password
     */
    database: config.database,
    /**
     * logs is an object that contains configuration parameters for the logger
     * @property {string}  logdir      - the absolute path where log files are
     *                                   stored
     * @property {boolean} stacktraces - indicates if traces should be logged
     */
    logs: config.logs,
    /**
     * server is an object that contains runtime parameters for the express
     * server
     * @property {string} mode      - "development", "test", or "production"
     */
    server: config.server,
    /**
     * session is an object that contains configuration parameters for express
     * sessions.
     * @property {string} signingSecret
     * @property {string} clientSecret
     * @property {string} clientId
     */
    slack: config.slack,
    /**
     * configure() is a function that creates a new configuration object
     * using settings from the specified file. This function can be used to
     * supply a custom configuration at run time, if for some reason the default
     * config which is loaded upon initializing this module does not meet
     * requirements.
     * @function
     * @param {string} file - path to configuration ini file
     * @return {Object} the new configuration loaded from the file
     */
    configure: configure,
};
