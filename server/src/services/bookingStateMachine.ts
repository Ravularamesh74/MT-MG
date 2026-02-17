import ApiError from '../utils/ApiError';

export type BookingStatus = 'draft' | 'pending_payment' | 'confirmed' | 'assigned' | 'ongoing' | 'completed' | 'cancelled' | 'refunded';

// Valid state transitions
const transitions: Record<BookingStatus, BookingStatus[]> = {
    draft: ['pending_payment', 'cancelled'],
    pending_payment: ['confirmed', 'cancelled'],
    confirmed: ['assigned', 'cancelled'],
    assigned: ['ongoing', 'cancelled'],
    ongoing: ['completed'],
    completed: ['refunded'],
    cancelled: ['refunded'],
    refunded: [],
};

// Human-readable status labels
export const statusLabels: Record<BookingStatus, string> = {
    draft: 'Draft',
    pending_payment: 'Pending Payment',
    confirmed: 'Confirmed',
    assigned: 'Driver Assigned',
    ongoing: 'Trip in Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
};

/**
 * Check if a transition from current to next status is valid
 */
export function canTransition(current: BookingStatus, next: BookingStatus): boolean {
    return transitions[current]?.includes(next) ?? false;
}

/**
 * Get allowed next statuses from current status
 */
export function getAllowedTransitions(current: BookingStatus): BookingStatus[] {
    return transitions[current] || [];
}

/**
 * Validate and perform a booking status transition
 * Throws ApiError if transition is invalid
 */
export function validateTransition(current: BookingStatus, next: BookingStatus): void {
    if (!canTransition(current, next)) {
        const allowed = getAllowedTransitions(current);
        throw ApiError.badRequest(
            `Cannot transition from '${statusLabels[current]}' to '${statusLabels[next]}'. ` +
            `Allowed transitions: ${allowed.map(s => statusLabels[s]).join(', ') || 'none'}`
        );
    }
}

/**
 * Map legacy booking statuses to new state machine statuses
 */
export function mapLegacyStatus(legacyStatus: string): BookingStatus {
    const mapping: Record<string, BookingStatus> = {
        'Pending': 'pending_payment',
        'Confirmed': 'confirmed',
        'Active': 'ongoing',
        'Completed': 'completed',
        'Cancelled': 'cancelled',
    };
    return mapping[legacyStatus] || 'draft';
}
