import { useState, useEffect } from 'react'
import { getPriceInfo, getAddonsForProduct, getTierList } from '../../services/priceService'
import { useToast } from '../../hooks/useToast'

export default function QuantityModal({
  isOpen,
  onClose,
  productId,
  fabricId,
  fabricName,
  productName,
  includes,
  brand,
  sizeAdjustments,
  onAddToCart
}) {
  const toast = useToast()
  const [sizes, setSizes] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])
  const [priceInfo, setPriceInfo] = useState({ price: 0, isNegotiable: false, tierLabel: null, minQty: null })
  const [customPrice, setCustomPrice] = useState('')
  const [tierList, setTierList] = useState([])

  useEffect(() => {
    const defaultSizes = {}
    sizeAdjustments.forEach(s => { defaultSizes[s.size] = 0 })
    setSizes(defaultSizes)
  }, [sizeAdjustments])

  useEffect(() => {
    if (productId && fabricId) {
      const tiers = getTierList(productId, fabricId)
      setTierList(tiers)
    }
  }, [productId, fabricId])

  const totalQuantity = Object.values(sizes).reduce((a, b) => a + b, 0)

  useEffect(() => {
    if (productId && fabricId) {
      const info = getPriceInfo(productId, fabricId, totalQuantity)
      setPriceInfo(info)
    }
  }, [productId, fabricId, totalQuantity])

  const handleSizeChange = (size, value) => {
    setSizes(prev => ({ ...prev, [size]: parseInt(value) || 0 }))
  }

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    )
  }

  // 🔥 Hitung harga per pcs setelah addons
  const calculatePricePerUnitWithAddons = () => {
    let pricePerUnit = priceInfo.price
    if (customPrice && !isNaN(parseInt(customPrice))) {
      pricePerUnit = parseInt(customPrice)
    }
    
    const addonsList = getAddonsForProduct(productId)
    let addonCostPerPcs = 0
    for (const addonId of selectedAddons) {
      const addon = addonsList.find(a => a.id === addonId)
      if (addon) addonCostPerPcs += addon.price
    }
    
    return pricePerUnit + addonCostPerPcs
  }

  // 🔥 Hitung subtotal
  const calculateSubtotal = () => {
    const pricePerUnitWithAddons = calculatePricePerUnitWithAddons()
    let total = 0
    for (const [size, qty] of Object.entries(sizes)) {
      if (qty > 0) {
        const adjust = sizeAdjustments.find(s => s.size === size)?.additional_price || 0
        total += (pricePerUnitWithAddons + adjust) * qty
      }
    }
    return total
  }

  const handleSubmit = () => {
    if (totalQuantity === 0) {
      toast.warning('Minimal 1 pcs')
      return
    }
    
    const addonsList = getAddonsForProduct(productId)
    const selectedAddonDetails = selectedAddons.map(id => {
      const a = addonsList.find(a => a.id === id)
      return { ...a, pricePerPcs: a.price }
    })
    const pricePerUnit = (customPrice && !isNaN(parseInt(customPrice))) ? parseInt(customPrice) : priceInfo.price

    const item = {
      id: Date.now(),
      productId,
      fabricId,
      productName,
      fabricName,
      includes,
      pricePerUnit,
      isNegotiable: priceInfo.isNegotiable,
      customPrice: customPrice ? parseInt(customPrice) : null,
      quantity: totalQuantity,
      quantities: { ...sizes },
      addons: selectedAddonDetails,
      sizeAdjustments: [...sizeAdjustments],
      tierLabel: priceInfo.tierLabel
    }
    onAddToCart(item)
    onClose()
  }

  if (!isOpen) return null

  const addons = getAddonsForProduct(productId)
  const subtotal = calculateSubtotal()
  const pricePerUnitWithAddons = calculatePricePerUnitWithAddons()
  const canNegotiate = priceInfo.isNegotiable || (priceInfo.minQty && totalQuantity < priceInfo.minQty)

  return (
    <div className="kpro-modal-overlay is-open" style={{ zIndex: 1000 }}>
      <div className="kpro-modal" style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="kpro-modal-header">
          <h3 className="kpro-modal-title">Detail Pesanan</h3>
          <button className="kpro-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="kpro-modal-body">
          <div style={{ background: '#F1F5F9', padding: '14px', borderRadius: '14px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700 }}>{productName} + {fabricName}</div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>{includes}</div>
          </div>

          {/* TAMPILAN TIER HARGA */}
          {tierList.length > 0 && (
            <div className="tier-list" style={{ marginBottom: '16px', background: '#F8FAFC', borderRadius: '12px', padding: '12px' }}>
              <div className="tier-list-title" style={{ fontWeight: 600, marginBottom: '8px' }}>Harga Berdasarkan Quantity</div>
              {tierList.map((tier, idx) => {
                const isActive = (totalQuantity >= tier.min && (tier.max === null || totalQuantity <= tier.max)) ||
                                 (priceInfo.tierLabel && priceInfo.tierLabel.includes(tier.min))
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', background: isActive ? '#DBEAFE' : 'transparent', borderRadius: '6px', paddingLeft: '8px', paddingRight: '8px' }}>
                    <span>{tier.min}{tier.max ? '-' + tier.max : '+'} pcs</span>
                    <span>{tier.isNegotiable ? 'NEGOTIABLE' : `Rp ${tier.price.toLocaleString('id-ID')}`}</span>
                  </div>
                )
              })}
              {priceInfo.minQty && totalQuantity < priceInfo.minQty && (
                <div style={{ marginTop: '8px', color: '#D97706', fontSize: '12px' }}>
                  Minimal order: {priceInfo.minQty} pcs
                </div>
              )}
            </div>
          )}
           {canNegotiate && (
            <div className="kpro-form-group" style={{ marginTop: '12px' }}>
              <label className="kpro-label">Harga Negosiasi (per pcs)</label>
              <input
                type="text"
                className="kpro-input"
                placeholder="Masukkan harga kesepakatan"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          )}
          
          {addons.length > 0 && (
            <div className="kpro-form-group">
              <label className="kpro-label">Tambahan (Opsional) - <span style={{ fontSize: '12px' }}>dikenakan per pcs</span></label>
              <div className="pl-addons">
                {addons.map(addon => (
                  <div
                    key={addon.id}
                    className={`pl-addon ${selectedAddons.includes(addon.id) ? 'selected' : ''}`}
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <span>{addon.name}</span>
                    <span className="pl-addon-price">+Rp {addon.price.toLocaleString('id-ID')}/pcs</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Addons dikenakan per pcs (dikalikan dengan total quantity)
              </div>
            </div>
          )}

         

          {/* 🔥 HARGA PER PCS SETELAH ADDONS */}
          <div style={{ 
            background: '#F0FDF4', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #BBF7D0'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#166534' }}>
              Harga per pcs (setelah addons):
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>
              {formatRupiah(pricePerUnitWithAddons)}
            </span>
          </div>

          <div className="kpro-form-group">
            <label className="kpro-label">Detail Ukuran (isi jumlah per ukuran)</label>
            <div className="pl-sizes">
              {sizeAdjustments.map(s => (
                <div key={s.size} className="pl-size">
                  <span className="pl-size-label">{s.size}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    min="0"
                    value={sizes[s.size] || 0}
                    onChange={(e) => handleSizeChange(s.size, e.target.value)}
                    className="pl-size-input"
                  />
                  <span className="pl-size-price">Rp {s.additional_price.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
             <div className="total-qty-display" style={{ background: '#EFF6FF', padding: '8px', borderRadius: '8px', textAlign: 'center', marginBottom: '16px' }}>
            Total Quantity: <strong>{totalQuantity}</strong> pcs
          </div>
          </div>

         

         

          

          <div className="pl-subtotal" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '18px', marginTop: '16px' }}>
             Subtotal: <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="kpro-modal-footer">
          <button className="kpro-btn kpro-btn-secondary" onClick={onClose}>Batal</button>
          <button className="kpro-btn kpro-btn-primary" onClick={handleSubmit}>Tambah ke Keranjang</button>
        </div>
      </div>
    </div>
  )
}

// Helper format rupiah di dalam komponen
const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`