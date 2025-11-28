
import { UserCredentials } from '../fixtures/users';

export class UserHelpers {

    static maskPassword(password: string): string {
        return '*'.repeat(password.length);
    }
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static validatePassword(password: string): boolean {
        return password.length >= 6;
    }
    static getUserDisplayInfo(user: UserCredentials): string {
        return `${user.username} (${user.role})`;
    }
}