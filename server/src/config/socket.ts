import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './env';
import VehicleLocation from '../models/VehicleLocation';

let io: SocketServer | null = null;

export function initializeSocket(httpServer: HttpServer): SocketServer {
    io = new SocketServer(httpServer, {
        cors: {
            origin: config.corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Authentication middleware for socket connections
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, config.jwtSecret) as any;
                (socket as any).userId = decoded.id;
                (socket as any).userRole = decoded.role;
            } catch (_err) {
                // Allow unauthenticated connections for public tracking
            }
        }
        next();
    });

    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Subscribe to vehicle location updates
        socket.on('subscribe:vehicle', (vehicleId: string) => {
            socket.join(`vehicle:${vehicleId}`);
            console.log(`📍 ${socket.id} subscribed to vehicle: ${vehicleId}`);
        });

        // Unsubscribe from vehicle updates
        socket.on('unsubscribe:vehicle', (vehicleId: string) => {
            socket.leave(`vehicle:${vehicleId}`);
        });

        // Driver sends location update
        socket.on('location:update', async (data: {
            vehicleId: string;
            lat: number;
            lng: number;
            speed?: number;
            heading?: number;
            bookingId?: string;
        }) => {
            try {
                const userId = (socket as any).userId;

                // Save to database
                await VehicleLocation.findOneAndUpdate(
                    { vehicleId: data.vehicleId },
                    {
                        ...data,
                        driverId: userId,
                        updatedAt: new Date(),
                    },
                    { upsert: true, new: true }
                );

                // Broadcast to subscribers
                io?.to(`vehicle:${data.vehicleId}`).emit('location:updated', {
                    vehicleId: data.vehicleId,
                    lat: data.lat,
                    lng: data.lng,
                    speed: data.speed,
                    heading: data.heading,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error('Location update error:', error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    console.log('🔌 Socket.IO initialized');
    return io;
}

export function getIO(): SocketServer | null {
    return io;
}
