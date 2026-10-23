import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SeatService } from '../../services/seat.service';
import { Seat } from '../../models/seat.model';
import { ShowtimeSeat } from '../../models/showtime-seat.model';
import { PurchaseService } from '../../services/purchase.service';
import { ProfileStore } from '../../services/profile.store.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-seat-selection',
  imports: [],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css'
})
export class SeatSelection implements OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seatService = inject(SeatService);

  readonly seats = signal<Seat[]>([]);
  readonly occupiedSeats = signal<ShowtimeSeat[]>([]);
  readonly selectedSeats = signal<number[]>([]);
  readonly showtimeId = signal<number>(0);

  private readonly purchaseService = inject(PurchaseService);
  readonly purchaseMessage = signal('');
  readonly purchaseError = signal('');
  readonly purchasing = signal(false);
  readonly purchaseId = signal<number | null>(null);

  private realtimeChannel?: RealtimeChannel;
  private readonly auth = inject(AuthService);
  readonly guestEmail = signal('');
  readonly isLoggedIn = computed(() => !!this.auth.session());

  private readonly profileStore = inject(ProfileStore);

  readonly movieMinimumAge = signal(0);
  readonly guestBirthDate = signal('');
  readonly ageNoticeVisible = signal(false);
  readonly ageNoticeAccepted = signal(false);

  readonly useCredit = signal(false);

  readonly availableCredit = computed(() => {return this.profileStore.profile()?.credito ?? 0;});

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isLoggedIn()) await this.profileStore.loadProfile();
    await this.loadSeats();
    this.subscribeToRealtime();
  }

  private subscribeToRealtime() {
    const showtimeId = this.showtimeId();
    if (!showtimeId) return;
    this.realtimeChannel = this.seatService.subscribeToShowtimeSeats(showtimeId, async () => {
        console.log('Cambio de butacas recibido por Realtime');
        await this.loadSeats();
      }
    );
  }

  ngOnDestroy() {if (this.realtimeChannel) {this.realtimeChannel.unsubscribe();}}

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
    this.movieMinimumAge.set(data.minimumAge ?? 0);

    this.seats.set(data.seats ?? []);
    this.occupiedSeats.set(data.occupiedSeats ?? []);
  }

  private calculateAge(birthDate: string) {
    const [year, month, day] = birthDate.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    const monthDifference = today.getMonth() + 1 - month;
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < day)) age--;
    return age;
  }

  private getBirthDate() {
    if (this.isLoggedIn()) return this.profileStore.profile()?.nacimiento ?? null;
    return this.guestBirthDate().trim() || null;
  }

  private validateAge() {
    const minimumAge = this.movieMinimumAge();

    if (minimumAge <= 0) return true;

    const birthDate = this.getBirthDate();

    if (!birthDate) {
      this.purchaseError.set('No se pudo obtener la fecha de nacimiento.');
      return false;
    }

    const age = this.calculateAge(birthDate);

    if (age < minimumAge) {
      this.purchaseError.set(`No podés comprar esta entrada. La película es apta para mayores de ${minimumAge} años.`);
      return false;
    }

    if (age < 18 && !this.ageNoticeAccepted()) {
      this.ageNoticeVisible.set(true);
      return false;
    }

    return true;
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

  async acceptAgeNotice() {
    this.ageNoticeAccepted.set(true);
    this.ageNoticeVisible.set(false);
    await this.confirmPurchase();
  }

  async confirmPurchase() {
    this.purchaseMessage.set('');
    this.purchaseError.set('');

    if (this.selectedSeats().length === 0) {
      this.purchaseError.set('Seleccioná al menos una butaca.');
      return;
    }

    const session = this.auth.session();

    const email = session ? session.user.email ?? null : this.guestEmail().trim() || null;

    if (!session && !email) {
      this.purchaseError.set('Ingresá un email para continuar como invitado.');
      return;
    }

    if (!session && !this.guestBirthDate().trim()) {
      this.purchaseError.set('Ingresá tu fecha de nacimiento para continuar.');
      return;
    }
    if (!this.validateAge()) return;

    const birthDate = session ? this.profileStore.profile()?.nacimiento ?? null : this.guestBirthDate().trim() || null;

    this.purchasing.set(true);

    const { data, error } = await this.purchaseService.createPurchase({
      showtimeId: this.showtimeId(),
      seatIds: this.selectedSeats(),
      email,
      birthDate,
      ageNoticeAccepted: this.ageNoticeAccepted(),
      useCredit: this.useCredit()
    });

    this.purchasing.set(false);

    if (error) {
      console.error('Error creando compra:', error);
      this.purchaseError.set(error.message);
      await this.loadSeats();
      return;
    }

    this.selectedSeats.set([]);
    this.useCredit.set(false);

    await this.profileStore.loadProfile();


    await this.router.navigate(['/purchase', data.purchase_id],
      {
        queryParams: {token: data.ticket_code}
      }
    );
  }
}