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

test("load rejects when a service depends on an unregistered service name", async () => {
	const calls = [];
	const missingDependency = createService(uniqueName("missing-dependency"));
	const service = createService(uniqueName("dependent"), calls, [
		missingDependency.name,
	]);
	register(service);

	try {
		await assert.rejects(load(), /unregistered dependency/);
		assert.deepEqual(calls, []);
		assert.equal(LOADED_SERVICE_NAMES.has(service.name), false);
	} finally {
		deregister(service);
	}
});
