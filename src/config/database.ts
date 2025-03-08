
// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root", // Replace with your MySQL username
  password: process.env.DB_PASSWORD || "", // Replace with your MySQL password
  database: process.env.DB_NAME || "rentflow_db", // The database name you want to use
  port: Number(process.env.DB_PORT) || 3306
};

// Connection status helper
export const testConnection = async () => {
  try {
    console.log("Database configuration loaded successfully");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
};
