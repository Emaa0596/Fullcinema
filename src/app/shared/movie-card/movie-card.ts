import { Component, input} from '@angular/core';
import { Movie } from '../../models/movie.model';

@Component({
  imports: [],
  selector: 'app-movie-card',
  styleUrl: './movie-card.css',
  templateUrl: './movie-card.html',
})
export class MovieCard {
  movie = input.required<Movie>();
}
