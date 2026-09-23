import { EventEmitter } from 'events';

/**
 * Example of the Node.js EventEmitter pattern.
 * Synchronous local events within a single process.
 */

const userEvents = new EventEmitter();

// --- LISTENER ---
userEvents.on('user_registered', (user) => {
    console.log(`[Local Event] Sending welcome email to ${user.email}...`);
});

userEvents.on('user_registered', (user) => {
    console.log(`[Local Event] Tracking signup for marketing pixel...`);
});

// --- EMITTER ---
export function registerUser(email: string) {
    const newUser = { id: Date.now(), email };

    console.log('User saved to database.');

    // Fire and forget
    userEvents.emit('user_registered', newUser);

    return newUser;
}
