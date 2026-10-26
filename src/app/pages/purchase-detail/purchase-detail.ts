import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { jsPDF } from 'jspdf';
import { PurchaseService } from '../../services/purchase.service';
import { ProfileStore } from '../../services/profile.store.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-purchase-detail',
  imports: [DatePipe, QRCodeComponent],
  templateUrl: './purchase-detail.html',
  styleUrl: './purchase-detail.css'
})

export class PurchaseDetail {

  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly profileStore = inject(ProfileStore);

  readonly purchase = signal<any | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly cancelling = signal(false);
  readonly cancelMessage = signal('');
  readonly cancelError = signal('');

  constructor() {
    this.loadPurchase();
  }

  private async loadPurchase() {
    const purchaseId = Number(this.route.snapshot.paramMap.get('id'));
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!purchaseId) {
      this.errorMessage.set('Compra no válida.');
      this.loading.set(false);
      return;
    }

    await this.auth.initialized;

    let data;
    let error;

    if (this.auth.session()) {
      const response = await this.purchaseService.getPurchaseById(purchaseId);
      data = response.data;
      error = response.error;
    } else {
      if (!token) {
        this.errorMessage.set('No se pudo validar el acceso a la compra.');
        this.loading.set(false);
        return;
      }

      const response = await this.purchaseService.getGuestPurchase(purchaseId, token);
      data = response.data;
      error = response.error;
    }

    this.loading.set(false);

    if (error || !data) {
      console.error('Error cargando compra:', error);
      this.errorMessage.set('No se pudo cargar la información de la compra.');
      return;
    }

    this.purchase.set(data);
    console.log('COMPRA COMPLETA:', data);
  }

  async cancelPurchase() {
    const purchase = this.purchase();
    if (!purchase) return;

    this.cancelMessage.set('');
    this.cancelError.set('');
    this.cancelling.set(true);
    const { data, error } = await this.purchaseService.cancelPurchase(purchase.id);

    this.cancelling.set(false);
    if (error) {
      console.error('Error cancelando compra:', error);
      this.cancelError.set(error.message);
      return;
    }

    this.cancelMessage.set(`Compra cancelada. Se acreditaron $${data.credited_amount} a tu saldo.`);
    await this.profileStore.loadProfile();
    await this.loadPurchase();
  }

  private formatDate(date: string) {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  generatePdf() {
    const purchase = this.purchase();
    if (!purchase) return;

    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text('FullCinema - Entrada', 20, 20);

    pdf.setFontSize(12);
    let y = 32;

    pdf.text(`Compra #${purchase.id}`, 20, y);
    y += 12;

    pdf.text(`Película: ${purchase.showtimes?.movies?.nombre}`, 20, y);
    y += 10;

    pdf.text(`Fecha: ${this.formatDate(purchase.showtimes?.fecha)}`, 20, y);
    y += 10;

    pdf.text(`Horario: ${purchase.showtimes?.hora?.slice(0, 5)}`, 20, y);
    y += 10;

    pdf.text(`Sala: ${purchase.showtimes?.rooms?.nombre}`, 20, y);
    y += 10;

    pdf.text(`Formato: ${purchase.showtimes?.formato}`, 20, y);
    y += 10;

    pdf.text(`Idioma: ${purchase.showtimes?.idioma}`, 20, y);
    y += 12;

    // ENTRADAS
    const ticketQuantity = purchase.showtime_seats?.length ?? 0;
    const ticketPrice = Number(purchase.showtimes?.precio ?? 0);
    const ticketsSubtotal = ticketQuantity * ticketPrice;

    pdf.setFontSize(13);
    pdf.text('Entradas', 20, y);
    y += 8;

    pdf.setFontSize(11);
    pdf.text(`${ticketQuantity} x $${ticketPrice} = $${ticketsSubtotal}`, 25, y);
    y += 8;

    // BUTACAS
    const seats = purchase.showtime_seats.map((item: any) => `${item.seats?.fila}${item.seats?.numero}`).join(', ');
    pdf.text(`Butacas: ${seats}`, 25, y);
    y += 12;

    // CANDY
    if (purchase.purchase_candy_items?.length > 0) {
      pdf.setFontSize(13);
      pdf.text('Candy', 20, y);
      y += 8;

      pdf.setFontSize(11);
      purchase.purchase_candy_items.forEach((item: any) => {
        pdf.text(`${item.cantidad} x ${item.nombre} = $${item.subtotal}`, 25, y);
        y += 7;
      });

      y += 5;
    }

    // TOTALES
    pdf.setFontSize(12);
    pdf.text(`Subtotal: $${purchase.subtotal}`, 20, y);
    y += 8;

    if (purchase.descuento > 0) {
      pdf.text(`Descuento primera compra: -$${purchase.descuento}`, 20, y);
      y += 8;
    }

    if (purchase.descuento_cupon > 0) {
      pdf.text(`Descuento por cupón: -$${purchase.descuento_cupon}`, 20, y);
      y += 8;
    }

    if (purchase.credito_usado > 0) {
      pdf.text(`Crédito utilizado: -$${purchase.credito_usado}`, 20, y);
      y += 8;
    }

    pdf.setFontSize(14);
    pdf.text(`Total: $${purchase.total}`, 20, y);
    y += 12;

    // QR
    const qrContainer = document.getElementById('ticket-qr');
    const canvas = qrContainer?.querySelector('canvas');

    if (canvas) {
      const qrImage = canvas.toDataURL('image/png');
      pdf.addImage(qrImage, 'PNG', 65, y, 80, 80);
      y += 90;
    }

    pdf.setFontSize(9);
    pdf.text(`Código: ${purchase.tickets?.code}`, 20, y);

    pdf.save(`entrada-${purchase.id}.pdf`);
  }

}