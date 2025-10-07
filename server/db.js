import mysql from 'mysql2/promise';

// Create a single, unified pool for the default database
// NOTE: Using 'export const' (named export) to fix the SyntaxError in index.js
export const pool = mysql.createPool({ 
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Pavanreddy@630', 
  database: process.env.DB_NAME || 'student_results_master', // Using your unified database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});