import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class MovieService {

  getMovies() {
    return supabase
      .from('movies')
      .select('*')
      .order('id', { ascending: true });
  }

  createMovie(movie: {
    nombre: string;
    imagen: string;
    duracion: number;
    sinopsis: string;
    generos: string[];
    edad_minima: number;
  }) {
    return supabase
      .from('movies')
      .insert(movie);
  }

  updateMovie(id: number, movie: {
    nombre: string;
    imagen: string;
    duracion: number;
    sinopsis: string;
    generos: string[];
    edad_minima: number;
  }) {
    return supabase
      .from('movies')
      .update(movie)
      .eq('id', id);
  }

  deleteMovie(id: number) {
    return supabase
      .from('movies')
      .delete()
      .eq('id', id);
  }
}