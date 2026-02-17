# Mallikarjuna Travels - Backend API

RESTful API backend for the Mallikarjuna Travels car rental system.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# Edit MONGODB_URI, JWT_SECRET, etc.

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mallikarjuna-travels
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:8080,http://localhost:8081
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Cars
- `GET /api/cars` - Get all cars
- `GET /api/cars/:id` - Get car by ID
- `POST /api/cars` - Add new car (admin)
- `PUT /api/cars/:id` - Update car (admin)
- `DELETE /api/cars/:id` - Delete car (admin)

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/status` - Update booking status

### Customers
- `GET /api/customers` - Get all customers (admin)
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer profile

### Reviews
- `GET /api/reviews` - Get all reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/car/:carId` - Get reviews for car

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (admin)
- `GET /api/dashboard/revenue` - Get revenue data
- `GET /api/dashboard/bookings-status` - Get booking status distribution

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── models/         # Mongoose models
│   ├── controllers/    # Route controllers
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express app setup
│   └── server.ts       # Server entry point
├── dist/               # Compiled JavaScript
├── .env                # Environment variables
└── package.json
```

## License

ISC
