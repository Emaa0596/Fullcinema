import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeatService } from '../../services/seat.service';
import { Seat } from '../../models/seat.model';
import { ShowtimeSeat } from '../../models/showtime-seat.model';
import { PurchaseService } from '../../services/purchase.service';

@Component({
  selector: 'app-seat-selection',
  imports: [],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})
export class SeatSelection {

  private readonly route = inject(ActivatedRoute);
  private readonly seatService = inject(SeatService);

  readonly seats = signal<Seat[]>([]);
  readonly occupiedSeats = signal<ShowtimeSeat[]>([]);
  readonly selectedSeats = signal<number[]>([]);
  readonly showtimeId = signal<number>(0);

  private readonly purchaseService = inject(PurchaseService);
  readonly purchaseMessage = signal('');
  readonly purchaseError = signal('');
  readonly purchasing = signal(false);

  constructor() {
    this.loadSeats();
  }

  private async loadSeats() {
    const id = Number(
    this.route.snapshot.paramMap.get('id'));

    if (!id) { return;}

    this.showtimeId.set(id);
    const { data, error } = await this.seatService.getSeatsByShowtime(id);

    if (error || !data) {
      console.error('Error cargando butacas:', error);
      return;
    }

    this.seats.set(data.seats ?? []);
    this.occupiedSeats.set(data.occupiedSeats ?? []);

  }

  readonly selectedSeatData = computed(() => this.seats().filter(seat => this.selectedSeats().includes(seat.id)));

  isOccupied(seatId: number) {
    return this.occupiedSeats().some(seat => seat.seat_id === seatId);
  }

  isSelected(seatId: number) {
    return this.selectedSeats().includes(seatId);
  }

  toggleSeat(seatId: number) {
    if (this.isOccupied(seatId)) {
      return;
    }

    if (this.isSelected(seatId)) {
      this.selectedSeats.update(seats => seats.filter(id => id !== seatId));
      return;
    }

    this.selectedSeats.update(seats => [...seats,seatId]);
  }

  getRows() {return [...new Set(this.seats().map(seat => seat.fila))];}

  getSeatsByRow(row: string) { return this.seats().filter(seat => seat.fila === row);}

  getSeatsByBlock(row: string, block: 'left' | 'center' | 'right') {
    return this.seats().filter(seat => seat.fila === row && seat.bloque === block);
  }

  async confirmPurchase() {
    this.purchaseMessage.set('');
    this.purchaseError.set('');

    if (this.selectedSeats().length === 0) { this.purchaseError.set('Seleccioná al menos una butaca.'); 
      return;
    }

    this.purchasing.set(true);

    const { data, error } =
      await this.purchaseService.createPurchase({
        showtimeId: this.showtimeId(),
        seatIds: this.selectedSeats(),
        email: null
      });

    this.purchasing.set(false);

    if (error) {
      console.error('Error creando compra:', error);

      this.purchaseError.set('No se pudo completar la compra. Alguna butaca puede haber sido ocupada.');

      // Volvemos a consultar el estado actual de la sala.
      await this.loadSeats();

      return;
    }

    this.purchaseMessage.set(`Compra realizada correctamente. ID: ${data}`);
    this.selectedSeats.set([]);

    // Actualizamos el mapa para mostrar las nuevas ocupadas.
    await this.loadSeats();
  }

  
}