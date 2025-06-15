import {type Session, type User} from 'better-auth';
import React from 'react';

import {logger} from '@/logger';
import {pb} from '@/pocketbase.ts';
import {authClient} from '@/services/Auth/authClient';

export interface IAuthContext {
  loading: boolean;
  session: {session: Session | null; user: User | null} | null;
  fileToken: string | null;
  setSession: React.Dispatch<React.SetStateAction<this['session']>>;
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

const authLogger = logger.child({label: 'AuthContext'});

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [loading, setLoading] = React.useState(true);
  const [fileToken, _setFileToken] = React.useState<IAuthContext['fileToken']>(null);
  const [session, setSession] = React.useState<IAuthContext['session']>(null);

  const authOptions: IAuthContext['authOptions'] = React.useMemo(() => {
    return null;
  }, [session]);

  const retrieveCurrentSession = async () => {
    setLoading(true);
    try {
      const {data, error} = await authClient.getSession();
      if (error) {
        authLogger.error('Error retrieving current session', error);
        return;
      }
      setSession(data);
      authLogger.debug('Current session retrieved successfully', data);
    } catch (e) {
      authLogger.error('message' in (e as any) ? ((e as any).message as string) : "Something wen't wrong", e);
      setSession(null);
    }

    setLoading(false);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  React.useLayoutEffect(() => {
    retrieveCurrentSession();
  }, []);

  return (
    <AuthContext.Provider value={{loading, session, fileToken, setSession, authOptions, logout}} children={children} />
  );
};
