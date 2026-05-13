"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.REGISTERED_SERVICE_NAMES = exports.REGISTERED_SERVICES = exports.LOADED_SERVICE_NAMES = exports.LOADED_SERVICES = void 0;
exports.deregister = deregister;
exports.load = load;
exports.loadByName = loadByName;
exports.loadByService = loadByService;
exports.register = register;
var _strict = _interopRequireDefault(require("node:assert/strict"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * An array of all registered Services.
 */
const _REGISTERED_SERVICES = [];
/**
 * Expose a readonly array of all registered Services.
 */
const REGISTERED_SERVICES = exports.REGISTERED_SERVICES = _REGISTERED_SERVICES;
/**
 * A map of all registered Service names.
 */
const _REGISTERED_SERVICE_NAMES = new Map();
/**
 * Expose a readonly map of all registered Service names.
 */
const REGISTERED_SERVICE_NAMES = exports.REGISTERED_SERVICE_NAMES = _REGISTERED_SERVICE_NAMES;
/**
 * Check if a Service's name is registered.
 * @param service
 * @returns
 */
function serviceRegisteredByName(service) {
  return !!_REGISTERED_SERVICE_NAMES.has(service);
}
/**
 * Check if a Service is registered.
 * @param service
 * @returns
 */
function serviceRegisteredByService(service) {
  return !!_REGISTERED_SERVICES.includes(service);
}
/**
 * Register a Service and its name.
 * @param service
 */
function register(service) {
  (0, _strict.default)(!serviceRegisteredByName(service.name), `service name ${service.name} conflict`);
  (0, _strict.default)(!serviceRegisteredByService(service), `service object @${service.name} already registered`);
  //logger.info({ package: "service" }, `registered service @${service.name}`);
  _REGISTERED_SERVICE_NAMES.set(service.name, service);
  _REGISTERED_SERVICES.push(service);
}
/**
 * De-register a Service and its name.
 * @param service
 */
function deregister(service) {
  (0, _strict.default)(!_serviceLoadedByService(service), `service object @${service.name} is loaded -- cannot deregister`);
  const idx = _REGISTERED_SERVICES.indexOf(service);
  (0, _strict.default)(idx === -1, `service object @${service.name} not registered`);
  //logger.info({ package: PACKAGE }, `deregistered service @${service}`);
  _REGISTERED_SERVICE_NAMES.delete(service.name);
  _REGISTERED_SERVICES.splice(idx);
}
/**
 * An array of all loaded Services.
 */
const _LOADED_SERVICES = [];
/**
 * Expose a readonly array of all loaded Services.
 */
const LOADED_SERVICES = exports.LOADED_SERVICES = _LOADED_SERVICES;
/**
 * A map of all loaded Service names.
 */
const _LOADED_SERVICE_NAMES = new Map();
/**
 * A readonly map of all loaded Service names.
 */
const LOADED_SERVICE_NAMES = exports.LOADED_SERVICE_NAMES = _LOADED_SERVICE_NAMES;
/**
 * Check if a Service, by name, is loaded.
 * @param service
 * @returns
 */
function _serviceLoadedByName(service) {
  return !!_LOADED_SERVICE_NAMES.has(service);
}
/**
 * Check if a Service is loaded.
 * @param service
 * @returns
 */
function _serviceLoadedByService(service) {
  return !!_LOADED_SERVICES.includes(service);
}
/**
 * Load a Service directly.
 * @param service
 * @returns
 */
async function loadByService(service) {
  if (_serviceLoadedByService(service)) return;
  (0, _strict.default)(serviceRegisteredByService(service), `service @${service.name} not registered`);
  //logger.info({ package: PACKAGE }, `loading service @${service.name}`);
  const start = Date.now();
  await service.loader();
  const end = Date.now();
  service.loadTime = end - start;
  //logger.debug({ package: PACKAGE }, `loaded @${service.name} in ${service.loadTime}ms`);
  _LOADED_SERVICES.push(service);
  _LOADED_SERVICE_NAMES.set(service.name, service);
}
/**
 * Load a registered Service by its name.
 * @param service
 * @returns
 */
async function loadByName(service) {
  if (_serviceLoadedByName(service)) return;
  const regServ = _REGISTERED_SERVICE_NAMES.get(service);
  (0, _strict.default)(regServ, `service '${service}' not registered before loading`);
  await loadByService(regServ);
}
/**
 * Generate a dependency graph for Services.
 * Each Service's name is mapped to all of the Services it depends on.
 * @param services
 * @returns
 */
function generateDependencyGraph(...services) {
  const map = new Map();
  for (let service of services) map.set(service.name, service.dependencies || []);
  return map;
}
/**
 * Topo-sort a dependency graph, ensuring all dependencies are loaded before the Services that depend on them.
 * @param services
 * @returns
 */
function topoSort(...services) {
  const graph = generateDependencyGraph(...services);
  const loaded = new Set(); // already loaded
  const stack = new Set(); // track dependency tree
  const result = []; // dependency-first service name array
  function visit(node) {
    if (stack.has(node)) {
      const formatted = [...stack].map(s => `@${s}`);
      throw new Error(`cycle detected: ${formatted.join(" .. ")} -> @${node}`);
    }
    if (loaded.has(node)) return;
    stack.add(node);
    for (const dep of graph.get(node) || []) visit(dep); // visit dependencies before loading parent
    stack.delete(node);
    loaded.add(node);
    result.push(node);
  }
  // build graph
  for (const node of graph.keys()) visit(node);
  return result;
}
/**
 * Loads all registered services.
 */
async function load() {
  const sorted = topoSort(...REGISTERED_SERVICES);
  // logger.debug({ package: "service" }, `toposorted service graph: ${sorted.map((s) => `@${s}`).join(", ")}`);
  for (let service of sorted) {
    await loadByName(service);
  }
}