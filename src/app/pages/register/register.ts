import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule,Validators} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { RegisteredUser } from '../../models/user.model';
import { Role } from '../../models/role.model';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    nacimiento: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],

    tipoDeSangre: [''],
    colorDeOjos: [''],
    vacaciones: [0, Validators.min(0)]
  });

  async onSubmit() {

  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const values = this.form.getRawValue();
  const { data, error } = await this.auth.signUp(
    values.email,
    values.password
  );

  if (error || !data.user) {
    return;
  }

  const user = new RegisteredUser(
    values.nombre,
    values.apellido,
    new Date(values.nacimiento),
    values.email,
    values.password,
    Role.RegisteredClient,
    values.tipoDeSangre || undefined,
    values.colorDeOjos || undefined,
    values.vacaciones
  );

  const { error: profileError } =
    await this.profileService.createProfile(
      data.user.id,
      user
    );

  if (profileError) {
    console.error('Error creando perfil:', profileError);
    return;
  }

  await this.router.navigate(['/home']);
}

}