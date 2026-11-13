// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config';

// Node ≥22 ships an experimental `localStorage` global; vitest.config.mts
// passes --localstorage-file so it resolves to a real Storage instance. But
// vitest's jsdom population leaves TWO different Storage classes in play: the
// `Storage` global is jsdom's, while `localStorage` resolves to Node's — so
// specs spying on Storage.prototype would patch a prototype the instance
// never delegates to (real IO, cross-test leakage). Align the global with the
// actual instance's class.
const storageProto = Object.getPrototypeOf(globalThis.localStorage);
if (storageProto?.constructor) {
  Object.defineProperty(globalThis, 'Storage', {
    value: storageProto.constructor,
    writable: true,
    configurable: true,
  });
}
