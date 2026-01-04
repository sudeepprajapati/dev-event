import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { Event, User } from '@/database';
import connectDB from '../mongodb';

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
    const session = await getServerSession(authOptions);
    return !!session?.user?.email;
}

/**
 * Get authenticated user email
 */
export async function getAuthenticatedUserEmail() {
    const session = await getServerSession(authOptions);
    return session?.user?.email || null;
}

/**
 * Check if user is global admin
 */
export async function isGlobalAdmin(email: string) {
    return email === process.env.ADMIN_EMAIL;
}

/**
 * Check if user is organizer of a specific event
 */
export async function isEventOrganizer(eventId: string, userEmail: string) {
    try {
        await connectDB();
        const event = await Event.findById(eventId).populate('organizerId');
        if (!event) return false;

        const organizer = await User.findOne({ email: userEmail });
        if (!organizer) return false;

        return event.organizerId.toString() === organizer._id.toString();
    } catch (error) {
        console.error('Error checking event organizer:', error);
        return false;
    }
}

/**
 * Redirect if not authenticated
 */
export function requireAuth(session: any) {
    if (!session?.user?.email) {
        return false;
    }
    return true;
}

/**
 * Redirect if not admin
 */
export function requireAdmin(email: string | null | undefined) {
    return email === process.env.ADMIN_EMAIL;
}
