import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  validateTicket(code: string) {
    return supabase.rpc('validate_ticket', { p_code: code});
  }
}