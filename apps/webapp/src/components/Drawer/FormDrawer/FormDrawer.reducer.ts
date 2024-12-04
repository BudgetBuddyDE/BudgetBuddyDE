/**
 * @deprecated
 */
export type TFormDrawerState = {
  loading: boolean;
  success: boolean;
  error: string | Error | null;
};

/**
 * @deprecated
 */
export type TFormDrawerAction =
  | {type: 'RESET'}
  | {type: 'SUBMIT'}
  | {type: 'SUCCESS'; error?: TFormDrawerState['error']}
  | {type: 'ERROR'; error: TFormDrawerState['error']};

/**
 * @deprecated
 */
export function generateInitialFormDrawerState(): TFormDrawerState {
  return {
    loading: false,
    success: false,
    error: null,
  };
}

/**
 * @deprecated
 */
export function FormDrawerReducer(state: TFormDrawerState, action: TFormDrawerAction): TFormDrawerState {
  switch (action.type) {
    case 'RESET':
      return generateInitialFormDrawerState();

    case 'SUBMIT':
      return {...state, loading: true};

    case 'SUCCESS':
      return {...state, loading: false, success: true, error: action.error ?? null};

    case 'ERROR':
      return {...state, loading: false, success: false, error: action.error};

    default:
      throw new Error('Trying to execute unknown action');
  }
}
