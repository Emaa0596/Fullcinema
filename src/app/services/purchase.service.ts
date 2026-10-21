import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { PurchaseRequest } from '../models/purchase.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  createPurchase(purchase: PurchaseRequest) {
    return supabase.rpc('create_purchase', {
      p_showtime_id: purchase.showtimeId,
      p_seat_ids: purchase.seatIds,
      p_email: purchase.email,
      p_birth_date: purchase.birthDate,
      p_age_notice_accepted: purchase.ageNoticeAccepted
    });
  }

  getPurchaseById(purchaseId: number) {
  return supabase.from('purchases').select(`id, subtotal, descuento, total, status, email, created_at,
      showtimes (id, fecha, hora, formato, idioma, precio,
        movies (id, nombre, imagen),
        rooms (id, nombre)),
        showtime_seats (seat_id, status,
        seats (id, fila, numero, tipo)),
        tickets (id, code, status, used_at)`)
    .eq('id', purchaseId)
    .single();
  }

  getGuestPurchase(purchaseId: number, ticketCode: string) {
    return supabase.rpc('get_guest_purchase', {
      p_purchase_id: purchaseId,
      p_ticket_code: ticketCode
    });
  }

}