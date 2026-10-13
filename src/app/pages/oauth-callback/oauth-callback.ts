import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-oauth-callback',
  imports: [],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.css'
})
export class OauthCallback {

  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  constructor() {
    this.checkProfile();
  }

  private async checkProfile() {

    await this.auth.initialized;

    const session = this.auth.session();

    if (!session) {
      await this.router.navigate(['/login']);
      return;
    }

    const { data, error } =
      await this.profileService.getProfile(
        session.user.id
      );

    if (error) {
      console.error('Error buscando perfil:', error);
      return;
    }

    if (data) {
      await this.router.navigate(['/home']);
      return;
    }

    await this.router.navigate(['/complete-profile']);
  }
}