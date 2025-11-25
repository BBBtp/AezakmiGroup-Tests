"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserHelpers = void 0;
class UserHelpers {
    static maskPassword(password) {
        return '*'.repeat(password.length);
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static validatePassword(password) {
        return password.length >= 6;
    }
    static getUserDisplayInfo(user) {
        return `${user.username} (${user.role})`;
    }
}
exports.UserHelpers = UserHelpers;
