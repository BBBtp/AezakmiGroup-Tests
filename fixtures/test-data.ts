import { testUsers, invalidUsers } from './users';

/**
 * Константы и тестовые данные для автотестов
 */
export const TestData = {
  /** Корректные пользователи для тестов */
  users: testUsers,

  /** Некорректные пользователи для негативных тестов */
  invalidUsers: invalidUsers,

  /** Пути страниц приложения */
  urls: {
    login: '/login',
    dashboard: '/dashboard',
    passwordRecovery: '/password-recovery',
  },

  /** Текстовые данные для проверок UI */
  texts: {
    login: {
      title: 'Log in to your account',
      subtitle: 'Welcome back! Please enter your credentials to get started',
      successMessage: 'Welcome back!',
      errorMessages: {
        invalidCredentials: 'Incorrect email or password.Check if the data entered is correct and try again',
      },
      errorLabels: {
        invalidEmail: 'Incorrect login. Try again',
        invalidPassword: 'Must be 8 or more characters long',
      },
    },
    kpi: {
      basePage: {
        title: "Track the performance of your team's ASO managers",
        cardMrrTitle: 'Total MRR',
        cardScoreTitle: 'Average score',
        cardAppsTitle: 'Number of apps',
        topEmpTitle: 'Top employees',
      },
    },
  },

  /** Таймауты для тестов в миллисекундах */
  timeouts: {
    pageLoad: 30000,
    action: 10000,
    navigation: 15000,
  },
};

export default TestData;
