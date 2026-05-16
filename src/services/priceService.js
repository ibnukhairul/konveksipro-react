import { supabase } from './supabase'

// Cache per brand
let productsCache = {}
let fabricsCache = {}
let tiersCache = []
let addonsCache = []
let sizeAdjustmentsCache = {}

export async function loadPriceData(brand) {
  try {
    const [productsRes, fabricsRes, tiersRes, addonsRes, sizesRes] = await Promise.all([
      supabase.from('price_products').select('*').eq('brand', brand).eq('is_active', true).order('sort_order'),
      supabase.from('price_fabrics').select('*').eq('brand', brand).eq('is_active', true).order('sort_order'),
      supabase.from('price_tiers').select('*'),
      supabase.from('price_addons').select('*').eq('is_active', true),
      supabase.from('price_size_adjustments').select('*').eq('brand', brand).eq('is_active', true)
    ])

    if (productsRes.error) throw productsRes.error
    if (fabricsRes.error) throw fabricsRes.error
    if (tiersRes.error) throw tiersRes.error
    if (addonsRes.error) throw addonsRes.error
    if (sizesRes.error) throw sizesRes.error

    productsCache[brand] = productsRes.data || []
    fabricsCache[brand] = fabricsRes.data || []
    tiersCache = tiersRes.data || []
    addonsCache = addonsRes.data || []
    sizeAdjustmentsCache[brand] = sizesRes.data || []

    return {
      products: productsCache[brand],
      fabrics: fabricsCache[brand],
      tiers: tiersCache,
      addons: addonsCache,
      sizeAdjustments: sizeAdjustmentsCache[brand]
    }
  } catch (err) {
    console.error('Load price data error:', err)
    throw err
  }
}

export function getProductTypes(brand) {
  return productsCache[brand] || []
}

export function getFabrics(brand) {
  return fabricsCache[brand] || []
}

export function getTiersForProductAndFabric(productId, fabricId) {
  return tiersCache.filter(t => t.product_id === productId && t.fabric_id === fabricId)
    .sort((a, b) => a.min_qty - b.min_qty)
}

export function getAddonsForProduct(productId) {
  return addonsCache.filter(a => a.product_id === productId)
}

export function getSizeAdjustments(brand) {
  return sizeAdjustmentsCache[brand] || []
}
export function getTierList(productId, fabricId) {
  const tiers = getTiersForProductAndFabric(productId, fabricId)
  return tiers.map(t => ({
    min: t.min_qty,
    max: t.max_qty,
    price: t.price,
    isNegotiable: t.price === 0
  }))
}

export function getPriceInfo(productId, fabricId, quantity) {
  const tiers = getTiersForProductAndFabric(productId, fabricId)
  if (tiers.length === 0) return { price: 0, isNegotiable: true, tierLabel: null, isBelowMin: false, minQty: null }

  const minQty = tiers[0]?.min_qty || 0
  let selectedTier = null
  let isBelowMin = false

  if (quantity < minQty) {
    isBelowMin = true
    selectedTier = tiers[0]
  } else {
    for (const tier of tiers) {
      if (quantity >= tier.min_qty && (tier.max_qty === null || quantity <= tier.max_qty)) {
        selectedTier = tier
        break
      }
    }
    if (!selectedTier && tiers.length) selectedTier = tiers[tiers.length - 1]
  }

  const tierLabel = selectedTier ? `${selectedTier.min_qty}${selectedTier.max_qty ? '-' + selectedTier.max_qty : '+'} pcs` : null
  return {
    price: selectedTier?.price || 0,
    isNegotiable: selectedTier?.price === 0,
    tierLabel,
    isBelowMin,
    minQty
  }
}