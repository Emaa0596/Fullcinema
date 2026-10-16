import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieShowtimes } from './movie-showtimes';

describe('MovieShowtimes', () => {
  let component: MovieShowtimes;
  let fixture: ComponentFixture<MovieShowtimes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieShowtimes],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieShowtimes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
