const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:Jigyasu@localhost:5432/postgres',
});

async function createDb() {
    try {
        await client.connect();
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'goal_tracker'");
        if (res.rowCount === 0) {
            await client.query('CREATE DATABASE goal_tracker');
            console.log('Database goal_tracker created successfully');
        } else {
            console.log('Database goal_tracker already exists');
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDb();
