import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CandyService } from '../../services/candy.service';

@Component({
  selector: 'app-admin-candy',
  imports: [FormsModule],
  templateUrl: './admin-candy.html',
  styleUrl: './admin-candy.css'
})
export class AdminCandy {

  private readonly candyService = inject(CandyService);

  readonly products = signal<any[]>([]);
  readonly categories = signal<any[]>([]);
  readonly combos = signal<any[]>([]);
  readonly coupons = signal<any[]>([]);
  readonly comboProductQuantities = signal<Record<number, number>>({});

  readonly section = signal< 'products' |'categories' | 'combos' | 'coupons' | 'settings' | 'rewards' >('products');
  readonly rewards = signal<any[]>([]);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  firstPurchaseDiscount = 20;
  pointsPerPeso = 1;
  

  productForm = {
    id: null as number | null,
    category_id: null as number | null,
    nombre: '',
    descripcion: '',
    imagen: '',
    precio: 0,
    stock: 0
  };

  comboForm = {
    id: null as number | null,
    nombre: '',
    descripcion: '',
    imagen: '',
    precio: 0
  };

  couponForm = {
    id: null as number | null,
    codigo: '',
    descripcion: '',
    porcentaje: 0,
    fecha_desde: '',
    fecha_hasta: ''
  };

  categoryForm = {
    id: null as number | null,
    nombre: ''
  };

  constructor() {
    this.loadData();
  }

  async saveCoupon() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.couponForm.codigo.trim()) {
      this.errorMessage.set('Ingresá un código.');
      return;
    }

    if (this.couponForm.porcentaje <= 0 || this.couponForm.porcentaje > 100) {
      this.errorMessage.set('El porcentaje debe estar entre 1 y 100.');
      return;
    }

    const payload = {
      codigo: this.couponForm.codigo.trim().toUpperCase(),
      descripcion: this.couponForm.descripcion.trim() || null,
      porcentaje: this.couponForm.porcentaje,
      fecha_desde: this.couponForm.fecha_desde || null,
      fecha_hasta: this.couponForm.fecha_hasta || null,
    };

    const result = this.couponForm.id
      ? await this.candyService.updateCoupon(this.couponForm.id, payload)
      : await this.candyService.createCoupon(payload);

    if (result.error) {
      this.errorMessage.set(result.error.message);
      return;
    }

    this.successMessage.set(
      this.couponForm.id
        ? 'Cupón actualizado.'
        : 'Cupón creado.'
    );

    this.resetCouponForm();
    await this.loadData();
  }

  editCoupon(coupon: any) {
    this.couponForm = {
      id: coupon.id,
      codigo: coupon.codigo,
      descripcion: coupon.descripcion ?? '',
      porcentaje: coupon.porcentaje,
      fecha_desde: coupon.fecha_desde ?? '',
      fecha_hasta: coupon.fecha_hasta ?? ''
    };
  }

  resetCouponForm() {
    this.couponForm = {
      id: null,
      codigo: '',
      descripcion: '',
      porcentaje: 0,
      fecha_desde: '',
      fecha_hasta: ''
    };
  }

  async toggleCoupon(coupon: any) {
    this.errorMessage.set('');
    this.successMessage.set('');

    const { error } = await this.candyService.setCouponActive(
      coupon.id,
      !coupon.activo
    );

    if (error) {
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set(
      coupon.activo
        ? 'Cupón desactivado.'
        : 'Cupón activado.'
    );

    await this.loadData();
  }

  private async loadData() {
    const [categoriesResult,productsResult,combosResult,couponsResult, settingsResult, rewardsResult] = await Promise.all([
      this.candyService.getAllCategoriesAdmin(),
      this.candyService.getAllProductsAdmin(),
      this.candyService.getAllCombosAdmin(),
      this.candyService.getAllCouponsAdmin(),
      this.candyService.getSettings(),
      this.candyService.getAllRewards()
    ]);

    this.categories.set(categoriesResult.data ?? []);
    this.products.set(productsResult.data ?? []);
    this.combos.set(combosResult.data ?? []);
    this.coupons.set(couponsResult.data ?? []);
    this.rewards.set(rewardsResult.data ?? []);
    for (const setting of settingsResult.data ?? []) {
      if (setting.key === 'first_purchase_discount') this.firstPurchaseDiscount = Number(setting.value);
      if (setting.key === 'points_per_peso') this.pointsPerPeso = Number(setting.value);
    }
    
  }

  async saveProduct() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.productForm.nombre.trim() || !this.productForm.category_id) {
      this.errorMessage.set('Completá nombre y categoría.');
      return;
    }

    const payload = {
      category_id: this.productForm.category_id,
      nombre: this.productForm.nombre.trim(),
      descripcion: this.productForm.descripcion.trim() || null,
      imagen: this.productForm.imagen.trim() || null,
      precio: this.productForm.precio,
      stock: this.productForm.stock,
    };

    const result = this.productForm.id
      ? await this.candyService.updateProduct(this.productForm.id, payload)
      : await this.candyService.createProduct(payload);

    if (result.error) {
      this.errorMessage.set(result.error.message);
      return;
    }

    this.successMessage.set(
      this.productForm.id
        ? 'Producto actualizado.'
        : 'Producto creado.'
    );

    this.resetProductForm();
    await this.loadData();
  }

  async saveCategory() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.categoryForm.nombre.trim()) {
      this.errorMessage.set('Ingresá el nombre de la categoría.');
      return;
    }

    const payload = {
      nombre: this.categoryForm.nombre.trim(),

    };

    const result = this.categoryForm.id
      ? await this.candyService.updateCategory(this.categoryForm.id, payload)
      : await this.candyService.createCategory(payload);

    if (result.error) {
      this.errorMessage.set(result.error.message);
      return;
    }

    this.successMessage.set(
      this.categoryForm.id
        ? 'Categoría actualizada.'
        : 'Categoría creada.'
    );

    this.resetCategoryForm();
    await this.loadData();
  }

  editCategory(category: any) {
    this.categoryForm = {
      id: category.id,
      nombre: category.nombre
    };
  }

  resetCategoryForm() {
    this.categoryForm = {
      id: null,
      nombre: ''
    };
  }

  async toggleCategory(category: any) {
    this.errorMessage.set('');
    this.successMessage.set('');

    const { error } = await this.candyService.setCategoryActive(
      category.id,
      !category.activo
    );

    if (error) {
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set(
      category.activo
        ? 'Categoría desactivada.'
        : 'Categoría activada.'
    );

    await this.loadData();
  }

  editProduct(product: any) {
    this.productForm = {
      id: product.id,
      category_id: product.category_id,
      nombre: product.nombre,
      descripcion: product.descripcion ?? '',
      imagen: product.imagen ?? '',
      precio: product.precio,
      stock: product.stock
    };
  }

  async toggleProduct(product: any) {
    this.errorMessage.set('');
    this.successMessage.set('');
    const { error } = await this.candyService.setProductActive(
      product.id,
      !product.activo
    );

    if (error) {
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set(
      product.activo
        ? 'Producto desactivado correctamente.'
        : 'Producto activado correctamente.'
    );
    await this.loadData();
  }

  resetProductForm() {
    this.productForm = {
      id: null,
      category_id: null,
      nombre: '',
      descripcion: '',
      imagen: '',
      precio: 0,
      stock: 0
    };
  }

  async saveCombo() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.comboForm.nombre.trim()) {
      this.errorMessage.set('Ingresá el nombre del combo.');
      return;
    }

    if (this.comboForm.precio <= 0) {
      this.errorMessage.set('Ingresá un precio válido.');
      return;
    }

    const selectedProducts = Object.entries(this.comboProductQuantities())
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([productId, cantidad]) => ({
        product_id: Number(productId),
        cantidad
      }));

    if (selectedProducts.length === 0) {
      this.errorMessage.set('El combo debe incluir al menos un producto.');
      return;
    }

    const payload = {
      nombre: this.comboForm.nombre.trim(),
      descripcion: this.comboForm.descripcion.trim() || null,
      imagen: this.comboForm.imagen.trim() || null,
      precio: this.comboForm.precio,
    };

    let comboId: number;

    if (this.comboForm.id) {
      const { data, error } = await this.candyService.updateCombo(this.comboForm.id, payload);

      if (error || !data) {
        this.errorMessage.set(error?.message ?? 'No se pudo actualizar el combo.');
        return;
      }

      comboId = data.id;
    } else {
      const { data, error } = await this.candyService.createCombo(payload);

      if (error || !data) {
        this.errorMessage.set(error?.message ?? 'No se pudo crear el combo.');
        return;
      }

      comboId = data.id;
    }

    const { error: productsError } = await this.candyService.replaceComboProducts(comboId, selectedProducts);

    if (productsError) {
      this.errorMessage.set(productsError.message);
      return;
    }

    this.successMessage.set(
      this.comboForm.id
        ? 'Combo actualizado correctamente.'
        : 'Combo creado correctamente.'
    );

    this.resetComboForm();
    await this.loadData();
  }

  getComboProductQuantity(productId: number) {
    return this.comboProductQuantities()[productId] ?? 0;
  }

  setComboProductQuantity(productId: number, quantity: number) {
    this.comboProductQuantities.update(current => ({...current,[productId]: Math.max(0, quantity || 0)}));
  }

  editCombo(combo: any) {
    this.comboForm = {
      id: combo.id,
      nombre: combo.nombre,
      descripcion: combo.descripcion ?? '',
      imagen: combo.imagen ?? '',
      precio: combo.precio
    };

    const quantities: Record<number, number> = {};

    for (const item of combo.combo_products ?? []) {
      if (item.products?.id) {
        quantities[item.products.id] = item.cantidad;
      }
    }

    this.comboProductQuantities.set(quantities);
  }

  resetComboForm() {
    this.comboForm = {
      id: null,
      nombre: '',
      descripcion: '',
      imagen: '',
      precio: 0
    };

    this.comboProductQuantities.set({});
  }

  async toggleCombo(combo: any) {
    this.errorMessage.set('');
    this.successMessage.set('');

    const { error } = await this.candyService.setComboActive(
      combo.id,
      !combo.activo
    );

    if (error) {
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set(
      combo.activo
        ? 'Combo desactivado correctamente.'
        : 'Combo activado correctamente.'
    );

    await this.loadData();
  }

  async saveSettings() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const [discountResult, pointsResult] = await Promise.all([
      this.candyService.updateSetting('first_purchase_discount', this.firstPurchaseDiscount),
      this.candyService.updateSetting('points_per_peso', this.pointsPerPeso)
    ]);

    if (discountResult.error || pointsResult.error) {
      this.errorMessage.set(
        discountResult.error?.message ??
        pointsResult.error?.message ??
        'No se pudo guardar la configuración.'
      );
      return;
    }

    this.successMessage.set('Configuración actualizada correctamente.');
  }

  async updateRewardCost(reward: any) {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (reward.costo_puntos <= 0) {
      this.errorMessage.set('El costo en puntos debe ser mayor a 0.');
      return;
    }

    const { error } = await this.candyService.updateRewardCost(
      reward.id,
      reward.costo_puntos
    );

    if (error) {
      this.errorMessage.set(error.message);
      return;
    }

    this.successMessage.set('Costo de recompensa actualizado correctamente.');
  }

}