import { supabase } from './supabase'

export const adminPriceService = {
  // ========== PRODUCTS ==========
  async getProducts(brand) {
    const { data, error } = await supabase
      .from('price_products')
      .select('*')
      .eq('brand', brand)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createProduct(payload) {
    const { data, error } = await supabase
      .from('price_products')
      .insert({
        brand: payload.brand,
        product_type: payload.product_type,
        category: payload.category,
        includes: payload.includes || '',
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateProduct(id, payload) {
    const { data, error } = await supabase
      .from('price_products')
      .update({
        product_type: payload.product_type,
        category: payload.category,
        includes: payload.includes || '',
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteProduct(id) {
    const { error } = await supabase.from('price_products').delete().eq('id', id)
    if (error) throw error
  },

  // ========== FABRICS ==========
  async getFabrics(brand) {
    const { data, error } = await supabase
      .from('price_fabrics')
      .select('*')
      .eq('brand', brand)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createFabric(payload) {
    const { data, error } = await supabase
      .from('price_fabrics')
      .insert({
        brand: payload.brand,
        fabric_name: payload.fabric_name,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateFabric(id, payload) {
    const { data, error } = await supabase
      .from('price_fabrics')
      .update({
        fabric_name: payload.fabric_name,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteFabric(id) {
    const { error } = await supabase.from('price_fabrics').delete().eq('id', id)
    if (error) throw error
  },

  // ========== TIERS ==========
  async getTiers() {
    const { data, error } = await supabase
      .from('price_tiers')
      .select('*, price_products(product_type), price_fabrics(fabric_name)')
      .order('min_qty', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createTier(payload) {
    const { data, error } = await supabase
      .from('price_tiers')
      .insert({
        product_id: payload.product_id,
        fabric_id: payload.fabric_id,
        min_qty: payload.min_qty,
        max_qty: payload.max_qty || null,
        price: payload.price,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateTier(id, payload) {
    const { data, error } = await supabase
      .from('price_tiers')
      .update({
        min_qty: payload.min_qty,
        max_qty: payload.max_qty || null,
        price: payload.price
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteTier(id) {
    const { error } = await supabase.from('price_tiers').delete().eq('id', id)
    if (error) throw error
  },

  // ========== ADDONS ==========
  async getAddons(productId = null) {
    let query = supabase.from('price_addons').select('*, price_products(product_type)').order('sort_order')
    if (productId) query = query.eq('product_id', productId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async createAddon(payload) {
    const { data, error } = await supabase
      .from('price_addons')
      .insert({
        product_id: payload.product_id,
        name: payload.name,
        price: payload.price,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateAddon(id, payload) {
    const { data, error } = await supabase
      .from('price_addons')
      .update({
        name: payload.name,
        price: payload.price,
        sort_order: payload.sort_order || 0,
        is_active: payload.is_active !== false
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteAddon(id) {
    const { error } = await supabase.from('price_addons').delete().eq('id', id)
    if (error) throw error
  },

  // ========== SIZE ADJUSTMENTS ==========
  async getSizeAdjustments(brand) {
    const { data, error } = await supabase
      .from('price_size_adjustments')
      .select('*')
      .eq('brand', brand)
      .order('size', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createSizeAdjustment(payload) {
    const { data, error } = await supabase
      .from('price_size_adjustments')
      .insert({
        brand: payload.brand,
        size: payload.size,
        additional_price: payload.additional_price,
        is_active: payload.is_active !== false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateSizeAdjustment(id, payload) {
    const { data, error } = await supabase
      .from('price_size_adjustments')
      .update({
        size: payload.size,
        additional_price: payload.additional_price,
        is_active: payload.is_active !== false
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteSizeAdjustment(id) {
    const { error } = await supabase.from('price_size_adjustments').delete().eq('id', id)
    if (error) throw error
  }
}