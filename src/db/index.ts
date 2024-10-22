import mongoose from 'mongoose'

const DATABASE_URL = process.env.DATABASE_URL as string

if (!DATABASE_URL) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local',
    )
}

let cached = (global as any).mongoose

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null }
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        }
        cached.promise = mongoose.connect(DATABASE_URL, opts).then(mongoose => {
            console.log('Db connected')
            return mongoose
        })
    }
    try {
        cached.conn = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.conn
}

export default dbConnect