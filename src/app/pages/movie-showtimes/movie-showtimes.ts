import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ShowtimeService } from '../../services/showtime.service';

@Component({
  selector: 'app-movie-showtimes',
  imports: [RouterLink],
  templateUrl: './movie-showtimes.html',
  styleUrl: './movie-showtimes.css'
})
export class MovieShowtimes {

  private readonly route = inject(ActivatedRoute);
  private readonly showtimeService = inject(ShowtimeService);

  readonly showtimes = signal<any[]>([]);

  constructor() {
    this.loadShowtimes();
  }

  private async loadShowtimes() {

    const movieId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!movieId) {
      return;
    }

    const { data, error } =
      await this.showtimeService.getShowtimesByMovie(movieId);

    if (error) {
      console.error('Error cargando funciones:', error);
      return;
    }

    this.showtimes.set(data ?? []);
  }
}
