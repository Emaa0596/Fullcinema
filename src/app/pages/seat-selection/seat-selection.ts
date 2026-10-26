import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SeatService } from '../../services/seat.service';
import { Seat } from '../../models/seat.model';
import { ShowtimeSeat } from '../../models/showtime-seat.model';
import { ProfileStore } from '../../services/profile.store.service';
import { AuthService } from '../../services/auth.service';
import { CheckoutService } from '../../services/checkout.service';

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
  private readonly auth = inject(AuthService);
  private readonly profileStore = inject(ProfileStore);
  private readonly checkoutService = inject(CheckoutService);

  readonly seats = signal<Seat[]>([]);
  readonly occupiedSeats = signal<ShowtimeSeat[]>([]);
  readonly selectedSeats = signal<number[]>([]);
  readonly showtimeId = signal<number>(0);

  readonly purchaseMessage = signal('');
  readonly purchaseError = signal('');

  readonly guestEmail = signal('');
  readonly guestBirthDate = signal('');

  readonly movieMinimumAge = signal(0);

  readonly ageNoticeVisible = signal(false);
  readonly ageNoticeAccepted = signal(false);

  readonly useCredit = signal(false);

  readonly isLoggedIn = computed(() => !!this.auth.session());

  readonly availableCredit = computed(() =>
    this.profileStore.profile()?.credito ?? 0
  );

  readonly selectedSeatData = computed(() =>
    this.seats().filter(seat =>
      this.selectedSeats().includes(seat.id)
    )
  );

  private realtimeChannel?: RealtimeChannel;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.auth.initialized;

    if (this.isLoggedIn()) {
      await this.profileStore.loadProfile();
    }

    await this.loadSeats();
    this.subscribeToRealtime();
  }

  private subscribeToRealtime() {
    const showtimeId = this.showtimeId();

    if (!showtimeId) return;

    this.realtimeChannel =
      this.seatService.subscribeToShowtimeSeats(
        showtimeId,
        async () => {
          console.log('Cambio de butacas recibido por Realtime');
          await this.loadSeats();
        }
      );
  }

  ngOnDestroy() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  private async loadSeats() {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (!id) return;

    this.showtimeId.set(id);

    const { data, error } =
      await this.seatService.getSeatsByShowtime(id);

    if (error || !data) {
      console.error('Error cargando butacas:', error);
      return;
    }

    this.seats.set(data.seats ?? []);
    this.occupiedSeats.set(data.occupiedSeats ?? []);
    this.movieMinimumAge.set(data.minimumAge ?? 0);


    // Si una butaca seleccionada pasó a estar ocupada
    // por otro usuario, la quitamos de la selección.

    this.selectedSeats.update(selected =>
      selected.filter(
        seatId =>
          !this.occupiedSeats().some(
            occupied => occupied.seat_id === seatId
          )
      )
    );
  }

  private calculateAge(birthDate: string) {
    const [year, month, day] =
      birthDate.split('-').map(Number);

    const today = new Date();

    let age =
      today.getFullYear() - year;

    const monthDifference =
      today.getMonth() + 1 - month;

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < day
      )
    ) {
      age--;
    }

    return age;
  }

  private getBirthDate() {
    if (this.isLoggedIn()) {
      return this.profileStore.profile()?.nacimiento ?? null;
    }

    return this.guestBirthDate().trim() || null;
  }

  private validateAge() {
    const minimumAge =
      this.movieMinimumAge();

    if (minimumAge <= 0) {
      return true;
    }

    const birthDate =
      this.getBirthDate();

    if (!birthDate) {
      this.purchaseError.set(
        'No se pudo obtener la fecha de nacimiento.'
      );

      return false;
    }

    const age =
      this.calculateAge(birthDate);

    if (age < minimumAge) {
      this.purchaseError.set(
        `No podés comprar esta entrada. La película es apta para mayores de ${minimumAge} años.`
      );

      return false;
    }

    if (
      age < 18 &&
      !this.ageNoticeAccepted()
    ) {
      this.ageNoticeVisible.set(true);
      return false;
    }

    return true;
  }

  isOccupied(seatId: number) {
    return this.occupiedSeats().some(
      seat => seat.seat_id === seatId
    );
  }

  isSelected(seatId: number) {
    return this.selectedSeats().includes(seatId);
  }

  toggleSeat(seatId: number) {
    if (this.isOccupied(seatId)) {
      return;
    }

    if (this.isSelected(seatId)) {
      this.selectedSeats.update(
        seats =>
          seats.filter(id => id !== seatId)
      );

      return;
    }

    this.selectedSeats.update(
      seats => [...seats, seatId]
    );
  }

  getRows() {
    return [
      ...new Set(
        this.seats().map(seat => seat.fila)
      )
    ];
  }

  getSeatsByRow(row: string) {
    return this.seats().filter(
      seat => seat.fila === row
    );
  }

  getSeatsByBlock(
    row: string,
    block: 'left' | 'center' | 'right'
  ) {
    return this.seats().filter(
      seat =>
        seat.fila === row &&
        seat.bloque === block
    );
  }

  async acceptAgeNotice() {
    this.ageNoticeAccepted.set(true);
    this.ageNoticeVisible.set(false);

    await this.continueToCandy();
  }

  async continueToCandy() {
    this.purchaseMessage.set('');
    this.purchaseError.set('');

    if (this.selectedSeats().length === 0) {
      this.purchaseError.set(
        'Seleccioná al menos una butaca.'
      );

      return;
    }

    const session =
      this.auth.session();


    // INVITADO

    if (!session) {

      if (!this.guestEmail().trim()) {
        this.purchaseError.set(
          'Ingresá tu email.'
        );

        return;
      }

      if (!this.guestBirthDate().trim()) {
        this.purchaseError.set(
          'Ingresá tu fecha de nacimiento.'
        );

        return;
      }

    }


    // VALIDACIÓN DE EDAD

    const validAge =
      this.validateAge();

    if (!validAge) {
      return;
    }


    // GUARDAMOS TEMPORALMENTE EL CHECKOUT

    this.checkoutService.setCheckout({
      showtimeId: this.showtimeId(),

      seatIds: this.selectedSeats(),

      email:
        session?.user.email ??
        this.guestEmail().trim(),

      birthDate:
        session
          ? this.profileStore.profile()?.nacimiento ?? null
          : this.guestBirthDate().trim(),

      ageNoticeAccepted:
        this.ageNoticeAccepted(),

      useCredit:
        this.useCredit()
    });


    // TODAVÍA NO SE CREA LA COMPRA.
    // PASAMOS A CANDY.

    await this.router.navigate(['/candy']);
  }

}