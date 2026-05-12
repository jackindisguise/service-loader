export type ServiceName = string;
export type ServiceLoader = () => Promise<void>;
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
 * A readonly array of all registered Services.
 */
export declare const REGISTERED_SERVICES: ReadonlyArray<Service>;
/**
 * A readonly map of all registered Service names.
 */
export declare const REGISTERED_SERVICE_NAMES: ReadonlyMap<ServiceName, Service>;
/**
 * Register a Service and its name.
 * @param service
 */
export declare function register(service: Service): void;
/**
 * De-register a Service and its name.
 * @param service
 */
export declare function deregister(service: Service): void;
/**
 * A readonly array of all loaded Services.
 */
export declare const LOADED_SERVICES: ReadonlyArray<Service>;
/**
 * A readonly map of all loaded Service names.
 */
export declare const LOADED_SERVICE_NAMES: ReadonlyMap<ServiceName, Service>;
/**
 * Load a Service directly.
 * @param service
 * @returns
 */
export declare function loadByService(service: Service): Promise<void>;
/**
 * Load a registered Service by its name.
 * @param service
 * @returns
 */
export declare function loadByName(service: ServiceName): Promise<void>;
/**
 * Accepts an array of Services to load.
 * All of the Services are topo-sorted before loading.
 * @param services
 */
export declare function loadServices(services: Service[]): Promise<void>;
//# sourceMappingURL=service.d.ts.map