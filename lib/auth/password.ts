import bcryptjs from "bcryptjs";

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcryptjs.genSalt(10);
    return bcryptjs.hash(password, salt);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password
 * @returns Whether passwords match
 */
export async function comparePasswords(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcryptjs.compare(password, hashedPassword);
}
