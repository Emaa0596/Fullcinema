import { Component, inject, signal, computed } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ProfileData} from '../../models/profile.model';
import { ProfileStore } from '../../services/profile.store.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {

  private readonly auth = inject(AuthService);
  readonly profileStore = inject(ProfileStore);


  readonly email = computed(() =>
    this.auth.session()?.user.email ?? '');

  constructor() {
    this.profileStore.loadProfile();
  }

  
}