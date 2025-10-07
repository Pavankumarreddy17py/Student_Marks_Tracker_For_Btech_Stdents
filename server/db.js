import mysql from 'mysql2/promise';

let poolInstance = null;

const getDbConfig = () => {
    // Configuration values are retrieved *ONLY* from environment variables.
    // This is the secure configuration.
    const config = {
        host: process.env.MYSQLHOST || process.env.DB_HOST,
        user: process.env.MYSQLUSER || process.env.DB_USER,
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD, 
        database: process.env.MYSQLDATABASE || process.env.DB_NAME, 
        port: process.env.MYSQLPORT || process.env.DB_PORT, 
        
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
    
    if (config.port) {
        config.port = parseInt(config.port, 10);
    } else {
        delete config.port;
    }

    return config;
};

// FIX: We now explicitly define and export the getter function named getPool
export const getPool = () => {
    if (poolInstance === null) {
        const config = getDbConfig();
        
        // CRITICAL CHECK: Throws an error if required credentials are not found (e.g., .env not loaded)
        if (!config.host || !config.user || !config.database || !config.password) {
             console.error("FATAL ERROR: Database credentials missing. Check your .env file or Railway variables.");
             throw new Error("Missing critical environment variables for MySQL connection. Check terminal logs for FATAL ERROR.");
        }
        
        poolInstance = mysql.createPool(config);
    }
    return poolInstance;
};