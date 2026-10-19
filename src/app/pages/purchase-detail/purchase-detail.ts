import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-purchase-detail',
  imports: [DatePipe, QRCodeComponent],
  templateUrl: './purchase-detail.html',
  styleUrl: './purchase-detail.css'
})
export class PurchaseDetail {

  private readonly route = inject(ActivatedRoute);
  private readonly purchaseService = inject(PurchaseService);

  readonly purchase = signal<any | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadPurchase();
  }

  private async loadPurchase() {
    const purchaseId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!purchaseId) {
      this.errorMessage.set('Compra no válida.');
      this.loading.set(false);
      return;
    }

    const { data, error } =
      await this.purchaseService.getPurchaseById(purchaseId);

    this.loading.set(false);

    if (error || !data) {
      console.error('Error cargando compra:', error);

      this.errorMessage.set(
        'No se pudo cargar la información de la compra.'
      );

      return;
    }
    console.log('PURCHASE DETAIL:', data);
    this.purchase.set(data);
  }
}