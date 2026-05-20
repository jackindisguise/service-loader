const test = require("node:test");
const assert = require("node:assert/strict");

const {
	register,
	load,
	loadByName,
	loadByService,
	REGISTERED_SERVICES,
	REGISTERED_SERVICE_NAMES,
	LOADED_SERVICES,
	LOADED_SERVICE_NAMES,
	deregister,
} = require("../dist/cjs/service.js");

let nextId = 0;

function uniqueName(prefix) {
	nextId += 1;
	return `${prefix}-${nextId}`;
}

function createService(name, calls, dependencies = []) {
	return {
		name,
		dependencies,
		loader: async () => {
			calls.push(name);
		},
	};
}

test("register stores a service by name", () => {
	const calls = [];
	const service = createService(uniqueName("register"), calls);

	register(service);

	assert.equal(REGISTERED_SERVICE_NAMES.get(service.name), service);
	assert.ok(REGISTERED_SERVICES.includes(service));
	assert.deepEqual(calls, []);
	assert.throws(() => register({ ...service }), /service name .* conflict/);
});

test("loadByService only loads a service once", async () => {
	const calls = [];
	const service = createService(uniqueName("single-load"), calls);

	register(service);

	await loadByService(service);
	await loadByService(service);

	assert.deepEqual(calls, [service.name]);
	assert.equal(LOADED_SERVICE_NAMES.get(service.name), service);
	assert.ok(LOADED_SERVICES.includes(service));
	assert.equal(typeof service.loadTime, "number");
	assert.ok(service.loadTime >= 0);
});

test("loadByName is idempotent after a service is loaded", async () => {
	const calls = [];
	const service = createService(uniqueName("by-name"), calls);

	register(service);

	await loadByName(service.name);
	await loadByName(service.name);

	assert.deepEqual(calls, [service.name]);
	assert.equal(LOADED_SERVICE_NAMES.get(service.name), service);
});

test("load loads dependencies before dependents", async () => {
	const calls = [];
	const database = createService(uniqueName("database"), calls);
	const api = createService(uniqueName("api"), calls, [database.name]);

	register(database, api);

	await load();

	assert.deepEqual(calls, [database.name, api.name]);
	assert.ok(LOADED_SERVICES.includes(database));
	assert.ok(LOADED_SERVICES.includes(api));
});

test("load handles a branched dependency graph in dependency-first order", async () => {
	const calls = [];
	const metrics = createService(uniqueName("metrics"), calls);
	const cache = createService(uniqueName("cache"), calls);
	const database = createService(uniqueName("database"), calls, [metrics.name]);
	const auth = createService(uniqueName("auth"), calls, [
		database.name,
		cache.name,
	]);
	const api = createService(uniqueName("api"), calls, [
		auth.name,
		metrics.name,
	]);
	const worker = createService(uniqueName("worker"), calls, [
		database.name,
		api.name,
	]);

	register(worker, api, auth, database, cache, metrics);

	await load();

	assert.deepEqual(calls, [
		metrics.name,
		database.name,
		cache.name,
		auth.name,
		api.name,
		worker.name,
	]);
	assert.equal(LOADED_SERVICE_NAMES.get(worker.name), worker);
	assert.equal(LOADED_SERVICE_NAMES.get(api.name), api);
	assert.equal(LOADED_SERVICE_NAMES.get(auth.name), auth);
	assert.equal(LOADED_SERVICE_NAMES.get(database.name), database);
	assert.equal(LOADED_SERVICE_NAMES.get(cache.name), cache);
	assert.equal(LOADED_SERVICE_NAMES.get(metrics.name), metrics);
});

test("load rejects a complex dependency graph with a cycle", async () => {
	const calls = [];
	const logger = createService(uniqueName("logger"), calls);
	const config = createService(uniqueName("config"), calls, [logger.name]);
	const parser = createService(uniqueName("parser"), calls, [config.name]);
	const validator = createService(uniqueName("validator"), calls, [
		parser.name,
	]);
	const formatter = createService(uniqueName("formatter"), calls, [
		validator.name,
	]);

	logger.dependencies = [formatter.name];

	register(logger, config, parser, validator, formatter);

	await assert.rejects(load(), /cycle detected: @logger.* -> @logger.*/); // logger eventually depends on logger

	assert.deepEqual(calls, []);
	assert.equal(LOADED_SERVICE_NAMES.has(logger.name), false);
	assert.equal(LOADED_SERVICE_NAMES.has(config.name), false);
	assert.equal(LOADED_SERVICE_NAMES.has(parser.name), false);
	assert.equal(LOADED_SERVICE_NAMES.has(validator.name), false);
	assert.equal(LOADED_SERVICE_NAMES.has(formatter.name), false);
});
