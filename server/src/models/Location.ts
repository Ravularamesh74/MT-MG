import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
    name: string;
    city: string;
    address: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    active: boolean;
}

const locationSchema = new Schema<ILocation>(
    {
        name: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        coordinates: {
            latitude: { type: Number },
            longitude: { type: Number },
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Location = mongoose.model<ILocation>('Location', locationSchema);

export default Location;
