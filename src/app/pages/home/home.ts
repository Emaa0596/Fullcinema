import { Component, computed, inject, signal } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { MovieService } from '../../services/movie.service';

@Component({
  imports: [MovieCard],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {

  constructor() {
    this.loadMovies();
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
  movies = signal<Movie[]>([]);
  search = signal('');
  selectedgenre = signal('');
  private readonly movieService = inject(MovieService);

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
    return this.movies().filter(movie => {
      const matchesName = movie.nombre.toLowerCase().includes(searchTerm);
      const matchesGenre = !selectedGenre || movie.generos.includes(selectedGenre);
      return matchesName && matchesGenre;
    });
  });

  genresSet = computed(() => [...new Set(this.movies().flatMap(movie => movie.generos))]);
}
