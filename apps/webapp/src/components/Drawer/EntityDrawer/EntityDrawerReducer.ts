type DefaultActions = 'CREATE' | 'EDIT';

export type EntityAction<Actions = DefaultActions> = Actions;

export type EntityDrawerState<T, Actions = DefaultActions> =
  | {
      isOpen: true;
      action: EntityAction<Actions>;
      defaultValues: Partial<T> | null;
    }
  | {
      isOpen: false;
      action: null;
      defaultValues: null;
    };

export function getInitialEntityDrawerState<T, Actions = DefaultActions>(): EntityDrawerState<T, Actions> {
  return {
    isOpen: false,
    action: null,
    defaultValues: null,
  };
}

export type EntityDrawerAction<A, Actions = DefaultActions> =
  | {
      type: 'OPEN';
      action: EntityAction<Actions>;
      defaultValues?: Partial<A>;
    }
  | {type: 'CLOSE'}
  | {type: 'RESET'};

export function entityDrawerReducer<T, Actions = DefaultActions>(
  state: EntityDrawerState<T, Actions>,
  action: EntityDrawerAction<T, Actions>,
): EntityDrawerState<T, Actions> {
  switch (action.type) {
    case 'OPEN':
      return {
        isOpen: true,
        action: action.action,
        defaultValues: action.defaultValues ?? null,
      };

    case 'CLOSE':
    case 'RESET':
      return {
        isOpen: false,
        action: null,
        defaultValues: null,
      };

    default:
      return state;
  }
}
