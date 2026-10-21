export interface PurchaseRequest {
  showtimeId: number;
  seatIds: number[];
  email: string | null;
  birthDate: string | null;
  ageNoticeAccepted: boolean;
}