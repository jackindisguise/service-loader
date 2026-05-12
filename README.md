# service

A small TypeScript library for registering services, resolving their dependency order, and loading them exactly once.

## Features

- Register services by name
- Track registered and loaded services
- Load a service by object or by name
- Load a dependency graph in topological order
- Detect dependency cycles before loading begins
- Build for both ESM and CommonJS consumers

## Installation

```bash
npm install
```

## Build

This package builds TypeScript into both ESM and CommonJS outputs:

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
- `loadServices(services)`
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
  loadServices,
  type Service,
} from "service";

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

await loadServices([api, database]);
```

### CommonJS

```ts
const {
  register,
  loadServices,
} = require("service");

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

await loadServices([api, database]);
```

## Behavior

- `register()` rejects duplicate service names and duplicate service objects.
- `loadByService()` and `loadByName()` are idempotent after a service has loaded.
- `loadServices()` topologically sorts the provided services before loading them.
- Cycles in the dependency graph throw an error before loading starts.

## Project Structure

- `src/service.ts` contains the registry and loader implementation.
- `tsconfig.esm.json` and `tsconfig.cjs.json` define the two build targets.

## License

ISC
