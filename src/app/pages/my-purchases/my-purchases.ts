import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-my-purchases',
  imports: [RouterLink, DatePipe],
  templateUrl: './my-purchases.html',
  styleUrl: './my-purchases.css'
})
export class MyPurchases {

  private readonly purchaseService = inject(PurchaseService);
  readonly purchases = signal<any[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadPurchases();
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

}