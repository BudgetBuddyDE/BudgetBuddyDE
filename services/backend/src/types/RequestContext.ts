import type {Session as AuthSession, User as AuthUser} from 'better-auth';

export type AuthenticationMethod = 'session-cookie' | 'api-key';

export interface RequestContext<User = AuthUser, Session = AuthSession> {
  /**
   * Authenticated user context if available, otherwise null.
   */
  user: User | null;
  /**
   * Authenticated session context if available, otherwise null.
   */
  session: Session | null;
  /**
   * Credential used to authenticate the request.
   */
  authenticationMethod: AuthenticationMethod;
}
