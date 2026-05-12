# service-loader

A small TypeScript library for registering services, resolving their dependency order, and loading them exactly once.

## Features

- Register services by name
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

This package first compiles the TypeScript source to ESM, then uses Babel to rewrite that output into CommonJS:

```bash
npm run build
```

Build outputs are written to:

- `dist/esm`
- `dist/cjs`

## API

The package exports the following types and functions:

- `register(service)`
- `deregister(service)`
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
  name: string;
  dependencies?: string[];
  loader: () => Promise<void>;
  loadTime?: number;
}
```

## Usage

### ESM

```ts
import {
  register,
  load,
  type Service,
} from "service-loader";

const database: Service = {
  name: "database",
  loader: async () => {
    // initialize database connections
  },
};

const api: Service = {
  name: "api",
  dependencies: ["database"],
  loader: async () => {
    // start api layer
  },
};

register(database);
register(api);

await load();
```

### CommonJS

```ts
const {
  register,
  load,
} = require("service-loader");

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

register(database);
register(api);

(async () => {
  await load();
})();
```

## Behavior

- `register()` rejects duplicate service names and duplicate service objects.
- `loadByService()` and `loadByName()` are idempotent after a service has loaded.
- `load()` topologically sorts all registered services before loading them.
- Cycles in the dependency graph throw an error before loading starts.

## Project Structure

- `src/service.ts` contains the registry and loader implementation.
- `tsconfig.esm.json` controls the ESM TypeScript emit.
- `package.json` contains the Babel step that produces CommonJS output.

## License

ISC
