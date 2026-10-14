import { Component, inject, signal } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import { MovieService } from '../../services/movie.service';
import { Movie } from '../../models/movie.model';
import { ShowtimeService } from '../../services/showtime.service';

@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  constructor() {
    this.loadMovies();
    this.loadShowtimes();
  }

  private readonly fb = inject(FormBuilder);
  private readonly movieService = inject(MovieService);
  private readonly showtimeService = inject(ShowtimeService);
  readonly movies = signal<Movie[]>([]);

  // null = estamos creando
  // number = estamos editando esa película
  readonly editingMovieId = signal<number | null>(null);
  readonly showtimes = signal<any[]>([]);
  readonly showtimeMessage = signal('');
  readonly showtimeError = signal('');

  readonly movieForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    imagen: ['', Validators.required],
    duracion: [0, [Validators.required, Validators.min(1)]],
    sinopsis: ['', Validators.required],
    generos: ['', Validators.required],
    edadMinima: [0, [Validators.required, Validators.min(0)]]
  });

  readonly showtimeForm = this.fb.nonNullable.group({
    movieId: [0, [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    formato: ['', Validators.required],
    idioma: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(1)]]
  });

  private async loadShowtimes() {
  const { data, error } = await this.showtimeService.getShowtimes();
  if (error) {
      console.error('Error cargando funciones:', error);
      return;
    }
    this.showtimes.set(data ?? []);
  }

  async createShowtime() {
    this.showtimeMessage.set('');
    this.showtimeError.set('');

    if (this.showtimeForm.invalid) {
      this.showtimeForm.markAllAsTouched();
      return;
    }
    const values = this.showtimeForm.getRawValue();
    const { error } = await this.showtimeService.createShowtime({
      movieId: values.movieId,
      fecha: values.fecha,
      hora: values.hora,
      formato: values.formato,
      idioma: values.idioma,
      precio: values.precio
    });

    if (error) {
      this.showtimeError.set(error.message);
      return;
    }
    this.showtimeMessage.set(`Función creada para el ${values.fecha} a las ${values.hora}.`);
    await this.loadShowtimes();
    this.showtimeForm.reset({movieId: 0,fecha: '',hora: '',formato: '',idioma: '',precio: 0});
  }

  async deleteShowtime(id: number) {const confirmed = confirm('¿Seguro que querés eliminar esta función?');

  if (!confirmed) {
    return;
  }

  const { error } = await this.showtimeService.deleteShowtime(id);

  if (error) {
    console.error('Error eliminando función:', error);
    return;
  }

  await this.loadShowtimes();
}

  private async loadMovies() {
    const { data, error } = await this.movieService.getMovies();

    if (error) {
      console.error('Error cargando películas:', error);
      return;
    }

    const movies: Movie[] = data.map(movie => ({
      id: movie.id,
      nombre: movie.nombre,
      imagen: movie.imagen,
      duracion: movie.duracion,
      sinopsis: movie.sinopsis,
      generos: movie.generos,
      edadMinima: movie.edad_minima
    }));

    this.movies.set(movies);
  }

  capitalize(text: string) {
    return text.charAt(0).toUpperCase() +
           text.slice(1).toLowerCase();
  }

  async saveMovie() {
    if (this.movieForm.invalid) {
      this.movieForm.markAllAsTouched();
      return;
    }

    const values = this.movieForm.getRawValue();

    const movieData = {
      nombre: values.nombre,
      imagen: `/images/movies/${values.imagen}`,
      duracion: values.duracion,
      sinopsis: values.sinopsis,
      generos: values.generos
        .split(',')
        .map(genero => genero.trim())
        .filter(genero => genero)
        .map(genero => this.capitalize(genero)),
      edad_minima: values.edadMinima
    };

    const id = this.editingMovieId();

    if (id !== null) {
      const { error } = await this.movieService.updateMovie(id, movieData);

      if (error) {
        console.error('Error actualizando película:', error);
        return;
      }

    } else {
      const { error } = await this.movieService.createMovie(movieData);
      if (error) {
        console.error('Error creando película:', error);
        return;
      }
    }

    this.resetForm();
    await this.loadMovies();
  }

  editMovie(movie: Movie) {
    this.editingMovieId.set(movie.id);
    this.movieForm.patchValue({
      nombre: movie.nombre,
      imagen: movie.imagen.split('/').pop() ?? '',
      duracion: movie.duracion,
      sinopsis: movie.sinopsis,
      generos: movie.generos.join(', '),
      edadMinima: movie.edadMinima
    });
  }

  async deleteMovie(id: number) {
    const confirmed = confirm('¿Seguro que querés eliminar esta película?');

    if (!confirmed) { return; }

    const { error } = await this.movieService.deleteMovie(id);

    if (error) {console.error('Error eliminando película:', error);
      return;
    }

    await this.loadMovies();
  }

  cancelEdit() {
    this.resetForm();
  }

  private resetForm() {
    this.editingMovieId.set(null);

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