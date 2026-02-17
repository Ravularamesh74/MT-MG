import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicleLocation extends Document {
    vehicleId: mongoose.Types.ObjectId;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    driverId?: mongoose.Types.ObjectId;
    bookingId?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const vehicleLocationSchema = new Schema<IVehicleLocation>(
    {
        vehicleId: {
            type: Schema.Types.ObjectId,
            ref: 'Car',
            required: true,
        },
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
        },
        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
        },
        speed: {
            type: Number,
            default: 0,
        },
        heading: {
            type: Number,
            min: 0,
            max: 360,
        },
        driverId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        },
    },
    {
        timestamps: true,
    }
);

// TTL index: auto-remove after 24 hours
vehicleLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });
vehicleLocationSchema.index({ vehicleId: 1 });
vehicleLocationSchema.index({ driverId: 1 });

const VehicleLocation = mongoose.model<IVehicleLocation>('VehicleLocation', vehicleLocationSchema);

export default VehicleLocation;
