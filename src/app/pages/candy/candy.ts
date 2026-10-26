import { Component, computed, inject, signal } from '@angular/core';
import { CandyService } from '../../services/candy.service';
import { CheckoutService } from '../../services/checkout.service';
import { PurchaseService } from '../../services/purchase.service';
import { Router } from '@angular/router';
import { ProfileStore } from '../../services/profile.store.service';


@Component({
  selector: 'app-candy',
  imports: [],
  templateUrl: './candy.html',
  styleUrl: './candy.css'
})
export class Candy {

  readonly candyService = inject(CandyService);
  readonly checkoutService = inject(CheckoutService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly router = inject(Router);
  private readonly profileStore = inject(ProfileStore);
  readonly purchasing = signal(false);

  readonly categories = signal<any[]>([]);
  readonly products = signal<any[]>([]);
  readonly combos = signal<any[]>([]);

  readonly selectedCategory = signal<number | null>(null);

  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly checkout = this.checkoutService.data;
  readonly couponCode = signal('');
  readonly couponMessage = signal('');
  readonly couponError = signal('');
  readonly appliedCoupon = signal<any>(null);

  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    if (category === null) return this.products();
    return this.products().filter(product =>
      product.category_id === category
    );
  });

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await Promise.all([this.loadCategories(),this.loadProducts(),this.loadCombos()]);
    this.loading.set(false);
  }

  private async loadCategories() {
    const { data, error } = await this.candyService.getCategories();
    if (error) {
      console.error('Error cargando categorías:', error);
      this.errorMessage.set('No se pudo cargar Candy.');
      return;
    }
    this.categories.set(data ?? []);
  }

  private async loadProducts() {
    const { data, error } = await this.candyService.getProducts();
    if (error) {
      console.error('Error cargando productos:', error);
      this.errorMessage.set('No se pudo cargar Candy.');
      return;
    }
    this.products.set(data ?? []);
  }

  private async loadCombos() {
    const { data, error } = await this.candyService.getCombos();

    if (error) {
      console.error('Error cargando combos:', error);
      this.errorMessage.set('No se pudieron cargar los combos.');
      return;
    }
    this.combos.set(data ?? []);
  }

  addProduct(product: any) {
    if (product.stock <= 0) return;
    this.candyService.addProduct(product);
  }

  addCombo(combo: any) {
    this.candyService.addCombo(combo);
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategory.set(categoryId);
  }

  async applyCoupon() {
    this.couponMessage.set('');
    this.couponError.set('');

    const code = this.couponCode().trim();

    if (!code) {
      this.couponError.set('Ingresá un código de cupón.');
      return;
    }

    const { data, error } = await this.candyService.validateCoupon(code);

    if (error || !data) {
      this.appliedCoupon.set(null);
      this.couponError.set('El cupón no existe o no está disponible.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (data.fecha_desde && today < data.fecha_desde) {
      this.couponError.set('El cupón todavía no está vigente.');
      return;
    }

    if (data.fecha_hasta && today > data.fecha_hasta) {
      this.couponError.set('El cupón está vencido.');
      return;
    }

    this.appliedCoupon.set(data);

    this.couponMessage.set(
      `Cupón aplicado: ${data.porcentaje}% de descuento.`
    );
  }

  async confirmPurchase() {
    const checkout = this.checkoutService.data();

    if (!checkout) {
      this.errorMessage.set('No hay una compra pendiente.');
      return;
    }

    this.errorMessage.set('');
    this.purchasing.set(true);

    const { data, error } = await this.purchaseService.createPurchase({
      showtimeId: checkout.showtimeId,
      seatIds: checkout.seatIds,
      email: checkout.email,
      birthDate: checkout.birthDate,
      ageNoticeAccepted: checkout.ageNoticeAccepted,
      useCredit: checkout.useCredit,
      candyItems: this.candyService.cart(),
      couponCode: this.appliedCoupon()?.codigo ?? null
    });

    this.purchasing.set(false);

    if (error) {
      console.error('Error confirmando compra:', error);
      this.errorMessage.set(error.message ?? 'No se pudo realizar la compra.');
      return;
    }

    this.checkoutService.clearCheckout();
    this.candyService.clearCart();

    await this.profileStore.loadProfile();

    await this.router.navigate(
      ['/purchase', data.purchase_id],
      {
        queryParams: data.ticket_code
          ? { token: data.ticket_code }
          : undefined
      }
    );
  }

}