import { Injectable, signal } from '@angular/core';

export interface CheckoutData {
  showtimeId: number;
  seatIds: number[];
  email: string | null;
  birthDate: string | null;
  ageNoticeAccepted: boolean;
  useCredit: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  readonly data = signal<CheckoutData | null>(null);

  setCheckout(data: CheckoutData) {
    this.data.set(data);
  }

  clearCheckout() {
    this.data.set(null);
  }
}