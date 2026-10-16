export interface Seat {
  id: number;
  room_id: number;
  fila: string;
  numero: number;
  bloque: 'left' | 'center' | 'right';
  tipo: 'standard' | 'accessible' | 'vip';
}