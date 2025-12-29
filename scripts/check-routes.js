// const fetch = require('node-fetch'); // Native fetch in Node 18+

const routes = [
    '/profile',
    '/career',
    '/projects',
    '/network',
    '/discover',
    '/verify',
    '/test'
];

async function checkRoutes() {
    console.log('Checking routes...');
    for (const route of routes) {
        try {
            const url = `http://localhost:3000${route}`;
            const response = await fetch(url);
            console.log(`${route}: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.error(`${route}: Error - ${error.message}`);
        }
    }
}

checkRoutes();
