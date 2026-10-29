import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class SeatService {

  async getSeatsByShowtime(showtimeId: number) {
    const { data: showtime, error: showtimeError } = await supabase.from('showtimes')
      .select(`room_id,precio,precio_preventa,movies (edad_minima,fecha_estreno,preventa_habilitada)`)
      .eq('id', showtimeId)
      .single();

    if (showtimeError || !showtime) return { data: null, error: showtimeError ?? new Error('Función no encontrada') };

    const { data: seats, error: seatsError } = await supabase.from('seats').select('*').eq('room_id', showtime.room_id).order('fila').order('numero');
    if (seatsError) return { data: null, error: seatsError };

    const { data: occupiedSeats, error: occupiedError } = await supabase.from('showtime_seats').select('seat_id,status').eq('showtime_id', showtimeId);
    if (occupiedError) return { data: null, error: occupiedError };

    const { data: vipSetting } = await supabase.from('settings').select('value').eq('key', 'vip_surcharge').single();

    const movie = Array.isArray(showtime.movies) ? showtime.movies[0] : showtime.movies;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const releaseDate = movie?.fecha_estreno ? new Date(`${movie.fecha_estreno}T00:00:00`) : null;
    const presaleStart = releaseDate ? new Date(releaseDate) : null;
    if (presaleStart) presaleStart.setDate(presaleStart.getDate() - 7);

    const presaleActive = !!movie?.preventa_habilitada && !!releaseDate && !!presaleStart && today >= presaleStart && today < releaseDate;
    const ticketPrice = presaleActive ? Number(showtime.precio_preventa) : Number(showtime.precio);

    return { data: { seats, occupiedSeats, minimumAge: movie?.edad_minima ?? 0, ticketPrice, vipSurcharge: Number(vipSetting?.value ?? 0), presaleActive }, error: null };
  }

  subscribeToShowtimeSeats(showtimeId: number, onChange: () => void) {
    return supabase
      .channel(`showtime-seats-${showtimeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'showtime_seats',
          filter: `showtime_id=eq.${showtimeId}`
        }, () => { onChange(); }).subscribe();
  }
}