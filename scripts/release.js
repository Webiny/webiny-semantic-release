#!/usr/bin/env node
const { argv } = require("yargs");

if (argv.require) {
    if (Array.isArray(argv.require)) {
        argv.require.map(require);
    } else {
        require(argv.require);
    }
}

// Configure webiny-semantic-release
const wsr = require("./../");

const config = {
    preview: argv.preview || false,
    branch: argv.branch || "master",
    tagFormat: pkg => pkg.name + "@v${version}",
    plugins: [
        wsr.githubVerify(),
        wsr.npmVerify(),
        wsr.analyzeCommits(),
        wsr.releaseNotes(),
        // Make sure "main" field does not start with `src/`
        ({ packages, logger }, next) => {
            packages.map(pkg => {
                const json = pkg.package;
                if (json.main && (json.main.startsWith("src/") || json.main.startsWith("./src/"))) {
                    logger.log(`Updating \`main\` field of %s`, pkg.name);
                    json.main = json.main.replace("src/", "lib/");
                }
            });
            next();
        },
        wsr.updatePackage(),
        ({ packages }, next) => {
            packages.map(pkg => {
                if (pkg.nextRelease.version === "1.0.0") {
                    const date = new Date().toISOString().split("T")[0];
                    pkg.nextRelease.notes = `<a name="1.0.0"></a>\n# 1.0.0 (${date})\n\n\n### Initial release\n\n\n`;
                }
            });
            next();
        },
        wsr.githubPublish(),
        wsr.npmPublish()
    ]
};

wsr.release(config).catch(e => {
    console.error(e);
    process.exit(1);
});
