import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase.client';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    readonly session = signal<Session | null>(null);
    readonly initialized = this.loadInitialSession();
    constructor() {
        this.listenAuthChanges();
    }

    private async loadInitialSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error obteniendo sesión:', error);
            return;
        }
        this.session.set(data.session);
    }

    signUp(email: string, password: string) {
        return supabase.auth.signUp({
            email,
            password
        });
    }

    private listenAuthChanges() {
        supabase.auth.onAuthStateChange((_event, session) => {
            this.session.set(session);
        });
    }

    loginWithGithub() {
        return supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/home`
            }
        });
    }

    logout() {
        return supabase.auth.signOut();
    }
}