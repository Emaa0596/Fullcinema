import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({ providedIn:'root' })
export class ReportService {

    getDailyRevenue() {
        return supabase.rpc('get_daily_revenue');
    }

    getDailyTickets() {
        return supabase.rpc('get_daily_tickets');
    }

    getTopMovies(days: number) {
        return supabase.rpc('get_top_movies_period',{ p_days:days });
    }

    getTopCandy() {
        return supabase.rpc('get_top_candy');
    }
}