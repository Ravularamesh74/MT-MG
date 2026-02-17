import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
    name: string;
    description: string;
    price: number;
    priceType: 'perDay' | 'oneTime';
    icon: string;
    active: boolean;
}

const serviceSchema = new Schema<IService>(
    {
        name: {
            type: String,
            required: [true, 'Service name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Service description is required'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Service price is required'],
            min: [0, 'Price cannot be negative'],
        },
        priceType: {
            type: String,
            enum: ['perDay', 'oneTime'],
            required: [true, 'Price type is required'],
        },
        icon: {
            type: String,
            default: 'Service',
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

const Service = mongoose.model<IService>('Service', serviceSchema);

export default Service;
