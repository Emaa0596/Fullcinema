import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ShowtimeService } from '../../services/showtime.service';
import { MovieService } from '../../services/movie.service';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-showtimes',
  imports: [RouterLink, DatePipe],
  templateUrl: './showtimes.html',
  styleUrl: './showtimes.css'
})
export class Showtimes {

  private readonly route = inject(ActivatedRoute);
  private readonly showtimeService = inject(ShowtimeService);
  private readonly movieService = inject(MovieService);
  private readonly reviewService = inject(ReviewService);

  readonly movie = signal<any>(null);
  readonly showtimes = signal<any[]>([]);
  readonly rating = signal<any>(null);
  readonly reviews = signal<any[]>([]);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const movieId = Number(this.route.snapshot.paramMap.get('id'));

    if (!movieId) {
      this.errorMessage.set('No se pudo identificar la película.');
      this.loading.set(false);
      return;
    }

    await Promise.all([
      this.loadMovie(movieId),
      this.loadShowtimes(movieId),
      this.loadRating(movieId),
      this.loadReviews(movieId)
    ]);

    this.loading.set(false);
  }

  private async loadMovie(movieId: number) {
    const { data, error } = await this.movieService.getMovieById(movieId);

    if (error) {
      console.error('Error cargando película:', error);
      this.errorMessage.set('No se pudo cargar la película.');
      return;
    }

    this.movie.set(data);
  }

  private async loadShowtimes(movieId: number) {
    const { data, error } = await this.showtimeService.getShowtimesByMovie(movieId);

    if (error) {
      console.error('Error cargando funciones:', error);
      return;
    }

    const showtimes = (data ?? []).map((showtime: any) => {
      const movie = showtime.movies;
      const presaleActive = movie?.fecha_estreno && movie?.preventa_habilitada && this.isPresaleActive(movie);
      return {
        ...showtime,
        precioOriginal: Number(showtime.precio),
        precio: presaleActive ? Number(showtime.precio_preventa) : Number(showtime.precio),
        preventaActiva: presaleActive
      };
    });

    this.showtimes.set(showtimes);

    this.showtimes.set(showtimes);
  }

  private async loadRating(movieId: number) {
    const { data, error } = await this.reviewService.getMovieRating(movieId);

    if (error) {
      console.error('Error cargando rating:', error);
      return;
    }

    this.rating.set(data);
  }

  private async loadReviews(movieId: number) {
    const { data, error } = await this.reviewService.getMovieReviews(movieId);

    if (error) {
      console.error('Error cargando reviews:', error);
      return;
    }

    this.reviews.set(data ?? []);
  }

  getStars(rating: number) {
    return [1, 2, 3, 4, 5].map(star => star <= rating);
  }

  isPresaleActive(movie: any) {
    if (!movie?.fecha_estreno || !movie?.preventa_habilitada) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const releaseDate = new Date(`${movie.fecha_estreno}T00:00:00`);
    const presaleStart = new Date(releaseDate);
    presaleStart.setDate(presaleStart.getDate() - 7);

    return today >= presaleStart && today < releaseDate;
  }

}