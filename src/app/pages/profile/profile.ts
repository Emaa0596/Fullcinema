import { Component, inject, signal, computed } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ProfileData} from '../../models/profile.model';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {

  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly profile = signal<ProfileData | null>(null);

  readonly email = computed(() =>
    this.auth.session()?.user.email ?? '');

  constructor() {
    this.loadProfile();
  }

  private async loadProfile() {
    await this.auth.initialized;

    const session = this.auth.session();

    if (!session) {
      return;
    }

    const { data, error } =
      await this.profileService.getProfile(
        session.user.id
      );

    if (error) {
      console.error('Error cargando perfil:', error);
      return;
    }

    this.profile.set(data);
  }
}