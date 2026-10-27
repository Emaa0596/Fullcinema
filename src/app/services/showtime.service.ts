import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
    providedIn: 'root'
})
export class ShowtimeService {

    private getToday() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getShowtimes() {
        return supabase
            .from('showtimes')
            .select(`*,movies (id, nombre,duracion),rooms (id,nombre)`).gte('fecha', this.getToday()).order('fecha', { ascending: true }).order('hora', { ascending: true });
    }

    getShowtimesByMovie(movieId: number) {
        return supabase
            .from('showtimes')
            .select(`id,movie_id,room_id,fecha,hora,formato,idioma,precio,movies (fecha_estreno,preventa_habilitada,precio_preventa)`)
            .eq('movie_id', movieId);
    }

    async createShowtime(showtime: { movieId: number; fecha: string; hora: string; formato: string; idioma: string; }) {
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
            return { data: null, error: roomsError ?? new Error('No se pudieron obtener las salas') };
        }

        // 3. Buscamos funciones del mismo día
        const { data: existingShowtimes, error: showtimesError } = await supabase.from('showtimes').select(`room_id,hora,movies (duracion)`).eq('fecha', showtime.fecha);

        if (showtimesError) {
            return { data: null, error: showtimesError };
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
            return { data: null, error: new Error('No hay salas disponibles para ese horario.') };
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
            });
    }

    deleteShowtime(id: number) { return supabase.from('showtimes').delete().eq('id', id); }

    private timeToMinutes(time: string) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    private isPresaleActive(movie: any) {
        if (!movie?.fecha_estreno || !movie?.preventa_habilitada) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const releaseDate = new Date(`${movie.fecha_estreno}T00:00:00`);
        const presaleStart = new Date(releaseDate);
        presaleStart.setDate(presaleStart.getDate() - 7);

        return today >= presaleStart && today < releaseDate;
    }

    getTicketPrices() {
        return supabase.from('ticket_prices').select('*').order('formato');
    }

    updateTicketPrice(formato: string, precioNormal: number, precioPreventa: number) {
        return supabase.rpc('update_ticket_price', {
            p_formato: formato,
            p_precio_normal: precioNormal,
            p_precio_preventa: precioPreventa
        });
    }

}