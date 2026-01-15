const { Client } = require('pg');

async function testLocalDb() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
        ssl: false
    });

    try {
        await client.connect();
        console.log('Successfully connected to local postgres!');
        await client.end();
        return true;
    } catch (err) {
        console.error('Failed to connect to local postgres:', err.message);
        return false;
    }
}

testLocalDb();
