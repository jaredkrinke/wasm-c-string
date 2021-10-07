import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { promises } from "fs";
import { fileURLToPath } from 'url';
import path from "path";
import { useNewInstanceString, getInstanceString } from "../wasm-c-string.js";

const pathToTestFolder = path.relative(process.cwd(), path.dirname(fileURLToPath(import.meta.url)));

describe("wasm-c-string", () => {
    describe("String round-tripping", () => {
        const testStringRoundTrip = async (str) => {
            const module = (await WebAssembly.instantiate(await promises.readFile(`./${pathToTestFolder}/wasm-c-string-test.wasm`)));
            let strOutput;
            useNewInstanceString(module, str, strAddress => {
                strOutput = getInstanceString(module, () => module.instance.exports.string_duplicate(strAddress));
            })
            assert.strictEqual(strOutput, str);
        };

        it("Empty string", () => testStringRoundTrip(""));
        it("Single character", () => testStringRoundTrip("a"));
        it("ASCII only", () => testStringRoundTrip("Look, it's an ASCII string!!!"));
        it("Chinese", () => testStringRoundTrip("子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」"));
        it("Arabic", () => testStringRoundTrip("بِسْمِ ٱللّٰهِ ٱلرَّحْمـَبنِ ٱلرَّحِيمِ"));
        // TODO
        //it("Very long string", () => testStringRoundTrip(""));
    });
    // TODO: Mess with the heap first? To make sure it's not just getting lucky with null terminators
    // TODO: Test allocation free/reuse
});
