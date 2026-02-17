import mongoose from 'mongoose';
import connectDB from '../config/db';

/**
 * Migration: Update existing booking statuses to new state machine values
 */
async function migrate() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error('Database connection not available');
        }

        console.log('🔄 Starting migration: Update booking statuses...');

        const bookingsCollection = db.collection('bookings');

        // Map old status values to new state machine values
        const statusMapping: Record<string, string> = {
            'Pending': 'pending_payment',
            'Confirmed': 'confirmed',
            'Active': 'ongoing',
            'Completed': 'completed',
            'Cancelled': 'cancelled',
        };

        for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
            const result = await bookingsCollection.updateMany(
                { status: oldStatus },
                { $set: { status: newStatus } }
            );
            if (result.modifiedCount > 0) {
                console.log(`  ✅ ${oldStatus} → ${newStatus}: ${result.modifiedCount} records`);
            }
        }

        // Update customerId references to point to 'users' collection
        // (Mongoose handles this via the model, but update the ref name if stored)

        console.log('✅ Booking status migration complete!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
