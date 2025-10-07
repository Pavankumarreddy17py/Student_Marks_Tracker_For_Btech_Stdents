import mysql from 'mysql2/promise';

let poolInstance = null;

const getDbConfig = () => {
    // This logic correctly selects the Railway variables first, then local variables.
    const config = {
        host: process.env.MYSQLHOST || process.env.DB_HOST || "turntable.proxy.rlwy.net",
        user: process.env.MYSQLUSER || process.env.DB_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "FglKBzZBbYzYkeheCyaCduEakIIEjQvw",
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || "railway",
        port: process.env.MYSQLPORT || process.env.DB_PORT || "33254",
        
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

export const getPool = () => {
    if (poolInstance === null) {
        const config = getDbConfig();
        
        if (!config.host || !config.user || !config.database || !config.password) {
             console.error("FATAL ERROR: Database credentials missing. Check your .env file or Railway variables.");
             throw new Error("Missing critical environment variables for MySQL connection. Check terminal logs for FATAL ERROR.");
        }
        
        poolInstance = mysql.createPool(config);
    }
    return poolInstance;
};