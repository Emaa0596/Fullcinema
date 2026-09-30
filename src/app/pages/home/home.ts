import { Component, computed, inject, signal } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieCard } from '../../shared/movie-card/movie-card';

@Component({
  imports: [MovieCard],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  movies: Movie[] = [
    {
      id: 1,
      nombre: 'El resplandor',
      imagen: '/images/movies/elresplandor.jfif',
      duracion: 120,
      sinopsis: 'Sinopsis de ejemplo',
      generos: ['Suspenso'],
      edadMinima: 18
    },
    {
      id: 2,
      nombre: 'Shrek',
      imagen: '/images/movies/shrek.jpg',
      duracion: 105,
      sinopsis: 'Otra sinopsis',
      generos: ['Animada'],
      edadMinima: 7
    },
    {
      id: 3,
      nombre: 'El secreto de sus ojos',
      imagen: '/images/movies/elsecretodso.jfif',
      duracion: 110,
      sinopsis: 'Una historia de amor y justicia',
      generos: ['Drama'],
      edadMinima: 16
    },
    {
      id: 4,
      nombre: 'Interestelar',
      imagen: '/images/movies/interestelar.jpg',
      duracion: 169,
      sinopsis: 'Un grupo de exploradores viaja por el espacio en busca de un nuevo hogar para la humanidad.',
      generos: ['Ciencia ficción', 'Drama'],
      edadMinima: 13
    },
    {
      id: 5,
      nombre: 'Toy Story',
      imagen: '/images/movies/toystory.jpg',
      duracion: 81,
      sinopsis: 'Un grupo de juguetes vive distintas aventuras cuando sus dueños no están presentes.',
      generos: ['Animada', 'Comedia'],
      edadMinima: 0
    },
    {
      id: 6,
      nombre: 'El conjuro',
      imagen: '/images/movies/elconjuro.jpg',
      duracion: 112,
      sinopsis: 'Una familia comienza a experimentar sucesos paranormales en su nueva casa.',
      generos: ['Terror', 'Suspenso'],
      edadMinima: 16
    },
    {
      id: 7,
      nombre: 'Volver al futuro',
      imagen: '/images/movies/volveralfuturo.jpg',
      duracion: 116,
      sinopsis: 'Un adolescente viaja accidentalmente al pasado y debe encontrar la forma de regresar a su época.',
      generos: ['Ciencia ficción', 'Comedia'],
      edadMinima: 13
    },
    {
      id: 8,
      nombre: 'El padrino',
      imagen: '/images/movies/elpadrino.jpg',
      duracion: 175,
      sinopsis: 'La historia de una poderosa familia ligada al crimen organizado.',
      generos: ['Drama'],
      edadMinima: 18
    },
    {
      id: 9,
      nombre: 'Los increíbles',
      imagen: '/images/movies/losincreibles.jfif',
      duracion: 115,
      sinopsis: 'Una familia de superhéroes intenta llevar una vida normal mientras enfrenta nuevas amenazas.',
      generos: ['Animada', 'Acción', 'Comedia'],
      edadMinima: 7
    }
  ]

  search = signal('');
  selectedgenre = signal('');

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
    return this.movies.filter(movie => {
      const matchesName = movie.nombre.toLowerCase().includes(searchTerm);
      const matchesGenre = !selectedGenre || movie.generos.includes(selectedGenre);
      return matchesName && matchesGenre;
    });
  });

  genresSet = [...new Set(this.movies.flatMap(movie => movie.generos))];
}
