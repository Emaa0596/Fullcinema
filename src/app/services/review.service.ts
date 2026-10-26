import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  createReview(movieId: number, rating: number, comment: string) {
    return supabase.rpc('create_movie_review', {
      p_movie_id: movieId,
      p_rating: rating,
      p_comment: comment
    });
  }

  getMyReviews(userId: string) {
    return supabase
      .from('reviews')
      .select(`id,movie_id,rating,comentario,created_at`)
      .eq('user_id', userId);
  }

  getMovieRating(movieId: number) {
  return supabase
    .from('movie_ratings')
    .select(`movie_id,promedio,cantidad_reviews`)
    .eq('movie_id', movieId)
    .single();
  }

  getTopMovies() {
    return supabase
      .from('movie_ratings')
      .select(`movie_id,nombre,imagen,promedio,cantidad_reviews`)
      .gte('cantidad_reviews', 3)
      .order('promedio', { ascending: false })
      .order('cantidad_reviews', { ascending: false })
      .limit(3);
  }

  getMovieRatings() {
    return supabase
      .from('movie_ratings')
      .select(`movie_id,promedio,cantidad_reviews`);
  }

  getMovieReviews(movieId: number) {
    return supabase
      .from('reviews')
      .select(`id,rating,comentario,created_at`)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });
  }

}