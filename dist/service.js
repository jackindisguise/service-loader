"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/service.ts
var service_exports = {};
__export(service_exports, {
  LOADED_SERVICES: () => LOADED_SERVICES,
  LOADED_SERVICE_NAMES: () => LOADED_SERVICE_NAMES,
  REGISTERED_SERVICES: () => REGISTERED_SERVICES,
  REGISTERED_SERVICE_NAMES: () => REGISTERED_SERVICE_NAMES,
  configure: () => configure,
  deregister: () => deregister,
  load: () => load,
  loadByName: () => loadByName,
  loadByService: () => loadByService,
  register: () => register
});
module.exports = __toCommonJS(service_exports);
var import_strict = __toESM(require("assert/strict"));
var import_sw = require("sw");
var CONFIG = {};
function configure(options) {
  CONFIG = { ...CONFIG, ...options };
}
var _REGISTERED_SERVICES = [];
var REGISTERED_SERVICES = _REGISTERED_SERVICES;
var _REGISTERED_SERVICE_NAMES = /* @__PURE__ */ new Map();
var REGISTERED_SERVICE_NAMES = _REGISTERED_SERVICE_NAMES;
function serviceRegisteredByName(service) {
  return !!_REGISTERED_SERVICE_NAMES.has(service);
}
function serviceRegisteredByService(service) {
  return !!_REGISTERED_SERVICES.includes(service);
}
function register(...services) {
  for (let service of services) {
    (0, import_strict.default)(
      !serviceRegisteredByName(service.name),
      `service name ${service.name} conflict`
    );
    (0, import_strict.default)(
      !serviceRegisteredByService(service),
      `service object @${service.name} already registered`
    );
    _REGISTERED_SERVICE_NAMES.set(service.name, service);
    _REGISTERED_SERVICES.push(service);
  }
}
function deregister(...services) {
  for (let service of services) {
    (0, import_strict.default)(
      !_serviceLoadedByService(service),
      `service object @${service.name} is loaded -- cannot deregister`
    );
    const idx = _REGISTERED_SERVICES.indexOf(service);
    (0, import_strict.default)(idx !== -1, `service object @${service.name} not registered`);
    _REGISTERED_SERVICE_NAMES.delete(service.name);
    _REGISTERED_SERVICES.splice(idx);
  }
}
var _LOADED_SERVICES = [];
var LOADED_SERVICES = _LOADED_SERVICES;
var _LOADED_SERVICE_NAMES = /* @__PURE__ */ new Map();
var LOADED_SERVICE_NAMES = _LOADED_SERVICE_NAMES;
function _serviceLoadedByName(service) {
  return !!_LOADED_SERVICE_NAMES.has(service);
}
function _serviceLoadedByService(service) {
  return !!_LOADED_SERVICES.includes(service);
}
async function loadByService(service) {
  if (_serviceLoadedByService(service)) return;
  (0, import_strict.default)(
    serviceRegisteredByService(service),
    `service @${service.name} not registered`
  );
  if (CONFIG.beforeLoad) CONFIG.beforeLoad(service);
  const timer = (0, import_sw.sw)();
  await service.loader();
  service.loadTime = timer.stop();
  if (CONFIG.afterLoad) CONFIG.afterLoad(service);
  _LOADED_SERVICES.push(service);
  _LOADED_SERVICE_NAMES.set(service.name, service);
}
async function loadByName(service) {
  if (_serviceLoadedByName(service)) return;
  const regServ = _REGISTERED_SERVICE_NAMES.get(service);
  (0, import_strict.default)(regServ, `service '${service}' not registered before loading`);
  await loadByService(regServ);
}
function generateDependencyGraph(...services) {
  const map = /* @__PURE__ */ new Map();
  for (let service of services)
    map.set(service.name, service.dependencies || []);
  return map;
}
function topoSort(...services) {
  const graph = generateDependencyGraph(...services);
  const loaded = /* @__PURE__ */ new Set();
  const stack = /* @__PURE__ */ new Set();
  const result = [];
  function visit(node) {
    if (stack.has(node)) {
      const formatted = [...stack].map((s) => `@${s}`);
      throw new Error(`cycle detected: ${formatted.join(" .. ")} -> @${node}`);
    }
    if (loaded.has(node)) return;
    stack.add(node);
    for (const dep of graph.get(node) || []) {
      if (!REGISTERED_SERVICE_NAMES.has(dep))
        throw new Error(`@${node} has unregistered dependency '${node}'`);
      visit(dep);
    }
    stack.delete(node);
    loaded.add(node);
    result.push(node);
  }
  for (const node of graph.keys()) visit(node);
  return result;
}
async function load() {
  const sorted = topoSort(...REGISTERED_SERVICES);
  for (let service of sorted) {
    await loadByName(service);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LOADED_SERVICES,
  LOADED_SERVICE_NAMES,
  REGISTERED_SERVICES,
  REGISTERED_SERVICE_NAMES,
  configure,
  deregister,
  load,
  loadByName,
  loadByService,
  register
});
