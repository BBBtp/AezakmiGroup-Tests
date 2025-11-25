"use strict";
// Тестовые данные загружаются из переменных окружения (.env файл)
// Создайте .env файл на основе .env.example
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByRole = exports.getUser = exports.getAdminUser = exports.invalidUsers = exports.testUsers = void 0;
const getEnv = (envKey) => {
    const value = process.env[envKey];
    if (!value) {
        throw new Error(`Missing required environment variable: ${envKey}. ` +
            `Please create .env file based on .env.example`);
    }
    return value;
};
exports.testUsers = {
    admin: {
        username: getEnv('E2E_ADMIN_USERNAME'),
        email: getEnv('E2E_ADMIN_EMAIL'),
        password: getEnv('E2E_ADMIN_PASSWORD'),
        role: 'admin',
        permissions: ['all']
    },
    user: {
        username: getEnv('E2E_USER_USERNAME'),
        email: getEnv('E2E_USER_EMAIL'),
        password: getEnv('E2E_USER_PASSWORD'),
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
        email: getEnv('E2E_ADMIN_EMAIL'),
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
