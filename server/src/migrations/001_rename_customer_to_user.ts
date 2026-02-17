import mongoose from 'mongoose';
import connectDB from '../config/db';

/**
 * Migration: Rename 'customers' collection to 'users'
 * and add new fields for multi-role support
 */
async function migrate() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error('Database connection not available');
        }

        console.log('🔄 Starting migration: Customer → User...');

        // Check if 'customers' collection exists
        const collections = await db.listCollections({ name: 'customers' }).toArray();

        if (collections.length > 0) {
            // Rename collection
            await db.renameCollection('customers', 'users');
            console.log('✅ Renamed collection: customers → users');

            // Add default fields to existing records
            const usersCollection = db.collection('users');

            await usersCollection.updateMany(
                { role: { $exists: false } },
                { $set: { role: 'user' } }
            );

            await usersCollection.updateMany(
                { role: 'customer' },
                { $set: { role: 'user' } }
            );

            await usersCollection.updateMany(
                { isVerified: { $exists: false } },
                { $set: { isVerified: false } }
            );

            await usersCollection.updateMany(
                { memberSince: { $exists: false }, customerSince: { $exists: true } },
                [{ $set: { memberSince: '$customerSince' } }]
            );

            console.log('✅ Updated user records with new fields');
        } else {
            console.log('ℹ️ No "customers" collection found. Skipping rename.');
        }

        console.log('✅ Migration complete!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
