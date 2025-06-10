import cds from '@sap/cds';

export const config = {
  getLogger: (
    name: string = 'bb',
    options: Parameters<typeof cds.log>[1] = {
      label: 'BudgetBuddy',
    }
  ) => cds.log(name, options),
};
