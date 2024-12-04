import {DefaultValues, NonUndefined} from 'react-hook-form';

export type TUseEntityDrawerState<T> = {
  open: boolean;
  drawerAction: 'CREATE' | 'UPDATE' | undefined;
  defaultValues: DefaultValues<T> | undefined;
};

export type TUseEntityDrawerAction<T> =
  | (
      | {
          type: 'OPEN';
          drawerAction: 'CREATE';
          payload?: TUseEntityDrawerState<T>['defaultValues'];
        }
      | {
          type: 'OPEN';
          drawerAction: 'UPDATE';
          payload: NonUndefined<TUseEntityDrawerState<T>['defaultValues']>;
        }
    )
  // | {type: 'RESET_PAYLOAD'}
  | {type: 'CLOSE'};

export function UseEntityDrawerDefaultState<T>(): TUseEntityDrawerState<T> {
  return {open: false, drawerAction: undefined, defaultValues: undefined};
}

export function useEntityDrawer<T>(
  state: TUseEntityDrawerState<T>,
  action: TUseEntityDrawerAction<T>,
): TUseEntityDrawerState<T> {
  switch (action.type) {
    case 'OPEN':
      return {...state, open: true, drawerAction: action.drawerAction, defaultValues: action.payload || undefined};

    // case 'RESET_PAYLOAD':
    //   return {...state, defaultValues: undefined};

    case 'CLOSE':
      return {...state, open: false, drawerAction: undefined, defaultValues: undefined};

    default:
      throw new Error('Trying to execute unknown action');
  }
}
