import { composeTestId, requireTestId } from '@utils/test-id';

export type KpiSettingsTableName = 'score' | 'ab-tests' | 'total-mrr';
export type EditableKpiSettingsTableName = Exclude<KpiSettingsTableName, 'score'>;

function tableName(value: string): string {
  return requireTestId(value, 'KPI settings table');
}

function rowBase(table: string, actionType: string, value: string): string {
  return requireTestId(composeTestId([table, actionType, value]), 'KPI settings action row');
}

export const kpiSettingsTestIds = {
  page: 'kpi-settings',
  loading: 'kpi-settings-loading',
  breadcrumbs: 'bread-crumbs',
  deleteConfirm: 'delete-item__del-btn',
  deleteCancel: 'delete-item__cancel-btn',
  deleteLoader: 'delete-item__loader',
  table: (value: string) => {
    const table = tableName(value);

    return {
      root: table,
      table: `${table}__table`,
      headerRow: `${table}__table-header-row`,
      actionTypeHeader: `${table}__action-type-header`,
      valueHeader: `${table}__value-header`,
      pointsHeader: `${table}__points-header`,
      pointsLabel: `${table}__points-label`,
      body: `${table}__table-body`,
      footer: `${table}__table-bar`,
      addValue: `${table}__add-value`,
      editButtonPattern: (prefix: string) => `[data-testid^="${prefix}"][data-testid$="__edit"]`,
    };
  },
  addModal: (value: string) => {
    const table = tableName(value);

    return {
      trigger: `${table}__add-value`,
      root: `${table}__add-modal`,
      actionTypeStep: `${table}-Action type`,
      valueStep: `${table}-Value`,
      pointsStep: `${table}-Points`,
      backButton: `${table}__button-prev`,
      nextButton: `${table}__button-next`,
      loading: `${table}__loading`,
      error: `${table}__error`,
    };
  },
  addForm: (value: string) => ({
    root: `${tableName(value)}__add-form`,
    actionTypeSelect: 'action-type-select',
    actionTypeTrigger: 'action-type-select-trigger',
    actionTypeContent: 'action-type-select-content',
    actionTypeTriggerValue: 'action-type-select-trigger-value',
    actionTypeOption: (option: string) => `action-type-select_option-${option}`,
    valueBlock: 'value-block',
    valueTypeSelect: 'value-type-select',
    valueTypeTrigger: 'value-type-select-trigger',
    valueTypeContent: 'value-type-select-content',
    valueTypeTriggerValue: 'value-type-select-trigger-value',
    valueTypeOption: (option: string) => `value-type-select_option-${option}`,
    valueInput: 'value-input',
    pointsBlock: 'points-block',
    pointsRadio: 'points-radio',
    pointsRadioPlus: 'points-radio__plus',
    pointsRadioMinus: 'points-radio__minus',
    pointsInput: 'points-input',
  }),
  row: (table: string, actionType: string, value: string) => {
    const base = rowBase(table, actionType, value);
    const withSuffix = (suffix: string) => `${base}${suffix}`;

    return {
      base,
      root: base,
      editButton: withSuffix('__edit'),
      deleteButton: withSuffix('__delete'),
      actionButtons: withSuffix('__action-buttons'),
      toast: withSuffix('__alert'),
      toastTitle: withSuffix('__alert-title'),
      toastSubtitle: withSuffix('__alert-subtitle'),
      editModal: withSuffix('__edit-modal'),
      editForm: withSuffix('__edit-form'),
      deleteModal: withSuffix('__delete-modal'),
      actionType: withSuffix('__actionType'),
      valueType: withSuffix('__valueType'),
      pointsRadio: withSuffix('__points-radio'),
      pointsRadioPlus: withSuffix('__points-radio__plus'),
      pointsRadioMinus: withSuffix('__points-radio__minus'),
      pointsInput: withSuffix('__points-input'),
      pointsInputSign: withSuffix('__points-input-sign'),
      saveButton: withSuffix('__save'),
      error: withSuffix('__error'),
    };
  },
  score: {
    sufficientEditButton: 'score__Sufficient score__edit',
    minimalEditButton: 'score__Minimal score__edit',
  },
} as const;
