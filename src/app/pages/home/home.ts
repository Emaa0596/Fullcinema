import { Component, computed, inject } from '@angular/core';
import {Movie} from '../../models/movie.model';
import {MovieCard} from '../../shared/movie-card/movie-card';

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
      generos: 'Suspenso',
      edadMinima: 18
    },
    {
      id: 2,
      nombre: 'Shrek',
      imagen: '/images/movies/shrek.jpg',
      duracion: 105,
      sinopsis: 'Otra sinopsis',
      generos: 'Animada',
      edadMinima: 7
    },
    {
      id: 3,
      nombre: 'El secreto de sus ojos',
      imagen: '/images/movies/elsecretodso.jfif',
      duracion: 110,
      sinopsis: 'Una historia de amor y justicia',
      generos: 'Drama',
      edadMinima: 16
    }
  ]
}
