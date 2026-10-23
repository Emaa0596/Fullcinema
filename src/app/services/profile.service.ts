import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { RegisteredUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  createProfile(userId: string, user: RegisteredUser) {

    const profile = {
      id: userId,
      nombre: user.nombre,
      apellido: user.apellido,
      nacimiento: user.nacimiento.toISOString().split('T')[0],
      rol: user.rol,
      tipo_de_sangre: user.tipoDeSangre ?? null,
      color_de_ojos: user.colorDeOjos ?? null,
      vacaciones: user.vacaciones ?? null
    };

    return supabase
      .from('profiles')
      .insert(profile);
  }

  getProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  }

  getLoyaltyTransactions(userId: string) {
    return supabase
      .from('loyalty_transactions')
      .select(`id,puntos,tipo,descripcion,created_at,purchase_id`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  getLoyaltyRewards() {
    return supabase
      .from('loyalty_rewards')
      .select(`id,nombre,descripcion,costo_puntos,credito_otorgado`)
      .eq('activo', true)
      .order('costo_puntos', { ascending: true });
  }

  redeemLoyaltyReward(rewardId: number) {
    return supabase.rpc('redeem_loyalty_reward', {
      p_reward_id: rewardId
    });
  }

}