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

}