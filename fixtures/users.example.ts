export interface UserCredentials {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    permissions: string[];
}

export const testUsers: Record<string, UserCredentials> = {
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

export const invalidUsers = {
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

export const getAdminUser = (): UserCredentials => testUsers.admin;
export const getUser = (): UserCredentials => testUsers.user;
export const getUserByRole = (role: 'admin' | 'user'): UserCredentials => testUsers[role];

