const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const use = (create, run) => {
    const o = create();
    try {
        run(o);
    } finally {
        o.dispose();
    }
};

export const useInstanceAllocation = (module, create, run) => {
    use(() => {
        // Create the disposable object first
        const objectWithDispose = {
            address: 0,
            dispose: function() { module.instance.exports.deallocate(this.address); },
        };

        // Then allocate
        objectWithDispose.address = create();
        return objectWithDispose;
    }, (allocation) => run(allocation.address));
};

export const useNewInstanceAllocation = (module, size, run) => {
    return useInstanceAllocation(module, () => module.instance.exports.allocate(size), run);
};

export const getInstanceString = (module, create) => {
    // TODO: No default value
    let str = "";

    // Call the "create" function and get back the address of a struct: [size (32-bit unsigned int), byte1, byte2, ...]
    useInstanceAllocation(module, create, (address) => {
        const buffer = module.instance.exports.memory.buffer;
        const bytes = new Uint8Array(buffer, address);
        const encodedStringLength = bytes.indexOf(0);
        const encodedStringBuffer = new Uint8Array(buffer, address, encodedStringLength);
        str = textDecoder.decode(encodedStringBuffer);
    });

    return str;
};

export const useNewInstanceString = (module, str, run) => {
    // Encode the string (with null terminator) to get the required size
    const nullTerminatedString = str + "\0";
    const encodedString = textEncoder.encode(nullTerminatedString);

    // Allocate space in linear memory for the encoded string
    useNewInstanceAllocation(module, encodedString.length, (address) => {
        // Copy the string into the buffer
        const destination = new Uint8Array(module.instance.exports.memory.buffer, address);
        textEncoder.encodeInto(nullTerminatedString, destination);

        run(address);
    });
};
