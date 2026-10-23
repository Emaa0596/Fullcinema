import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ProfileStore } from '../../services/profile.store.service';

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

  readonly loyaltyTransactions = signal<any[]>([]);
  readonly rewards = signal<any[]>([]);

  readonly redeemingReward = signal<number | null>(null);

  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.auth.initialized;

    await this.profileStore.loadProfile();
    await this.loadLoyaltyTransactions();
    await this.loadRewards();
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
}