import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PurchaseDetail } from './purchase-detail';

describe('PurchaseDetail', () => {
  let component: PurchaseDetail;
  let fixture: ComponentFixture<PurchaseDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
