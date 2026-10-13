import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  readonly errorMessage = signal('');

  loginWithGithub() {
    return this.auth.loginWithGithub();
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');

    const values = this.form.getRawValue();

    const { error } = await this.auth.signIn(
      values.email,
      values.password
    );

    if (error) {
      this.errorMessage.set ('Email o contraseña incorrectos.');
      return;
    }

    await this.router.navigate(['/home']);
  }
}
