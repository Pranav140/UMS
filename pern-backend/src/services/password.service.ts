import { hash, verify } from '@node-rs/argon2';

export function isHashedPassword(password: string) {
    return password.startsWith('$argon2');
}

export async function hashPassword(password: string) {
    return hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
    });
}

export async function verifyPassword(storedPassword: string, plainPassword: string) {
    if (!isHashedPassword(storedPassword)) {
        return storedPassword === plainPassword;
    }

    try {
        return await verify(storedPassword, plainPassword);
    } catch {
        return false;
    }
}
