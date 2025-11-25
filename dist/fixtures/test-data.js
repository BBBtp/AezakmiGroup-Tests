"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestData = void 0;
// fixtures/test-data.ts
const users_1 = require("./users");
exports.TestData = {
    users: users_1.testUsers,
    invalidUsers: users_1.invalidUsers,
    // URLы
    urls: {
        login: '/login',
        dashboard: '/dashboard',
        passwordRecovery: '/password-recovery'
    },
    // Тексты для проверки
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
            }
        },
        kpi: {
            basePage: {
                title: "Track the performance of your team's ASO managers",
                cardMrrTitle: "Total MRR",
                cardScoreTitle: "Average score",
                cardAppsTitle: "Number of apps",
                topEmpTitle: "Top employees"
            }
        }
    },
    // Временные параметры
    timeouts: {
        pageLoad: 30000,
        action: 10000,
        navigation: 15000
    }
};
exports.default = exports.TestData;
