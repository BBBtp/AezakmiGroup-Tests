export const authTestIds = {
  page: 'login',
  form: 'login__form',
  emailInput: 'login__email-input',
  passwordInput: 'login__password-input',
  passwordVisibilityButton: 'login__password-input__eye-btn',
  rememberMeCheckbox: 'login__remember-me-checkbox-checkbox',
  submitButton: 'login__submit-button',
  forgotPasswordButton: 'login__forgot-password-button',
} as const;

export const authSelectors = {
  errorMessage: '.error-message, [role="alert"]',
  successMessage: '.success-message, .notification-success',
} as const;
