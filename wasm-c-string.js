const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Copies a string from the JavaScript host into a UTF-8 C string within a WebAssembly module instance's memory and manages the string's lifetime.
 * @param {WebAssembly.WebAssemblyInstantiatedSource} module - Instantiated module that exports allocate/deallocate functions and the associated memory
 * @param {string} str - String to copy from the JavaScript host into a newly-allocated UTF-8 C string in the module instance
 * @param {(number) => any} run - Callback during which the allocated C string must remain alive (it will be freed when this callback returns or throws)
 * @returns {any} - Returns the result of the supplied callback
 */
export const createCString = (module, str, run) => {
    const nullTerminatedString = str + "\0";
    const encodedString = textEncoder.encode(nullTerminatedString);
    const address = module.instance.exports.allocate(encodedString.length);
    try {
        const destination = new Uint8Array(module.instance.exports.memory.buffer, address);
        destination.set(encodedString);
        return run(address);
    } finally {
        module.instance.exports.deallocate(address);
    }
};

/**
 * Reads a C string from a WebAssembly module instance.
 * @param {WebAssembly.WebAssemblyInstantiatedSource} module - Instantiated module that exports its memory
 * @param {number} address - Address (in the module instance's memory) of a UTF-8 C string
 * @returns {string} - Returns a new (JavaScript) string that is a copy of the source C string
 */
export const readStaticCString = (module, address) => {
    const buffer = module.instance.exports.memory.buffer;
    const encodedStringLength = (new Uint8Array(buffer, address)).indexOf(0);
    const encodedStringBuffer = new Uint8Array(buffer, address, encodedStringLength);
    return textDecoder.decode(encodedStringBuffer);
};

/**
 * Receives a newly-allocated C string (created using the supplied callback), copies the string into a JavaScript string, and frees the underlying C string allocation.
 * @param {WebAssembly.WebAssemblyInstantiatedSource} module - Instantiated module that exports allocate/deallocate functions and the associated memory
 * @param {() => number} create - Callback that allocates the new C string and returns its address (generally, this calls one of the module's exports that returns a newly allocated string, e.g. strdup)
 * @returns {string}
 */
export const receiveCString = (module, create) => {
    const address = create();
    try {
        return readStaticCString(module, address);
    } finally {
        module.instance.exports.deallocate(address);
    }
};
