/**
 * Получает значение переменной окружения
 * @param envKey Ключ переменной окружения
 * @throws Если переменная не определена
 */
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

/** Интерфейс данных пользователя для тестов */
export interface UserCredentials {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    permissions: string[];
}

/** Функция, создающая объект с тестовыми пользователями из env */
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

/** Прокси для динамического получения тестовых пользователей */
export const testUsers = new Proxy({} as Record<string, UserCredentials>, {
    get(target, prop: string) {
        return getTestUsers()[prop];
    }
});

/** Некорректные данные пользователей для негативных тестов */
export const invalidUsers = {
    wrongEmail: {
        email: 'nonexistent@test.com',
        password: 'anypassword123'
    },
    wrongPassword: {
        email: '', // будет динамически подставляться админский email
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

/** Динамически подставляем админский email для теста с неправильным паролем */
Object.defineProperty(invalidUsers.wrongPassword, 'email', {
    get() {
        return getEnv('E2E_ADMIN_EMAIL');
    }
});

/** Получение admin пользователя */
export const getAdminUser = (): UserCredentials => testUsers.admin;

/** Получение обычного пользователя */
export const getUser = (): UserCredentials => testUsers.user;

/** Получение пользователя по роли */
export const getUserByRole = (role: 'admin' | 'user'): UserCredentials => testUsers[role];
