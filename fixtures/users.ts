const getEnv = (envKey: string): string => {
    const value = process.env[envKey];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${envKey}. ` +
            `Please create .env file based on .env.example`
        );
    }
    return value;
};

export interface UserCredentials {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    permissions: string[];
}

const getTestUsers = (): Record<string, UserCredentials> => ({
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
});

export const testUsers = new Proxy({} as Record<string, UserCredentials>, {
    get(target, prop: string) {
        return getTestUsers()[prop];
    }
});

export const invalidUsers = {
    wrongEmail: {
        email: 'nonexistent@test.com',
        password: 'anypassword123'
    },
    wrongPassword: {
        email: '',
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

Object.defineProperty(invalidUsers.wrongPassword, 'email', {
    get() {
        return getEnv('E2E_ADMIN_EMAIL');
    }
});

export const getAdminUser = (): UserCredentials => testUsers.admin;
export const getUser = (): UserCredentials => testUsers.user;
export const getUserByRole = (role: 'admin' | 'user'): UserCredentials => testUsers[role];
