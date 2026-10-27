import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ProfileStore } from '../../services/profile.store.service';
import { PurchaseService } from '../../services/purchase.service';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-profile',
  imports: [DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {

  readonly profileStore = inject(ProfileStore);
  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly reviewService = inject(ReviewService);

  readonly loyaltyTransactions = signal<any[]>([]);
  readonly rewards = signal<any[]>([]);

  readonly redeemingReward = signal<number | null>(null);

  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly myMovies = signal<any[]>([]);
  readonly myReviews = signal<any[]>([]);

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.auth.initialized;
    await this.profileStore.loadProfile();
    await this.loadLoyaltyTransactions();
    await this.loadRewards();
    await this.loadMyMovies();
  }

  email() {
    return this.auth.session()?.user.email ?? '';
  }

  private async loadLoyaltyTransactions() {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;

    const { data, error } = await this.profileService.getLoyaltyTransactions(userId);

    if (error) {
      console.error('Error cargando historial de puntos:', error);
      return;
    }

    this.loyaltyTransactions.set(data ?? []);
  }

  private async loadRewards() {
    const { data, error } = await this.profileService.getLoyaltyRewards();

    if (error) {
      console.error('Error cargando recompensas:', error);
      return;
    }

    this.rewards.set(data ?? []);
  }

  canRedeem(cost: number) {
    return (this.profileStore.profile()?.puntos ?? 0) >= cost;
  }

  async redeemReward(reward: any) {
    if (!this.canRedeem(reward.costo_puntos)) {
      this.errorMessage.set('No tenés puntos suficientes para canjear esta recompensa.');
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.redeemingReward.set(reward.id);

    const { data, error } = await this.profileService.redeemLoyaltyReward(reward.id);

    this.redeemingReward.set(null);

    if (error) {
      console.error('Error canjeando recompensa:', error);
      this.errorMessage.set(error.message ?? 'No se pudo realizar el canje.');
      return;
    }

    console.log('Canje realizado:', data);

    this.successMessage.set(`Canjeaste "${reward.nombre}" correctamente.`);

    await this.profileStore.loadProfile();
    await this.loadLoyaltyTransactions();
  }

  private async loadMyMovies() {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;

    const [purchasesResult, reviewsResult] = await Promise.all([
      this.purchaseService.getMyMovies(),
      this.reviewService.getMyReviews(userId)
    ]);

    if (purchasesResult.error) {
      console.error('Error cargando películas:', purchasesResult.error);
      return;
    }

    if (reviewsResult.error) {
      console.error('Error cargando reseñas:', reviewsResult.error);
      return;
    }

    console.log('Compras para Mis películas:', purchasesResult.data);

    const reviews = reviewsResult.data ?? [];

    const movies = (purchasesResult.data ?? [])
      .filter((purchase: any) => {
        const ticket = purchase.tickets;

        if (Array.isArray(ticket)) {
          return ticket.some((item: any) => item.status === 'used');
        }

        return ticket?.status === 'used';
      })
      .map((purchase: any) => {
        const movie = purchase.showtimes?.movies;

        return {
          id: movie?.id,
          nombre: movie?.nombre,
          imagen: movie?.imagen,
          fecha: purchase.showtimes?.fecha,
          rating: reviews.find((review: any) => review.movie_id === movie?.id)?.rating ?? null
        };
      });

    this.myMovies.set(
      movies.filter((movie: any, index: number, array: any[]) =>
        index === array.findIndex(item => item.id === movie.id)
      )
    );
  }

}