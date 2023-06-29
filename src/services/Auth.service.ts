import { SupabaseClient } from '@/supabase';
import type { SignInProps, SignUpProps } from '@/type/authentification.type';

export class AuthService {
    static async signIn({ email, password }: SignInProps) {
        return SupabaseClient().auth.signInWithPassword({
            email,
            password,
        });
    }

    static async signUp({ email, password, metadata }: SignUpProps) {
        return SupabaseClient().auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
    }
}
