type ServiceName = string;
type ServiceLoader = () => Promise<void>;
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
 * Update config status.
 * Only overwrites supplied keys.
 * @param options
 */
declare function configure(options: Partial<Config>): void;
/**
 * Defines the shape of a Service package.
 */
interface Service {
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
 * Expose a readonly array of all registered Services.
 */
declare const REGISTERED_SERVICES: ReadonlyArray<Service>;
/**
 * Expose a readonly map of all registered Service names.
 */
declare const REGISTERED_SERVICE_NAMES: ReadonlyMap<ServiceName, Service>;
/**
 * Register a Service and its name.
 * @param service
 */
declare function register(...services: Service[]): void;
/**
 * De-register a Service and its name.
 * @param service
 */
declare function deregister(...services: Service[]): void;
/**
 * Expose a readonly array of all loaded Services.
 */
declare const LOADED_SERVICES: ReadonlyArray<Service>;
/**
 * A readonly map of all loaded Service names.
 */
declare const LOADED_SERVICE_NAMES: ReadonlyMap<ServiceName, Service>;
/**
 * Load a Service directly.
 * @param service
 * @returns
 */
declare function loadByService(service: Service): Promise<void>;
/**
 * Load a registered Service by its name.
 * @param service
 * @returns
 */
declare function loadByName(service: ServiceName): Promise<void>;
/**
 * Loads all registered services.
 */
declare function load(): Promise<void>;

export { LOADED_SERVICES, LOADED_SERVICE_NAMES, REGISTERED_SERVICES, REGISTERED_SERVICE_NAMES, type Service, type ServiceLoader, type ServiceName, configure, deregister, load, loadByName, loadByService, register };
