import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {DateRangeState} from '@/components/Form/DateRangePicker';

export type Filters<C = TCategoryVH, P = TPaymentMethodVH> = {
  hasActiveFilters: boolean;
  keywords: string | null;
  dateRange: DateRangeState;
  executeFrom: string;
  executeTo: string;
  categories: C[];
  paymentMethods: P[];
};

export type FilterState<C = TCategoryVH, P = TPaymentMethodVH> = Filters<C, P>;

export function getInitialFilterState(): FilterState {
  return {
    hasActiveFilters: false,
    keywords: null,
    dateRange: {startDate: null, endDate: null},
    executeFrom: '',
    executeTo: '',
    categories: [],
    paymentMethods: [],
  };
}

export type FilterAction =
  | {action: 'SET_KEYWORDS'; keywords: string}
  | {action: 'SET_DATE_RANGE'; startDate: Date | null; endDate: Date | null}
  | {action: 'SET_START_DATE'; startDate: Date | null}
  | {action: 'SET_END_DATE'; endDate: Date | null}
  | {action: 'SET_EXECUTE_FROM'; executeFrom: string}
  | {action: 'SET_EXECUTE_TO'; executeTo: string}
  | {action: 'SET_CATEGORIES'; categories: TCategoryVH[]}
  | {action: 'SET_PAYMENT_METHODS'; paymentMethods: TPaymentMethodVH[]}
  | {action: 'RESET_ALL'};

export function FilterReducer(state: FilterState, action: FilterAction): FilterState {
  let updatedState: FilterState;
  switch (action.action) {
    case 'SET_KEYWORDS':
      updatedState = {...state, keywords: action.keywords};
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'SET_DATE_RANGE':
      updatedState = {
        ...state,
        dateRange: {startDate: action.startDate, endDate: action.endDate},
      };
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'SET_START_DATE':
      updatedState = {
        ...state,
        dateRange: {startDate: action.startDate, endDate: state.dateRange.endDate ?? null},
      };
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'SET_END_DATE':
      updatedState = {
        ...state,
        dateRange: {startDate: state.dateRange.startDate ?? null, endDate: action.endDate},
      };
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'SET_EXECUTE_FROM':
      updatedState = {...state, executeFrom: action.executeFrom};
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'SET_EXECUTE_TO':
      updatedState = {...state, executeTo: action.executeTo};
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'SET_CATEGORIES':
      updatedState = {...state, categories: action.categories};
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'SET_PAYMENT_METHODS':
      updatedState = {...state, paymentMethods: action.paymentMethods};
      return {...updatedState, hasActiveFilters: determineHasActiveFilters(updatedState)};
    case 'RESET_ALL':
      return getInitialFilterState();
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

function determineHasActiveFilters(state: FilterState): boolean {
  return !!(
    state.keywords ||
    state.dateRange.startDate ||
    state.dateRange.endDate ||
    state.executeFrom ||
    state.executeTo ||
    state.categories.length > 0 ||
    state.paymentMethods.length > 0
  );
}
