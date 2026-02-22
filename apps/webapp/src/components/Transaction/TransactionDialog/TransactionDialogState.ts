import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';

export type TransactionDialogState = {
  isOpen: boolean;
  isLoading: boolean;
  transactions: TExpandedTransaction[];
  error: Error | null;
};

export function generateDefaultState(): TransactionDialogState {
  return {
    isOpen: false,
    isLoading: false,
    transactions: [],
    error: null,
  };
}

export type StateAction =
  | {action: 'OPEN_AND_FETCH_DATA'}
  | {action: 'FETCH_DATA'}
  | {action: 'FETCH_SUCCESS'; transactions: TExpandedTransaction[]}
  | {action: 'FETCH_ERROR'; error: Error}
  | {action: 'CLOSE'}
  | {action: 'CLEAR'};

export function reducer(state: TransactionDialogState, action: StateAction): TransactionDialogState {
  switch (action.action) {
    case 'OPEN_AND_FETCH_DATA':
      return {
        ...state,
        isOpen: true,
        isLoading: true,
        error: null,
      };
    case 'FETCH_DATA':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        transactions: action.transactions,
        error: null,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    case 'CLOSE':
      return {
        ...state,
        isOpen: false,
      };
    case 'CLEAR':
      return generateDefaultState();
    default:
      return state;
  }
}
