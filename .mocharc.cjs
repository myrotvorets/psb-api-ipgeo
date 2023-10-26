/** @type {string[]} */
let options;

/** @type {string[]} */
let extension;

if (process.env.JS_TESTS) {
    options = [];
    extension = ['.test.mjs'];
} else {
    options = ['loader=ts-node/esm', 'no-warnings'];
    extension = ['.test.mts'];
}

/** @type {import('mocha').MochaOptions} */
module.exports = {
    recursive: true,
    extension,
    'node-option': options,
    require: 'mocha.setup.mjs',
    reporter: 'mocha-multi',
    'reporter-option': [
        'spec=-',
        process.env.GITHUB_ACTIONS === 'true' ? 'mocha-reporter-gha=-' : null,
        process.env.SONARSCANNER === 'true' ? 'mocha-reporter-sonarqube=test-report.xml' : null,
    ].filter(Boolean),
}
