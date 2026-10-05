import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule,Validators} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  private readonly fb = inject(FormBuilder);

  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    nacimiento: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],

    tipoDeSangre: [''],
    colorDeOjos: [''],
    vacaciones: [0, Validators.min(0)]
  });

  async onSubmit() {
  console.log('1 - ENTRÓ AL SUBMIT');

  if (this.form.invalid) {
    console.log('FORM INVALIDO');
    return;
  }

  const values = this.form.getRawValue();

  console.log('2 - DATOS DEL FORM:', values);
  console.log('3 - ANTES DE SIGNUP');

  const { data, error } = await this.auth.signUp(
    values.email,
    values.password
  );

  console.log('4 - DESPUÉS DE SIGNUP');
  console.log('DATA:', data);
  console.log('ERROR:', error);

  if (error) {
    console.error('Error registrando usuario:', error);
    return;
  }

  console.log('Usuario creado:', data.user);
  console.log('Sesión:', data.session);
}

}