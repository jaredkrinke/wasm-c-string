import fs from "fs";

const fsa = fs.promises;
const outputDirectory = "dist";

(async () => {
    const packageJson = JSON.parse(await fsa.readFile("package.json"));

    if (!fs.existsSync(outputDirectory)) {
        await fsa.mkdir(outputDirectory);
    }

    await Promise.all(
        ["package.json", ...packageJson.files]
        .map(fileName => fsa.copyFile(fileName, `${outputDirectory}/${fileName}`))
    );

    console.log("Done!");
})();
