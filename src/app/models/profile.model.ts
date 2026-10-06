import { Role } from './role.model';

export interface ProfileData {
  id: string;
  nombre: string;
  apellido: string;
  nacimiento: string;
  tipo_de_sangre: string | null;
  color_de_ojos: string | null;
  vacaciones: number | null;
  rol: Role;
  puntos: number;
  credito: number;
}