import { Injectable, computed, signal } from '@angular/core';
import { supabase } from '../supabase.client';

export interface CandyCartItem {
  id: number;
  type: 'product' | 'combo';
  nombre: string;
  precio: number;
  cantidad: number;
}

@Injectable({providedIn: 'root'})
export class CandyService {

  readonly cart = signal<CandyCartItem[]>([]);

  readonly cartQuantity = computed(() =>
    this.cart().reduce((total, item) => total + item.cantidad, 0)
  );

  readonly cartTotal = computed(() =>
    this.cart().reduce((total, item) => total + item.precio * item.cantidad, 0)
  );

  getCategories() {
    return supabase
      .from('product_categories')
      .select(`id,nombre`)
      .eq('activo', true)
      .order('nombre');
  }

  getProducts() {
    return supabase
      .from('products')
      .select(`id,category_id,nombre,descripcion,imagen,precio,stock`)
      .eq('activo', true)
      .order('nombre');
  }

  getAllProductsAdmin() {
    return supabase
      .from('products')
      .select(`id,category_id,nombre,descripcion,imagen,precio,stock,activo`)
      .order('nombre');
  }

  setProductActive(id: number, activo: boolean) {
    return supabase
      .from('products')
      .update({ activo })
      .eq('id', id);
  }

  getCombos() {
    return supabase
      .from('combos')
      .select(`id,nombre,descripcion,imagen,precio,combo_products (cantidad,products (id,nombre))`)
      .eq('activo', true)
      .order('nombre');
  }

  addProduct(product: any) {
    this.addItem({
      id: product.id,
      type: 'product',
      nombre: product.nombre,
      precio: Number(product.precio),
      cantidad: 1
    });
  }

  addCombo(combo: any) {
    this.addItem({
      id: combo.id,
      type: 'combo',
      nombre: combo.nombre,
      precio: Number(combo.precio),
      cantidad: 1
    });
  }

  private addItem(newItem: CandyCartItem) {
    const existing = this.cart().find(item =>item.id === newItem.id && item.type === newItem.type);

    if (existing) {this.cart.update(items =>
        items.map(item => item.id === newItem.id && item.type === newItem.type 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item));
      return;
    }
    this.cart.update(items => [...items, newItem]);
  }

  increase(item: CandyCartItem) {
    this.cart.update(items => items.map(current => current.id === item.id && current.type === item.type
          ? { ...current, cantidad: current.cantidad + 1 }
          : current
      )
    );
  }

  decrease(item: CandyCartItem) {
    if (item.cantidad <= 1) {
      this.remove(item);
      return;
    }

    this.cart.update(items =>
      items.map(current =>
        current.id === item.id && current.type === item.type
          ? { ...current, cantidad: current.cantidad - 1 }
          : current
      )
    );
  }

  remove(item: CandyCartItem) {
    this.cart.update(items =>
      items.filter(current =>
        !(current.id === item.id && current.type === item.type)
      )
    );
  }

  clearCart() {
    this.cart.set([]);
  }

  validateCoupon(code: string) {
    return supabase
      .from('coupons')
      .select(`id,codigo,descripcion,porcentaje,fecha_desde,fecha_hasta`)
      .eq('codigo', code.trim().toUpperCase())
      .eq('activo', true)
      .maybeSingle();
  }

  createProduct(product: any) {
  return supabase.from('products').insert(product).select().single();
  }

  updateProduct(id: number, product: any) {
    return supabase.from('products').update(product).eq('id', id).select().single();
  }

  deleteProduct(id: number) {
    return supabase.from('products').update({ activo: false }).eq('id', id);
  }

  createCombo(combo: any) {
    return supabase.from('combos').insert(combo).select().single();
  }

  updateCombo(id: number, combo: any) {
    return supabase.from('combos').update(combo).eq('id', id).select().single();
  }

  deleteCombo(id: number) {
    return supabase.from('combos').update({ activo: false }).eq('id', id);
  }

  createCoupon(coupon: any) {
    return supabase.from('coupons').insert(coupon).select().single();
  }

  updateCoupon(id: number, coupon: any) {
    return supabase.from('coupons').update(coupon).eq('id', id).select().single();
  }

  deleteCoupon(id: number) {
    return supabase.from('coupons').update({ activo: false }).eq('id', id);
  }

  getCoupons() {
    return supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
  }


  getAllCategoriesAdmin() {
    return supabase
      .from('product_categories')
      .select('*')
      .order('nombre');
  }

  createCategory(category: any) {
    return supabase
      .from('product_categories')
      .insert(category)
      .select()
      .single();
  }

  updateCategory(id: number, category: any) {
    return supabase
      .from('product_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
  }

  setCategoryActive(id: number, activo: boolean) {
    return supabase
      .from('product_categories')
      .update({ activo })
      .eq('id', id);
  }


  getAllCouponsAdmin() {
    return supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
  }

  setCouponActive(id: number, activo: boolean) {
    return supabase
      .from('coupons')
      .update({ activo })
      .eq('id', id);
  }

  replaceComboProducts(comboId: number, products: { product_id: number; cantidad: number }[]) {
    return this.replaceComboProductsInternal(comboId, products);
  }

  private async replaceComboProductsInternal(comboId: number,products: { product_id: number; cantidad: number }[]) {
      const { error: deleteError } = await supabase
        .from('combo_products')
        .delete()
        .eq('combo_id', comboId);

      if (deleteError) {
        return { data: null, error: deleteError };
      }

      const rows = products.map(product => ({
        combo_id: comboId,
        product_id: product.product_id,
        cantidad: product.cantidad
      }));

      return supabase
        .from('combo_products')
        .insert(rows);
  }

  setComboActive(id: number, activo: boolean) {
    return supabase
      .from('combos')
      .update({ activo })
      .eq('id', id);
  }

  getAllCombosAdmin() {
    return supabase
      .from('combos')
      .select(`id,nombre,descripcion,imagen,precio,activo,combo_products (cantidad,products (id,nombre))`)
      .order('nombre');
  }

  getSettings() {
    return supabase
      .from('settings')
      .select('key,value');
  }

  updateSetting(key: string, value: number) {
    return supabase
      .from('settings')
      .update({ value })
      .eq('key', key)
      .select()
      .single();
  }

  getAllRewards() {
    return supabase
      .from('loyalty_rewards')
      .select('id,nombre,descripcion,costo_puntos,credito_otorgado,activo')
      .order('nombre');
  }

  updateRewardCost(id: number, costoPuntos: number) {
    return supabase
      .from('loyalty_rewards')
      .update({ costo_puntos: costoPuntos })
      .eq('id', id)
      .select()
      .single();
  }

}