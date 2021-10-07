#include <malloc.h>
#include <string.h>

#define WASM_EXPORT_AS(name) __attribute__((export_name(name)))
#define WASM_EXPORT(symbol) WASM_EXPORT_AS(#symbol) symbol

void* WASM_EXPORT(allocate)(size_t size) {
    return malloc(size);
}

void WASM_EXPORT(deallocate)(void* allocation) {
    free(allocation);
}

const char* WASM_EXPORT(string_duplicate)(const char *source) {
    return strdup(source);
}
