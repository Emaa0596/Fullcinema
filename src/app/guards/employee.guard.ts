import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { Role } from '../models/role.model';
import { ProfileStore } from '../services/profile.store.service';

export const employeeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const profileStore = inject(ProfileStore);
  const router = inject(Router);

  await auth.initialized;

  const session = auth.session();

  if (!session) {
    return router.parseUrl('/login');
  }

  await profileStore.loadProfile();

  const profile = profileStore.profile();

  if (!profile) {
    return router.parseUrl('/home');
  }

  return profile.rol === Role.Employee ||
         profile.rol === Role.Admin
    ? true
    : router.parseUrl('/home');
};