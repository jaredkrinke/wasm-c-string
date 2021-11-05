# wasm-c-string
Library for passing JavaScript strings in and out of WebAssembly modules written in C.

# API
## WebAssembly module compatibility
In order to use this library, the WebAssembly module must export two memory management functions:

* `void* allocate(size_t size)`: Allocator
* `void deallocate(void* allocation)`: Deallocator

These functions could simply wrap `malloc` and `free` from `malloc.h`.

## `createCString(module, str, runCallback)`
Copies a string from the JavaScript host into a UTF-8 C string within a WebAssembly module instance's memory and manages the string's lifetime.

`runCallback` is a callback during which the allocated C string must remain alive (the string will be deallocated when this callback returns or throws).

The result of `runCallback` is returned.

## `readStaticCString(module, address)`
Reads a C string from a WebAssembly module instance. Returns a new (JavaScript) string that is a copy of the source C string.

Note: This is only for reading statically allocated strings that require no memory management. See the next function for dynamically allocated strings where the exported C function is passing ownership of the allocation to the caller (e.g. `strdup`).

##  `receiveCString(module, createCallback)`
Receives a newly-allocated C string (created using the supplied callback), copies the string into a JavaScript string, and frees the underlying C string allocation. Returns the (JavaScript) string.

`createCallback` is a callback that allocates the new C string and returns its address (generally, this calls one of the module's exports that returns a newly allocated string, e.g. `strdup`).
