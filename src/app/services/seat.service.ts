import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class SeatService {

  async getSeatsByShowtime(showtimeId: number) {

    // 1. Buscamos la sala de la función
    const { data: showtime, error: showtimeError } = await supabase
      .from('showtimes')
      .select('room_id')
      .eq('id', showtimeId)
      .single();

    if (showtimeError || !showtime) {return { data: null, error: showtimeError ?? new Error('Función no encontrada')};}

    // 2. Traemos todas las butacas de esa sala
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .eq('room_id', showtime.room_id)
      .order('fila')
      .order('numero');

    if (seatsError) { return {  data: null, error: seatsError};}

    // 3. Traemos las ocupadas para esa función
    const { data: occupiedSeats, error: occupiedError } = await supabase
      .from('showtime_seats')
      .select('seat_id, status')
      .eq('showtime_id', showtimeId);

    if (occupiedError) { return { data: null, error: occupiedError};}

    return {data: {seats, occupiedSeats}, error: null};
    
    }
}