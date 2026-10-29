import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({ providedIn:'root' })
export class ActivityLogService {
    getLogs() {
        return supabase.from('activity_logs')
            .select(`id,action,entity,entity_id,detail,created_at,user_id,profiles(nombre,apellido)`)
            .order('created_at',{ ascending:false });
    }
}