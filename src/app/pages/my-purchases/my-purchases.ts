import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PurchaseService } from '../../services/purchase.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-purchases',
  imports: [RouterLink, DatePipe],
  templateUrl: './my-purchases.html',
  styleUrl: './my-purchases.css'
})
export class MyPurchases {

  private readonly purchaseService = inject(PurchaseService);
  private readonly auth = inject(AuthService);
  readonly purchases = signal<any[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  private readonly reviewService = inject(ReviewService);

  readonly reviewPurchaseId = signal<number | null>(null);
  readonly rating = signal(0);
  readonly comment = signal('');
  readonly reviewMessage = signal('');
  readonly reviewError = signal('');
  readonly reviewedMovieIds = signal<number[]>([]);

  constructor() {
    this.loadPurchases();
    this.loadMyReviews();
  }

  private async loadPurchases() {
    const { data, error } = await this.purchaseService.getMyPurchases();
    this.loading.set(false);
    if (error) {
      console.error('Error cargando compras:', error);
      this.errorMessage.set('No se pudieron cargar tus compras.');
      return;
    }
    this.purchases.set(data ?? []);
  }

  isFuturePurchase(purchase: any) {
    if (purchase.status !== 'confirmed') return false;
    const date = purchase.showtimes?.fecha;
    const time = purchase.showtimes?.hora;
    if (!date || !time) return false;
    const showtimeDate = new Date(`${date}T${time}`);
    return showtimeDate > new Date();
  }

  isPastPurchase(purchase: any) {
    if (purchase.status !== 'confirmed') return false;
    const date = purchase.showtimes?.fecha;
    const time = purchase.showtimes?.hora;
    if (!date || !time) return false;
    const showtimeDate = new Date(`${date}T${time}`);
    return showtimeDate <= new Date();
  }

  canReview(purchase: any) {
    if (purchase.status !== 'confirmed') return false;

    const date = purchase.showtimes?.fecha;
    const time = purchase.showtimes?.hora;
    const movie = purchase.showtimes?.movies;

    if (!date || !time || !movie?.duracion || !movie?.id) return false;

    if (this.hasReviewed(movie.id)) return false;

    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + movie.duracion * 60 * 1000);

    return new Date() > end;
  }

  openReview(purchaseId: number) {
    this.reviewPurchaseId.set(purchaseId);
    this.rating.set(0);
    this.comment.set('');
    this.reviewMessage.set('');
    this.reviewError.set('');
  }

  closeReview() {
    this.reviewPurchaseId.set(null);
    this.rating.set(0);
    this.comment.set('');
  }

  async submitReview(purchase: any) {
    this.reviewMessage.set('');
    this.reviewError.set('');

    if (this.rating() < 1 || this.rating() > 5) {
      this.reviewError.set('Seleccioná una calificación de 1 a 5 estrellas.');
      return;
    }

    const movieId = purchase.showtimes?.movies?.id;

    if (!movieId) {
      this.reviewError.set('No se pudo identificar la película.');
      return;
    }

    const { error } = await this.reviewService.createReview(
      movieId,
      this.rating(),
      this.comment()
    );

    if (error) {
      console.error('Error creando review:', error);
      this.reviewError.set(error.message ?? 'No se pudo guardar la calificación.');
      return;
    }

    this.reviewedMovieIds.update(ids => [...ids, movieId]);

    this.reviewMessage.set('Calificación guardada correctamente.');
    this.reviewPurchaseId.set(null);
    this.rating.set(0);
    this.comment.set('');
  }

  hasReviewed(movieId: number) {
    return this.reviewedMovieIds().includes(movieId);
  }


  private async loadMyReviews() {
    await this.auth.initialized;

    const userId = this.auth.session()?.user.id;
    if (!userId) return;

    const { data, error } = await this.reviewService.getMyReviews(userId);

    if (error) {
      console.error('Error cargando reviews:', error);
      return;
    }

    this.reviewedMovieIds.set(
      (data ?? []).map(review => review.movie_id)
    );
  }
}