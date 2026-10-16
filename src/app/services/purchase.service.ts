import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { PurchaseRequest } from '../models/purchase.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  createPurchase(purchase: PurchaseRequest) { return supabase.rpc('create_purchase',
      {
        p_showtime_id: purchase.showtimeId,
        p_seat_ids: purchase.seatIds,
        p_email: purchase.email
      }
    );
  }
}