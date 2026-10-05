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
}