import {
  EMail,
  type TExternalAuthProvider,
  type TSignInMethod,
  type TSignInWithEmailPayload,
  type TSignInWithSocialPayload,
  type TSignUpMethod,
  type TSignUpWithEmailPayload,
  type TSignUpWithEmailResponse,
  type TSignUpWithSocialPayload,
  type TSignUpWithSocialResponse,
  ZSignUpWithEmailResponse,
} from './types';

export class AuthService {
  private static host: string | undefined = process.env.AUTH_SERVICE_HOST;

  static isEmail(email: string): email is EMail {
    return typeof email === 'string' && email.includes('@');
  }

  static isValidAuthProvider(provider: string): provider is TExternalAuthProvider {
    return ['google', 'github'].some(p => p === provider);
  }

  private static isHostSet(host: string | undefined): asserts host is string {
    if (!host) {
      throw new Error('Auth service host is not set. Please set AUTH_SERVICE_HOST environment variable.');
    }
  }

  static async signUp<method extends TSignUpMethod>(
    signUpMethod: method,
    payload: method extends 'email' ? TSignUpWithEmailPayload : TSignUpWithSocialPayload,
  ): Promise<method extends 'email' ? TSignUpWithEmailResponse : TSignUpWithSocialResponse> {
    this.isHostSet(this.host);

    switch (signUpMethod) {
      case 'email':
        const response = await fetch(`${this.host}/api/auth/sign-up/${signUpMethod}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
        const responseStatus = response.status;
        if (responseStatus < 200 || responseStatus >= 300) {
          const errorText = await response.text();
          throw new Error(`Failed to sign up: ${responseStatus} - ${errorText}`);
        }
        const json = await response.json();
        const parsedResponse = ZSignUpWithEmailResponse.safeParse(json);
        if (!parsedResponse.success) {
          throw new Error(`Invalid response format for email sign up: ${parsedResponse.error.message}`);
        }
        return parsedResponse.data;
      case 'social':
        return this.signIn('social', payload as TSignInWithSocialPayload);
      default:
        throw new Error(`Unsupported sign up method: ${signUpMethod}`);
    }
  }

  static async signIn<method extends TSignInMethod>(
    signInMethod: method,
    payload: method extends 'email' ? TSignInWithEmailPayload : TSignInWithSocialPayload,
  ) {
    this.isHostSet(this.host);

    const response = await fetch(`${this.host}/api/auth/sign-in/${signInMethod}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    const responseStatus = response.status;
    if (responseStatus < 200 || responseStatus >= 300) {
      const errorText = await response.text();
      throw new Error(`Failed to login: ${responseStatus} - ${errorText}`);
    }
    const json = await response.json();

    return json;
  }
}
