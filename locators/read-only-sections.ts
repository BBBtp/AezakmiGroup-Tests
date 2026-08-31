export type ReadOnlySectionControl = {
  role: 'button' | 'link' | 'tab';
  name: string | RegExp;
};

export const readOnlySectionLocators = {
  pageRole: 'main',
  technicalValue: /\b(?:error-content|undefined|NaN|null)\b|\[object Object\]/i,
  sections: {
    abTests: {
      label: 'A/B tests',
      href: '/ab-tests',
      groupLabel: 'Product',
      controls: [
        { role: 'link', name: 'Create test' },
        { role: 'button', name: /^Filters:/ },
        { role: 'button', name: /^Team:/ },
        { role: 'button', name: 'App' },
        { role: 'button', name: 'Test type' },
      ],
    },
    employees: {
      label: 'Employees',
      href: '/employees',
      groupLabel: 'Staff',
      controls: [
        { role: 'button', name: 'Archive' },
        { role: 'button', name: 'Settings' },
        { role: 'button', name: 'Create employee' },
        { role: 'button', name: 'Filters' },
      ],
      collection: { role: 'link', name: 'More' },
    },
    vacationSchedule: {
      label: 'Vacation schedule',
      href: '/schedule',
      groupLabel: 'Staff',
      controls: [
        { role: 'button', name: 'Plan a vacation' },
        { role: 'tab', name: 'My team' },
        { role: 'tab', name: 'Custom list' },
        { role: 'tab', name: 'January' },
        { role: 'tab', name: 'December' },
      ],
    },
    users: {
      label: 'Users',
      href: '/users',
      groupLabel: 'Settings',
      controls: [
        { role: 'button', name: 'Create new user' },
        { role: 'button', name: 'Filters' },
      ],
      collection: { role: 'button', name: 'Edit' },
    },
    taskGenerator: {
      label: 'Task generator',
      href: '/task-generator',
      controls: [
        { role: 'button', name: 'Settings' },
        { role: 'button', name: 'Generate' },
        { role: 'button', name: 'Date' },
      ],
    },
  },
} as const;

export type ReadOnlySection = keyof typeof readOnlySectionLocators.sections;
