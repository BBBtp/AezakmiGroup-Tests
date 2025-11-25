"use strict";
// Скопируйте этот файл в users.ts и заполните реальными данными
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByRole = exports.getUser = exports.getAdminUser = exports.invalidUsers = exports.testUsers = void 0;
exports.testUsers = {
    admin: {
        username: 'test_admin',
        email: 'YOUR_ADMIN_EMAIL@example.com',
        password: 'YOUR_ADMIN_PASSWORD',
        role: 'admin',
        permissions: ['all']
    },
    user: {
        username: 'test_user',
        email: 'YOUR_USER_EMAIL@example.com',
        password: 'YOUR_USER_PASSWORD',
        role: 'user',
        permissions: ['read', 'write_own']
    }
};
exports.invalidUsers = {
    wrongEmail: {
        email: 'nonexistent@test.com',
        password: 'anypassword123'
    },
    wrongPassword: {
        email: 'YOUR_ADMIN_EMAIL@example.com',
        password: 'wrongpassword123'
    },
    emptyCredentials: {
        email: '',
        password: ''
    },
    invalidEmailFormat: {
        email: 'invalid-email',
        password: 'password123'
    },
    shortPassword: {
        email: 'test@test.com',
        password: '123'
    }
};
const getAdminUser = () => exports.testUsers.admin;
exports.getAdminUser = getAdminUser;
const getUser = () => exports.testUsers.user;
exports.getUser = getUser;
const getUserByRole = (role) => exports.testUsers[role];
exports.getUserByRole = getUserByRole;
