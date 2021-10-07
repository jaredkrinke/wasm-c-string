import { promisify } from "util";
import { execFile } from "child_process";

const wasiSdk = "wasi-sdk";

export const bin = `${wasiSdk}/bin`;
export const root = `${wasiSdk}/share/wasi-sysroot`;

const execFileAsync = promisify(execFile);
export const runExplicit = async (executable, args) => {
    console.log(`${executable} ${args.join(" ")}`);
    await execFileAsync(executable, args);
};

export const run = (str) => {
    const [ executable, ...args ] = str.split(" ");
    return runExplicit(executable, args);
};
