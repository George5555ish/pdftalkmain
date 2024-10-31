import connectToDatabase from '@/db';
import { MongoClient, Db, ObjectId } from 'mongodb';

export const trpcDbUtils = {
    findOneUser: async (  userId: string) => {
                const {db} = await connectToDatabase() 
        return await db.collection('users').findOne({ kinde_id: userId });
    },
    createOneUser: async (  newUserData: any) => {
                const {db} = await connectToDatabase()
        return await db.collection('users').insertOne(newUserData);
    },
    findOneFile: async (  id: string, userId: string) => {
                const {db} = await connectToDatabase()
        return await db.collection('files').findOne({
            id,
            userId
        });
    },
    findOneFileByKey: async (  key: string, userId: string) => {
                const {db} = await connectToDatabase()
        return await db.collection('files').findOne({
            key,
            userId
        });
    },
    findAllFiles: async (userId:string ) => {
                const {db} = await connectToDatabase()
        return await db.collection('files').find({userId}).toArray();
    },
    findAndSortAndLimit: async (  fileId: string, limit: number) => {
                const {db} = await connectToDatabase()
        return await db.collection('messages')
            .find({ fileId })         // Filter by `fileId`
            .sort({ createdAt: -1 })   // Sort by `createdAt` in descending order
            .limit(limit + 1).toArray()
    },
    deleteOneFile: async (  id: string) => {
                const {db} = await connectToDatabase()
        return await db.collection('files').deleteOne({
            _id: new ObjectId(id),
        });
    },
}