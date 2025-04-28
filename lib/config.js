'use strict';

const debug = require('debug')('hmpo:global-config');
const fs = require('fs');
const resolve = require('path').resolve;
const extname = require('path').extname;
const JSON5 = require('json5');
const yaml = require('js-yaml');
const deepMergeExtend = require('deep-clone-merge').extend;
const appRootPath = require('app-root-path');

class Config {

    /**
     * Creates an instance of the Config class.
     *
     * @class
     * @classdesc
     * Provides configuration loading and caching functionality for an application.
     * This class initializes the root path and prepares a file cache.
     *
     * @param {string} [appRoot] - The root directory of the application. If not provided, it defaults to the result of `appRootPath.toString()`.
     *
     * @example
     * const Config = require('hmpo-config');
     * const config = new Config('/path/to/app/root');
     */
    constructor(appRoot) {
        this.appRoot = appRoot || appRootPath.toString();
        this.fileCache = {};
    }

    /**
     * Loads a configuration file and adds its contents to the existing configuration.
     *
     * @param {string} path - The path to the configuration file to be loaded.
     * @returns {Config} - The current Config instance for method chaining.
     *
     * @example
     * const config = new Config();
     * config.addFile('config/default.json');
     */
    addFile(path) {
        let config = this.loadFile(path);
        this.addConfig(config);
        return this;
    }

    /**
     * Parses a JSON configuration string and adds its contents to the existing configuration.
     *
     * @param {string} str - A JSON string representing configuration data.
     * @returns {Config} - The current Config instance for method chaining.
     *
     * @example
     * const config = new Config();
     * config.addString('{ "port": 3000, "debug": true }');
     */
    addString(str) {
        let config = this.parseFile(str);
        this.addConfig(config);
        return this;
    }

    /**
     * Executes a JavaScript configuration script in a sandboxed context, allowing dynamic configuration.
     *
     * The script is run using Node.js's `vm.runInNewContext`, with the current config object passed in as the context.
     * This allows the script to modify the config directly.
     *
     * ⚠️ **Warning:** Use caution when passing untrusted strings to this method, as executing arbitrary code can be a security risk.
     *
     * @param {string} str - A JavaScript string to be executed, which can modify the configuration object.
     * @returns {Config} - The current Config instance for method chaining.
     *
     * @example
     * const config = new Config();
     * config.addScript('port = 8080; debug = true;');
     * // Config now contains { port: 8080, debug: true }
     */
    addScript(str) {
        this.config = this.toJSON();
        const vm = require('vm');
        vm.runInNewContext(str, this.config);
        return this;
    }

    /**
     * Merges a plain configuration object into the existing configuration using deep merging.
     *
     * This method uses a deep merge strategy to combine the new config with the current one,
     * ensuring nested values are preserved or overwritten appropriately.
     *
     * @param {Object} config - A plain JavaScript object containing configuration properties to merge.
     * @returns {Config} - The current Config instance for method chaining.
     *
     * @example
     * const config = new Config();
     * config.addConfig({ port: 3000, db: { host: 'localhost' } });
     *
     * // Later, add or override parts of the config:
     * config.addConfig({ db: { port: 5432 } });
     * // Final config: { port: 3000, db: { host: 'localhost', port: 5432 } }
     */
    addConfig(config) {
        this.config = deepMergeExtend(this.toJSON(), config);
        return this;
    }

    /**
     * Loads and returns the contents of the application's `package.json` file.
     *
     * This can be useful for accessing metadata such as version, name, or dependencies.
     *
     * @returns {Object} - The parsed contents of the `package.json` file.
     *
     * @example
     * const config = new Config();
     * const pkg = config.getPackage();
     * console.log(pkg.version); // e.g., '1.2.3'
     */
    getPackage() {
        return this.loadFile('package.json');
    }

    /**
     * Returns a set of default configuration values.
     *
     * These defaults include the application's name and version from `package.json`, and the application root path.
     *
     * @returns {Object} - An object containing default configuration values:
     * - `APP_NAME` (string): The name of the application from `package.json`.
     * - `APP_VERSION` (string): The version of the application from `package.json`.
     * - `APP_ROOT` (string): The root directory of the application.
     *
     * @example
     * const config = new Config();
     * const defaults = config.getDefaults();
     * console.log(defaults.APP_NAME); // e.g., 'my-app'
     */
    getDefaults() {
        return {
            APP_NAME: this.getPackage().name,
            APP_VERSION: this.getPackage().version,
            APP_ROOT: this.appRoot
        };
    }

    /**
     * Parses the provided configuration content based on the file extension.
     *
     * This method supports parsing YAML, JSON, and JSON5 formats. Depending on the extension,
     * it will use the appropriate parser to convert the content into a JavaScript object.
     *
     * @param {string} content - The configuration content to be parsed (as a string).
     * @param {string} ext - The file extension that determines the format of the content. Supported extensions include `.yaml`, `.yml`, `.json`, and `.json5`.
     * @returns {Object} - The parsed JavaScript object representation of the configuration.
     *
     * @example
     * const yamlContent = 'name: my-app\nversion: 1.0.0';
     * const config = parseFile(yamlContent, '.yaml');
     * console.log(config.name); // 'my-app'
     *
     * @example
     * const jsonContent = '{"name": "my-app", "version": "1.0.0"}';
     * const config = parseFile(jsonContent, '.json');
     * console.log(config.version); // '1.0.0'
     */
    parseFile(content, ext) {
        switch (ext) {
        case '.yaml':
        case '.yml':
            return yaml.load(content);
        case '.json':
        case '.json5':
        default:
            return JSON5.parse(content);
        }
    }

    /**
     * Loads a configuration file from disk, parses its contents, and caches the result.
     *
     * The file is read from the specified path, parsed based on its extension (e.g., `.yaml`, `.json`),
     * and then the parsed content is cached for future use to avoid repeated file reading.
     * If the file has been previously loaded, the cached data is returned directly.
     *
     * @param {string} path - The path to the configuration file to load. The path is resolved relative to the app root.
     * @returns {Object} - The parsed configuration data from the file.
     * @throws {Error} - An error if the file cannot be read or parsed, with the error message indicating the file path.
     *
     * @example
     * const config = new Config();
     * const data = config.loadFile('config/settings.json');
     * console.log(data); // Parsed JSON configuration data
     */
    loadFile(path) {
        path = resolve(this.appRoot, path);

        let data = this.fileCache[path];
        if (data) return data;

        if (!fs.existsSync(path)) return this.fileCache[path] = {};

        debug('Loading config file', path);
        try {
            let content = fs.readFileSync(path, 'utf8');
            let ext = extname(path);
            data = this.parseFile(content, ext);
            return this.fileCache[path] = data;
        } catch (err) {
            err.fileName = path;
            err.message = 'Error loading config ' + err.fileName + ': ' + err.message;
            throw err;
        }
    }

    /**
     * Returns the current configuration as a JavaScript object.
     *
     * If the configuration has been set, it will return the current config. If not, it falls back to the default configuration.
     *
     * @returns {Object} - The current configuration object, or the default configuration if none is set.
     *
     * @example
     * const config = new Config();
     * const currentConfig = config.toJSON();
     * console.log(currentConfig.APP_NAME); // 'my-app' (default value)
     */
    toJSON() {
        return this.config || this.getDefaults();
    }
}

module.exports = Config;
