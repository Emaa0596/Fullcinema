import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  getActiveRooms() {
    return supabase
      .from('rooms')
      .select('*')
      .eq('activa', true)
      .order('id', { ascending: true });
  }
}