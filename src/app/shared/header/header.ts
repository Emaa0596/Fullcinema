import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileStore } from '../../services/profile.store.service';
import { Role } from '../../models/role.model';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {

  readonly auth = inject(AuthService);
  readonly profileStore = inject(ProfileStore);
  readonly Role = Role;

  constructor() {
    this.profileStore.loadProfile();
  }

  readonly isAdmin = computed(() => this.profileStore.profile()?.rol === 'admin');
}