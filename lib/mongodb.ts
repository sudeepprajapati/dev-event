import mongoose, { Connection } from 'mongoose';

/**
 * Type definition for cached Mongoose connection
 * Prevents multiple connections during development
 */
interface CachedConnection {
    conn: Connection | null;
    promise: Promise<typeof mongoose> | null;
}

/**
 * Global type definition to extend NodeJS global namespace
 */
declare global {
    var mongooseCache: CachedConnection | undefined;
}

// Initialize cache on global object with proper typing
let cached: CachedConnection = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;
/**
 * Connects to MongoDB using Mongoose
 * Returns cached connection if already established
 *
 * @throws {Error} If MONGODB_URI environment variable is not defined
 * @returns {Promise<Connection>} MongoDB connection instance
 */
async function connectDB(): Promise<Connection> {
    // Return cached connection if available
    if (cached.conn) {
        console.log('✓ Using cached MongoDB connection');
        return cached.conn;
    }

    // Return ongoing connection promise if already connecting
    if (cached.promise) {
        console.log('⏳ Connection in progress, waiting for promise...');
        const mongooseInstance = await cached.promise;
        return mongooseInstance.connection;
    }

    // Validate MongoDB URI is provided
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('🔄 Establishing new MongoDB connection...');

    // Create new connection promise
    cached.promise = mongoose
        .connect(mongodbUri, {
            // Connection options for optimal performance and stability
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        .then((mongooseInstance) => {
            cached.conn = mongooseInstance.connection;
            console.log('✓ MongoDB connected successfully');
            return mongooseInstance;
        })
        .catch((error) => {
            console.error('✗ MongoDB connection failed:', error.message);
            cached.promise = null;
            throw error;
        });

    const mongooseInstance = await cached.promise;
    return mongooseInstance.connection;
}

export default connectDB;
