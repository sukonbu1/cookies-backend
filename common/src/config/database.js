const { Pool } = require('pg');

// Debug logs
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');

const pool = new Pool({
  connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`,
  // Connection pool configuration for better performance
  max: 20, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idle: 10000, // How long a client is allowed to remain idle before being closed
  acquire: 30000, // Maximum time to acquire a connection
  timeout: 2000, // Maximum time to wait for a connection
  // SSL configuration for Neon DB
  ssl: {
    rejectUnauthorized: false
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection test failed:', err);
  } else {
    console.log('Database connection test successful');
  }
});

module.exports = pool;
