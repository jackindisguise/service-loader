import assert from "node:assert/strict";
import { sw } from "sw";
//import { logger } from "./pino.js";
export type ServiceName = string;
export type ServiceLoader = () => Promise<void>;

/**
 * Insertion point for logging, if you have need for it.
 */
interface Config {
	/** Called before a Service is loaded. */
	beforeLoad?: (service: Service) => Promise<void>;

	/** Called after a Service is loaded. */
	afterLoad?: (service: Service) => Promise<void>;
}

/**
 * Stored config status.
 */
let CONFIG: Config = {};

/**
 * Update config status.
 * Only overwrites supplied keys.
 * @param options
 */
export function configure(options: Partial<Config>) {
	CONFIG = { ...CONFIG, ...options };
}

/**
 * Defines the shape of a Service package.
 */
export interface Service {
	/** The name used to refer to this Service. */
	name: ServiceName;

	/** A list of Services, by name, that this Service depends on. */
	dependencies?: ServiceName[];

	/** The loader for this Service. */
	loader: ServiceLoader;

	/** How long it took to load this Service.
	 * Set at runtime by `loadByService()`. */
	loadTime?: number;
}

/**
 * An array of all registered Services.
 */
const _REGISTERED_SERVICES: Service[] = [];

/**
 * Expose a readonly array of all registered Services.
 */
export const REGISTERED_SERVICES: ReadonlyArray<Service> = _REGISTERED_SERVICES;

/**
 * A map of all registered Service names.
 */
const _REGISTERED_SERVICE_NAMES: Map<ServiceName, Service> = new Map<
	ServiceName,
	Service
>();

/**
 * Expose a readonly map of all registered Service names.
 */
export const REGISTERED_SERVICE_NAMES: ReadonlyMap<ServiceName, Service> =
	_REGISTERED_SERVICE_NAMES;

/**
 * Check if a Service's name is registered.
 * @param service
 * @returns
 */
function serviceRegisteredByName(service: ServiceName): boolean {
	return !!_REGISTERED_SERVICE_NAMES.has(service);
}

/**
 * Check if a Service is registered.
 * @param service
 * @returns
 */
function serviceRegisteredByService(service: Service) {
	return !!_REGISTERED_SERVICES.includes(service);
}

/**
 * Register a Service and its name.
 * @param service
 */
export function register(...services: Service[]) {
	for (let service of services) {
		assert(
			!serviceRegisteredByName(service.name),
			`service name ${service.name} conflict`,
		);
		assert(
			!serviceRegisteredByService(service),
			`service object @${service.name} already registered`,
		);
		_REGISTERED_SERVICE_NAMES.set(service.name, service);
		_REGISTERED_SERVICES.push(service);
	}
}

/**
 * De-register a Service and its name.
 * @param service
 */
export function deregister(...services: Service[]) {
	for (let service of services) {
		assert(
			!_serviceLoadedByService(service),
			`service object @${service.name} is loaded -- cannot deregister`,
		);
		const idx = _REGISTERED_SERVICES.indexOf(service);
		assert(idx !== -1, `service object @${service.name} not registered`);
		_REGISTERED_SERVICE_NAMES.delete(service.name);
		_REGISTERED_SERVICES.splice(idx);
	}
}

/**
 * An array of all loaded Services.
 */
const _LOADED_SERVICES: Service[] = [];

/**
 * Expose a readonly array of all loaded Services.
 */
export const LOADED_SERVICES: ReadonlyArray<Service> = _LOADED_SERVICES;

/**
 * A map of all loaded Service names.
 */
const _LOADED_SERVICE_NAMES: Map<ServiceName, Service> = new Map<
	ServiceName,
	Service
>();

/**
 * A readonly map of all loaded Service names.
 */
export const LOADED_SERVICE_NAMES: ReadonlyMap<ServiceName, Service> =
	_LOADED_SERVICE_NAMES;

/**
 * Check if a Service, by name, is loaded.
 * @param service
 * @returns
 */
function _serviceLoadedByName(service: ServiceName) {
	return !!_LOADED_SERVICE_NAMES.has(service);
}

/**
 * Check if a Service is loaded.
 * @param service
 * @returns
 */
function _serviceLoadedByService(service: Service) {
	return !!_LOADED_SERVICES.includes(service);
}

/**
 * Load a Service directly.
 * @param service
 * @returns
 */
export async function loadByService(service: Service) {
	if (_serviceLoadedByService(service)) return;
	assert(
		serviceRegisteredByService(service),
		`service @${service.name} not registered`,
	);

	if (CONFIG.beforeLoad) CONFIG.beforeLoad(service);
	const timer = sw();
	await service.loader();
	service.loadTime = timer.stop();
	if (CONFIG.afterLoad) CONFIG.afterLoad(service);
	_LOADED_SERVICES.push(service);
	_LOADED_SERVICE_NAMES.set(service.name, service);
}

/**
 * Load a registered Service by its name.
 * @param service
 * @returns
 */
export async function loadByName(service: ServiceName) {
	if (_serviceLoadedByName(service)) return;
	const regServ = _REGISTERED_SERVICE_NAMES.get(service);
	assert(regServ, `service '${service}' not registered before loading`);
	await loadByService(regServ);
}

/**
 * Generate a dependency graph for Services.
 * Each Service's name is mapped to all of the Services it depends on.
 * @param services
 * @returns
 */
function generateDependencyGraph(
	...services: Service[]
): Map<ServiceName, ServiceName[]> {
	const map = new Map<ServiceName, ServiceName[]>();
	for (let service of services)
		map.set(service.name, service.dependencies || []);
	return map;
}

/**
 * Topo-sort a dependency graph, ensuring all dependencies are loaded before the Services that depend on them.
 * @param services
 * @returns
 */
function topoSort(...services: Service[]): ServiceName[] {
	const graph = generateDependencyGraph(...services);
	const loaded: Set<ServiceName> = new Set(); // already loaded
	const stack: Set<ServiceName> = new Set(); // track dependency tree
	const result: ServiceName[] = []; // dependency-first service name array

	function visit(node: ServiceName) {
		if (stack.has(node)) {
			const formatted = [...stack].map((s) => `@${s}`);
			throw new Error(`cycle detected: ${formatted.join(" .. ")} -> @${node}`);
		}
		if (loaded.has(node)) return;

		stack.add(node);

		for (const dep of graph.get(node) || []) {
			if (!REGISTERED_SERVICE_NAMES.has(dep))
				throw new Error(`@${node} has unregistered dependency '${node}'`);
			visit(dep); // visit dependencies before loading parent
		}

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
export async function load() {
	const sorted = topoSort(...REGISTERED_SERVICES);
	for (let service of sorted) {
		await loadByName(service);
	}
}
