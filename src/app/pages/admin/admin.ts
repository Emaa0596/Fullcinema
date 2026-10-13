import { Component, inject } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import { MovieService } from '../../services/movie.service';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {

  private readonly fb = inject(FormBuilder);
  private readonly movieService = inject(MovieService);

  readonly movieForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    imagen: ['', Validators.required],
    duracion: [0, [Validators.required, Validators.min(1)]],
    sinopsis: ['', Validators.required],
    generos: ['', Validators.required],
    edadMinima: [0, [Validators.required, Validators.min(0)]]
  });

  capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();}

  async createMovie() {
    if (this.movieForm.invalid) {
      this.movieForm.markAllAsTouched();
      return;
    }

    const values = this.movieForm.getRawValue();

    const { error } = await this.movieService.createMovie({
      nombre: values.nombre,
      imagen: values.imagen,
      duracion: values.duracion,
      sinopsis: values.sinopsis,

      generos: values.generos
        .split(',')
        .map(genero => genero.trim())
        .filter(genero => genero)
        .map(genero => this.capitalize(genero)),

      edad_minima: values.edadMinima
    });

    if (error) {
      console.error('Error creando película:', error);
      return;
    }

    this.movieForm.reset({
      nombre: '',
      imagen: '',
      duracion: 0,
      sinopsis: '',
      generos: '',
      edadMinima: 0
    });
  }
}