import type {Session as AuthSession, User as AuthUser} from 'better-auth';

// export interface RequestUser {

// }

export interface RequestContext<User = AuthUser, Session = AuthSession> {
  /**
   * Correlation identifier generated per incoming request.
   */
  requestId: string;
  /**
   * Authenticated user context if available, otherwise null.
   */
  user: User | null;
  /**
   * Authenticated session context if available, otherwise null.
   */
  session: Session | null;
}
