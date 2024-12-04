import {type TUser, ZUser} from '@budgetbuddyde/types';
import React from 'react';

import {pb} from '@/pocketbase.ts';

export interface IAuthContext {
  loading: boolean;
  sessionUser: TUser | null;
  fileToken: string | null;
  setSession: React.Dispatch<React.SetStateAction<IAuthContext['sessionUser']>>;
  /**
   * @deprecated Due to the switch to Pocketbase as an backend, there is no need to store the uuid and password in the context anymore.
   */
  authOptions: null;
  logout: () => void;
}

export const AuthContext = React.createContext({} as IAuthContext);

export function useAuthContext() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}

export type AuthProviderProps = React.PropsWithChildren;

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [loading, setLoading] = React.useState(true);
  const [fileToken, setFileToken] = React.useState<IAuthContext['fileToken']>(null);
  const [sessionUser, setSessionUser] = React.useState<IAuthContext['sessionUser']>(null);

  const authOptions: IAuthContext['authOptions'] = React.useMemo(() => {
    return null;
  }, [sessionUser]);

  const retrieveFileToken = async () => {
    try {
      const token = await pb.files.getToken();
      setFileToken(token);
    } catch (e) {
      console.error(e);
    }
  };

  const retrieveCurrentSession = () => {
    setLoading(true);
    try {
      const model = pb.authStore.isValid && pb.authStore.isAuthRecord ? pb.authStore.model : null;
      if (process.env.NODE_ENV === 'development')
        console.log('Retrieved current session', pb.authStore.token, pb.authStore.model);
      const parsingResult = ZUser.safeParse(model);

      if (!parsingResult.success) {
        console.error(parsingResult.error);
        return;
      }

      setSessionUser(parsingResult.data);
    } catch (e) {
      console.error(e);
      setSessionUser(null);
    }

    setLoading(false);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  React.useLayoutEffect(() => {
    retrieveCurrentSession();
    retrieveFileToken();
    const authStoreListener = pb.authStore.onChange((_token, model) => {
      const parsingResult = ZUser.safeParse(model);
      if (!parsingResult.success) {
        console.error(parsingResult.error);
        return;
      }
      setSessionUser(parsingResult.data);
    });

    return () => {
      authStoreListener();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{loading, sessionUser, fileToken, setSession: setSessionUser, authOptions, logout}}
      children={children}
    />
  );
};
