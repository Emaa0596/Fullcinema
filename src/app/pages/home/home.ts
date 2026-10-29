import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { MovieService } from '../../services/movie.service';
import { ReviewService } from '../../services/review.service';

@Component({
  imports: [MovieCard, RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {

  movies = signal<Movie[]>([]);
  search = signal('');
  selectedgenre = signal('');
  private readonly movieService = inject(MovieService);
  private readonly reviewService = inject(ReviewService);
  readonly movieRatings = signal<any[]>([]);
  readonly topMovies = signal<any[]>([]);
  readonly featuredMovies = computed(() => this.movies().filter(movie => movie.destacada));

  constructor() {
    this.loadMovies();
    this.loadRatings();
    this.loadTopMovies();
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
      edadMinima: movie.edad_minima,
      fechaEstreno: movie.fecha_estreno,
      preventaHabilitada: movie.preventa_habilitada,
      precioPreventa: movie.precio_preventa,
      destacada: movie.destacada ?? false
    }));

    this.movies.set(movies);
  }

  private async loadTopMovies() {
    const { data,error } = await this.movieService.getTopMovies();
    if(error){ console.error(error); return; }
    this.topMovies.set(data ?? []);
  }

  onGenreChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedGenreOption = selectElement.value;
    this.selectedgenre.set(selectedGenreOption);
  }

  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const searchTerm = inputElement.value.trim().toLowerCase();
    this.search.set(searchTerm);
  }

  filteredMovies = computed(() => {
    const searchTerm = this.search();
    const selectedGenre = this.selectedgenre();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.movies().filter(movie => {
      const matchesName = movie.nombre.toLowerCase().includes(searchTerm);
      const matchesGenre = !selectedGenre || movie.generos.includes(selectedGenre);

      const isReleased = !movie.fechaEstreno ||
        new Date(`${movie.fechaEstreno}T00:00:00`) <= today;

      return matchesName && matchesGenre && isReleased;
    });
  });

  genresSet = computed(() => [...new Set(this.movies().flatMap(movie => movie.generos))]);

  private async loadRatings() {
    const { data, error } = await this.reviewService.getMovieRatings();
    if (error) {
      console.error('Error cargando ratings:', error);
      return;
    }
    this.movieRatings.set(data ?? []);
  }

  getRating(movieId: number) {
    return this.movieRatings().find(rating => rating.movie_id === movieId);
  }

  readonly upcomingMovies = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.movies()
      .filter(movie => {
        if (!movie.fechaEstreno) return false;

        const releaseDate = new Date(`${movie.fechaEstreno}T00:00:00`);
        const presaleStart = new Date(releaseDate);
        presaleStart.setDate(presaleStart.getDate() - 7);

        const presaleActive =
          movie.preventaHabilitada &&
          today >= presaleStart &&
          today < releaseDate;

        return releaseDate > today && !presaleActive;
      })
      .sort((a, b) =>
        new Date(`${a.fechaEstreno}T00:00:00`).getTime() -
        new Date(`${b.fechaEstreno}T00:00:00`).getTime()
      );
  });

  readonly presaleMovies = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.movies().filter(movie => {
      if (!movie.fechaEstreno || !movie.preventaHabilitada) return false;
      const releaseDate = new Date(`${movie.fechaEstreno}T00:00:00`);
      const presaleStart = new Date(releaseDate);
      presaleStart.setDate(presaleStart.getDate() - 7);
      return today >= presaleStart && today < releaseDate;
    });
  });

}
