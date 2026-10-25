
// Set custom DNS resolvers in local development or if explicitly requested (helps Windows SRV resolution)
if (process.env.USE_CUSTOM_DNS === 'true' || process.env.NODE_ENV !== 'production') {
  try {
    const dns = require('node:dns');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (dnsErr) {
    // Gracefully continue if environment restricts custom DNS servers
  }
}

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is missing from the server .env file");
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
