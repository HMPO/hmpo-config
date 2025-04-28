# hmpo-config

Configuration loading and caching for an application.

In-depth API Documentation can be found in [API_DOCS.md](./API_DOCS.md)

You can re-generate the documentation after making changes by running:

```bash
npm run documentation
```

## Features and benefits of `hmpo-config`

* Provides config loading from a range of common file formats:
  * `.json`
  * `.json5`
  * `.yaml`
  * `.yml`
* Provides config loading from a standard JavaScript object.
* Provides safe modification of an application config using a deep-merging strategy to nest, preserve, or override values safely.
* Enables easy access to the application's `package.json` and default config values.
* Allows dynamic configuration by running a JavaScript config script in a sandboxed context.

> [!CAUTION]
> Use caution when passing untrusted strings to `addScript()`, as executing arbitrary code can be a security risk.

## Installation

Add `hmpo-config` to your project via npm or yarn

```bash
npm install hmpo-config
```

```bash
yarn add hmpo-config
```

## Usage

You can add `hmpo-config` anywhere you see fit, using:

```javascript
const myConfig = require('hmpo-config');
```

See some examples in:

* [hmpo-form-wizard](https://github.com/HMPO/hmpo-form-wizard/blob/f9ad4df65d500eea2128e6773f09980e17e53d3b/example/config/index.js#L3)
  * A simple example app using `hmpo-config`.
* [hmpo-app](https://github.com/HMPO/hmpo-app/blob/0727b78b453f933e28f20368b0dd5550d5139060/lib/config.js#L4)
  * A more complex implementation, showing a custom config built around `hmpo-config`.

### API Documentation

Full documentation for `hmpo-config` can be found at [API Docs](./API_DOCS.md)

A few examples as follows:

```javascript
// Add hmpo-config to your project, such as in your app.js or index.js
const config = require('hmpo-config');

// Load config from JSON into the app's config object.
config.addFile('filename.json');

// Load config from JSON5 into the app's config object.
config.addFile('filename.json5');

// Load config from YAML into the app's config object.
config.addFile('filename.yaml');

// Add a config string to the app's config object.
config.addString('{ config: "value" }');

// Add a JavaScript object to the app's config object.
config.addConfig({ config: 'value' });

// Run a JavaScript config script in a sandboxed context.
config.addScript('config = "value";');

// Read the current state of the app's config.
let result = config.toJSON();
```
