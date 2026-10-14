import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class ShowtimeService {

    getShowtimes() {
        return supabase
        .from('showtimes')
        .select(`*,movies (id, nombre,duracion),rooms (id,nombre)`).order('fecha', { ascending: true }).order('hora', { ascending: true });
    }

    async createShowtime(showtime: {movieId: number; fecha: string; hora: string; formato: string; idioma: string; precio: number;}){
        // 1. Buscamos duración de la película
        const { data: movie, error: movieError } = await supabase.from('movies').select('duracion').eq('id', showtime.movieId).single();

        if (movieError || !movie) {
        return {
            data: null,
            error: movieError ?? new Error('Película no encontrada')
        };
        }

        // 2. Buscamos salas activas
        const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*').eq('activa', true).order('id');

        if (roomsError || !rooms) { 
            return {data: null,error: roomsError ?? new Error('No se pudieron obtener las salas')};
        }

        // 3. Buscamos funciones del mismo día
        const { data: existingShowtimes, error: showtimesError } = await supabase.from('showtimes').select(`room_id,hora,movies (duracion)`).eq('fecha', showtime.fecha);

        if (showtimesError) {
            return {data: null,error: showtimesError};
        }

        // 4. Calculamos el horario de la nueva función
        const newStart = this.timeToMinutes(showtime.hora);
        const newEnd = newStart + movie.duracion + 30;

        // 5. Buscamos la primera sala disponible
        const availableRoom = rooms.find(room => {
        const roomShowtimes = existingShowtimes?.filter(existing => existing.room_id === room.id) ?? [];

        return roomShowtimes.every(existing => {
            const existingStart = this.timeToMinutes(existing.hora);
            const existingDuration = existing.movies?.[0]?.duracion ?? 0;
            const existingEnd = existingStart + existingDuration + 30;
            return (newEnd <= existingStart || newStart >= existingEnd);
            });
        });

        if (!availableRoom) {
            return {data: null,error: new Error('No hay salas disponibles para ese horario.')};
        }

        // 6. Creamos la función con la sala encontrada
        return supabase
        .from('showtimes')
        .insert({
            movie_id: showtime.movieId,
            room_id: availableRoom.id,
            fecha: showtime.fecha,
            hora: showtime.hora,
            formato: showtime.formato,
            idioma: showtime.idioma,
            precio: showtime.precio
        });
    }

    deleteShowtime(id: number) { return supabase.from('showtimes').delete().eq('id', id);}

    private timeToMinutes(time: string) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
}