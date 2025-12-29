require('ts-node').register({
    compilerOptions: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        target: 'es6'
    },
    transpileOnly: true
});

// Register path aliases from tsconfig.json
const tsconfig = require('./tsconfig.json');
const tsconfigPaths = require('tsconfig-paths');

tsconfigPaths.register({
    baseUrl: tsconfig.compilerOptions.baseUrl || '.',
    paths: tsconfig.compilerOptions.paths
});

const path = require('path');
const script = process.argv[2];
if (!script) {
    console.error('Please provide a script path');
    process.exit(1);
}

require(path.resolve(script));
