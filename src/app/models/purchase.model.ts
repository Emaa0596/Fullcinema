export interface PurchaseRequest {
  showtimeId: number;
  seatIds: number[];
  email: string | null;
  birthDate: string | null;
  ageNoticeAccepted: boolean;
  useCredit: boolean;
  candyItems: {
    id: number;
    type: 'product' | 'combo';
    nombre: string;
    precio: number;
    cantidad: number;
  }[];
  couponCode: string | null;
}