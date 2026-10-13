import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { RegisteredUser } from '../../models/user.model';
import { Role } from '../../models/role.model';

@Component({
  selector: 'app-complete-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './complete-profile.html',
  styleUrl: './complete-profile.css'
})
export class CompleteProfile {

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    nacimiento: ['', Validators.required],
    tipoDeSangre: [''],
    colorDeOjos: [''],
    vacaciones: [0, Validators.min(0)]
  });

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const session = this.auth.session();

    if (!session) {
      return;
    }

    const values = this.form.getRawValue();

    const user = new RegisteredUser(
      values.nombre,
      values.apellido,
      new Date(values.nacimiento),
      session.user.email ?? '',
      '',
      Role.RegisteredClient,
      values.tipoDeSangre || undefined,
      values.colorDeOjos || undefined,
      values.vacaciones
    );

    const { error } = await this.profileService.createProfile(
      session.user.id,
      user
    );

    if (error) {
      console.error('Error creando perfil:', error);
      return;
    }

    await this.router.navigate(['/home']);
  }
}