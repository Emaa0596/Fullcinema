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
      p_age_notice_accepted: purchase.ageNoticeAccepted,
      p_use_credit: purchase.useCredit,
      p_candy_items: purchase.candyItems,
      p_coupon_code: purchase.couponCode
    });
  }

  getPurchaseById(purchaseId: number) {
    return supabase
      .from('purchases')
      .select(`id,subtotal,descuento,descuento_cupon,coupon_id,credito_usado,puntos_generados,total,status,email,created_at,
        showtimes (id,fecha,hora,formato,idioma,precio,
        movies (id,nombre,imagen),
        rooms (id,nombre)),
        showtime_seats (seat_id,
        seats (id,fila,numero,tipo)),
        tickets (id,code,status,used_at),
        purchase_candy_items (id,item_type,item_id,nombre,precio_unitario,cantidad,subtotal)`)
      .eq('id', purchaseId)
      .single();
  }

  getGuestPurchase(purchaseId: number, ticketCode: string) {
    return supabase.rpc('get_guest_purchase', {
      p_purchase_id: purchaseId,
      p_ticket_code: ticketCode
    });
  }

  cancelPurchase(purchaseId: number) {
    return supabase.rpc('cancel_purchase', {
      p_purchase_id: purchaseId});
  }

  getMyPurchases() {
    return supabase
      .from('purchases')
      .select(`id,subtotal,descuento,credito_usado,total,status,created_at,
        showtimes (id,fecha,hora,formato,idioma,
        movies (id,nombre,imagen,duracion),
        rooms (id,nombre)))`).order('created_at', { ascending: false });
  }

  getMyMovies() {
    return supabase
      .from('purchases')
      .select(`id,status,created_at,showtimes (fecha,hora,movies (id,nombre,imagen)),tickets (status,used_at)`)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });
  }

  getVipSurcharge() {
    return supabase.from('settings').select('value').eq('key','vip_surcharge').single();
  }

}