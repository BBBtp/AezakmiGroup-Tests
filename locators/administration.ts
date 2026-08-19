export const administrationLocators = {
  technicalValue: /\b(?:error-content|undefined|NaN|null)\b|\[object Object\]/i,
  parameters: {
    title: 'Parameters',
    description: 'Here you can manage parameters',
    edit: 'Edit',
    delete: 'Delete',
    add: /Add value/i,
    parameterGroups: ['Team', 'Developer', 'Designer', 'ASO manager'] as const,
  },
  employees: {
    title: 'Employees',
    more: 'More',
    archive: 'Archive',
    settings: 'Settings',
    create: 'Create employee',
    filters: 'Filters',
  },
} as const;
