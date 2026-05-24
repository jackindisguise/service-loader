# service-loader

A small TypeScript library for defining services up front, registering them as a group, and loading them in dependency order.

## Preferred Workflow

1. Define all services.
2. Register all services.
3. Load all services.

That is the intended usage pattern for this package. You declare the full service graph first, then register all services in one call, then call `load()` once to initialize everything in dependency order.

## Features

- Register one or more services
- Track registered and loaded services
- Load a service by object or by name
- Load all registered services in topological order
- Detect dependency cycles before loading begins
- Build for both ESM and CommonJS consumers

## Installation

```bash
npm install
```

## Build

This package uses `tsup` to bundle the TypeScript source into both ESM and CommonJS outputs, plus declaration files:

```bash
npm run bundle
```

Build outputs are written to `dist/`:

- `dist/service.mjs`
- `dist/service.js`
- `dist/service.d.ts`

## API

The package exports the following types and functions:

- `register(...services)`
- `deregister(...services)`
- `loadByService(service)`
- `loadByName(name)`
- `load()`
- `REGISTERED_SERVICES`
- `REGISTERED_SERVICE_NAMES`
- `LOADED_SERVICES`
- `LOADED_SERVICE_NAMES`

### Service shape

```ts
export interface Service {
  // Unique name used to register, look up, and load the service.
  name: string;

  // Names of services that must load before this one.
  dependencies?: string[];

  // Async initialization function for the service.
  loader: () => Promise<void>;

  // Set automatically after the service finishes loading.
  loadTime?: number;
}
```

## Usage

### ESM JavaScript

```js
import { register, load } from "service-loader";

// 1. Define all services
const database = {
  name: "database",
  loader: async () => {
    // initialize database connections
  },
};

const api = {
  name: "api",
  dependencies: ["database"],
  loader: async () => {
    // start api layer
  },
};

// 2. Register all services at once
register(database, api);

// 3. Load all services
await load();
```

### CommonJS

```js
const { register, load } = require("service-loader");

// 1. Define all services
const database = {
  name: "database",
  loader: async () => {
    // initialize database connections
  },
};

const api = {
  name: "api",
  dependencies: ["database"],
  loader: async () => {
    // start api layer
  },
};

// 2. Register all services at once
register(database, api);

// 3. Load all services
(async () => {
  await load();
})();
```

## Behavior

- `register()` accepts one or more services in a single call.
- `register()` rejects duplicate service names and duplicate service objects.
- `deregister()` accepts one or more services in a single call.
- `loadByService()` and `loadByName()` are idempotent after a service has loaded.
- `load()` topologically sorts all registered services before loading them.
- Cycles in the dependency graph throw an error before loading starts.

## License

ISC
