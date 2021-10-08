import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { promises } from "fs";
import { fileURLToPath } from 'url';
import path from "path";
import { createCString, receiveCString } from "../wasm-c-string.js";

const pathToTestFolder = path.relative(process.cwd(), path.dirname(fileURLToPath(import.meta.url)));

const pattern = "ajf832459uogt9sd";
let longStringInternal = "";
for (let i = 0; i < (128 * 1024 * 2 / pattern.length); i++) {
    longStringInternal += pattern;
}
const longString = longStringInternal;

const loadTestModule = async () => {
    return await WebAssembly.instantiate(await promises.readFile(`./${pathToTestFolder}/wasm-c-string-test.wasm`));
};

describe("wasm-c-string", () => {
    const testStringRoundTrip = async (str, loadedModule) => {
        const module = loadedModule ?? (await loadTestModule());
        let strOutput;
        createCString(module, str, strAddress => {
            strOutput = receiveCString(module, () => module.instance.exports.string_duplicate(strAddress));
        })
        assert.strictEqual(strOutput, str);
    };

    describe("String round-tripping", () => {
        it("Empty string", () => testStringRoundTrip(""));
        it("Single character", () => testStringRoundTrip("a"));
        it("ASCII only", () => testStringRoundTrip("Look, it's an ASCII string!!!"));
        it("Chinese", () => testStringRoundTrip("子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」"));
        it("Arabic", () => testStringRoundTrip("بِسْمِ ٱللّٰهِ ٱلرَّحْمـَبنِ ٱلرَّحِيمِ"));
        it("Very long string", () => testStringRoundTrip(longString));
    });

    describe("Memory management", () => {
        it("No obvious memory leaks", async () => {
            // Note the initial memory size
            const module = (await loadTestModule());
            // TODO: This doesn't seem to get updated...
            const getMemorySize = () => module.instance.exports.get_memory_size();
            const startingMemorySize = getMemorySize();

            // Memory will likely grow after a large allocation
            testStringRoundTrip(longString, module);
            const grownMemorySize = getMemorySize();

            // Repeatedly allocate and free
            console.log(`Starting memory size: ${startingMemorySize}; after ${longString.length} character allocation, memory size: ${grownMemorySize}`);
            assert.ok(grownMemorySize >= startingMemorySize)
            for (let i = 0; i < 16; i++) {
                testStringRoundTrip(longString, module);
            }

            // Memory size should not have grown, assuming the allocator reuses the freed allocations
            // Note: This isn't valid for trivial allocators like a bump allocator
            assert.strictEqual(getMemorySize(), grownMemorySize);
        });
    });
    // TODO: Mess with the heap first? To make sure it's not just getting lucky with null terminators
});
