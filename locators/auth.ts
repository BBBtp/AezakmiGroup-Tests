export const authTestIds = {
  page: 'login',
  form: 'login__form',
  emailInput: 'login__email-input',
  passwordInput: 'login__password-input',
  passwordVisibilityButton: 'login__password-input__eye-btn',
  rememberMeCheckbox: 'login__remember-me-checkbox-checkbox',
  submitButton: 'login__submit-button',
  forgotPasswordButton: 'login__forgot-password-button',
  title: 'login__title',
  subtitle: 'login__subtitle',
  forgotPasswordModal: 'login__forgot-password-modal',
  telegramButton: 'login__telegram-button',
  forgotPasswordCloseButton: 'login__forgot-password-modal__close',
} as const;

export const authSelectors = {
  errorMessage: '.error-message, [role="alert"]',
  successMessage: '.success-message, .notification-success',
} as const;

export const authText = {
  title: 'Log in to your account',
  subtitle: 'Welcome back! Please enter your credentials to get started',
} as const;
