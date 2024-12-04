import crypto from 'crypto';

export const generateRandomId = (length = 16) => crypto.randomBytes(length).toString('hex');
