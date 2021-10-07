import { bin, root, run } from "./build-helpers.js"

(async () => {
    await run(`${bin}/clang -Os --sysroot ${root} -nostartfiles -Wl,--no-entry test/wasm-c-string-test.c -o test/wasm-c-string-test.wasm`);
})();
