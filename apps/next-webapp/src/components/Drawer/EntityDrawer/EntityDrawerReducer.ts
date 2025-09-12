export type EntityAction = 'CREATE' | 'EDIT';

export type EntityDrawerState<T> =
  | {
      isOpen: true;
      action: EntityAction;
      defaultValues: Partial<T> | null;
    }
  | {
      isOpen: false;
      action: null;
      defaultValues: null;
    };

export function getInitialEntityDrawerState<T>(): EntityDrawerState<T> {
  return {
    isOpen: false,
    action: null,
    defaultValues: null,
  };
}

export type EntityDrawerAction<A> =
  | { type: 'OPEN'; action: EntityAction; defaultValues?: Partial<A> }
  | { type: 'CLOSE' }
  | { type: 'RESET' };

export function entityDrawerReducer<T>(
  state: EntityDrawerState<T>,
  action: EntityDrawerAction<T>
): EntityDrawerState<T> {
  switch (action.type) {
    case 'OPEN':
      return { isOpen: true, action: action.action, defaultValues: action.defaultValues || null };
    case 'CLOSE':
      return { isOpen: false, action: null, defaultValues: null };
    case 'RESET':
      return { isOpen: false, action: null, defaultValues: null };
    default:
      return state;
  }
}
