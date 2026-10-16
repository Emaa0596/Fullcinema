import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import { ProfileData } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileStore {
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  readonly profile = signal<ProfileData | null>(null);
  readonly loading = signal(false);
  async loadProfile() {
    await this.auth.initialized;
    const session = this.auth.session();

    if (!session) {
      this.profile.set(null);
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.profileService.getProfile(session.user.id);
    this.loading.set(false);

    if (error) {
      console.error('Error cargando perfil:', error);
      this.profile.set(null);
      return;
    }

    this.profile.set(data);
  }

  clearProfile() {
    this.profile.set(null);
  }
}