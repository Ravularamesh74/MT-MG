import mongoose from 'mongoose';
import Car from '../models/Car';
import { config } from '../config/env';

const cars = [
    {
        name: 'Toyota Innova Crysta',
        manufacturer: 'Toyota',
        year: 2024,
        category: 'MUV',
        registrationNo: 'KA-01-MG-1234',
        seats: 7,
        transmission: 'Automatic',
        fuelType: 'Diesel',
        pricePerDay: 4500,
        pricePerHour: 400,
        status: 'Available',
        location: 'Bangalore',
        image: 'https://static.toyotabharat.com/images/showroom/innova-mmc/gallery04-646x405.jpg',
        mileage: '12-15 kmpl',
        features: ['GPS Navigation', 'Music System', 'Safety Airbags', 'Leather Seats'],
    },
    {
        name: 'Honda City',
        manufacturer: 'Honda',
        year: 2024,
        category: 'Sedan',
        registrationNo: 'KA-01-MG-5678',
        seats: 5,
        transmission: 'Manual',
        fuelType: 'Petrol',
        pricePerDay: 2500,
        pricePerHour: 250,
        status: 'Available',
        location: 'Bangalore',
        image: 'https://images.unsplash.com/photo-1678002239411-d633292ecbc4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aG9uZGElMjBjaXR5fGVufDB8fDB8fHww',
        mileage: '16-18 kmpl',
        features: ['GPS Navigation', 'Music System', 'Power Windows'],
    },
    {
        name: 'Maruti Swift Dzire',
        manufacturer: 'Maruti',
        year: 2023,
        category: 'Sedan',
        registrationNo: 'KA-01-MG-9012',
        seats: 5,
        transmission: 'Manual',
        fuelType: 'Petrol',
        pricePerDay: 2000,
        pricePerHour: 200,
        status: 'Available',
        location: 'Bangalore',
        image: 'https://images.unsplash.com/photo-1663852408695-f57f4d75a536?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3V6dWtpJTIwc3dpZnR8ZW58MHx8MHx8fDA%3D',
        mileage: '22 kmpl',
        features: ['Music System', 'Power Windows', 'Central Locking'],
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB for seeding');

        await Car.deleteMany({});
        console.log('🗑️ Cleared existing cars');

        await Car.insertMany(cars);
        console.log('🚗 Seeded cars successfully');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
