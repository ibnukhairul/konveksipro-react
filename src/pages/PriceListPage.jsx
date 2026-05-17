import { useState } from 'react'
import { usePriceData } from '../hooks/usePriceData'
import ProductTypeSelector from '../components/price-list/ProductTypeSelector'
import FabricSelector from '../components/price-list/FabricSelector'
import Cart from '../components/price-list/Cart'
import QuantityModal from '../components/price-list/QuantityModal'

export default function PriceListPage() {
  const { brand, loading, error, products, fabrics, sizeAdjustments, switchBrand } = usePriceData('SERAGAMAN')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [selectedProductName, setSelectedProductName] = useState('')
  const [selectedProductIncludes, setSelectedProductIncludes] = useState('')
  const [cart, setCart] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFabric, setSelectedFabric] = useState({ id: null, name: '' })

  const handleSelectProduct = (productId, productName, includes) => {
    setSelectedProductId(productId)
    setSelectedProductName(productName)
    setSelectedProductIncludes(includes)
  }

  const handleSelectFabric = (fabricId, fabricName) => {
    setSelectedFabric({ id: fabricId, name: fabricName })
    setModalOpen(true)
  }

  const handleAddToCart = (item) => {
    setCart(prev => [...prev, item])
  }

  const handleRemoveItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const handleClearCart = () => {
    if (cart.length && confirm('Kosongkan keranjang?')) setCart([])
  }

  const generateWhatsAppText = () => {
    if (cart.length === 0) return null
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    let text = `*📋 ORDER - ${brand}*\n📅 ${date}\n\n─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n*DETAIL PESANAN*\n─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n\n`
    let grandTotal = 0
    cart.forEach((item, idx) => {
      let itemTotal = 0
      for (const [size, qty] of Object.entries(item.quantities)) {
        if (qty > 0) {
          const adjust = sizeAdjustments.find(s => s.size === size)?.additional_price || 0
          itemTotal += (item.pricePerUnit + adjust) * qty
        }
      }
      for (const addon of item.addons) {
  itemTotal += (addon.price || addon.pricePerPcs) * totalQty
}
      grandTotal += itemTotal
      text += `*${idx+1}. ${item.productName} + ${item.fabricName}*\n`
      text += `   💰 Harga: ${item.isNegotiable ? 'NEGOTIABLE' : `Rp ${item.pricePerUnit.toLocaleString('id-ID')}`}/pcs\n`
      const sizesWithQty = Object.entries(item.quantities).filter(([_, qty]) => qty > 0)
      if (sizesWithQty.length) {
        text += `   📏 Ukuran:\n`
        for (const [size, qty] of sizesWithQty) {
          const adjust = sizeAdjustments.find(s => s.size === size)?.additional_price || 0
          text += `      ${size}: ${qty} pcs x Rp ${(item.pricePerUnit + adjust).toLocaleString('id-ID')}\n`
        }
      }
      if (item.addons.length) {
  const addonStr = item.addons.map(a => `${a.name} (+${formatRupiah(a.price || a.pricePerPcs)}/pcs x ${totalQty} pcs = ${formatRupiah((a.price || a.pricePerPcs) * totalQty)})`).join(', ')
  text += `   🔧 Tambahan: ${addonStr}\n`
}
      text += `   ✨ Include: ${item.includes || '-'}\n`
      text += `   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n`
      text += `   *Subtotal: Rp ${itemTotal.toLocaleString('id-ID')}*\n\n`
    })
    text += `─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n*TOTAL: Rp ${grandTotal.toLocaleString('id-ID')}*\n─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─\n\n_Ukuran XXL +10rb, XXXL +15rb, 4XL +25rb, 5XL +35rb._\n\nTerima kasih 🙏`
    return text
  }

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppText()
    if (!text) return alert('Keranjang kosong')
    window.open(`https://wa.me/6282224002615?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleCopyText = () => {
    const text = generateWhatsAppText()
    if (!text) return alert('Keranjang kosong')
    navigator.clipboard.writeText(text).then(() => alert('Teks disalin!'))
  }

  if (loading) return <div className="pl-loading">🔄 Memuat data price list...</div>
  if (error) return <div className="pl-empty">⚠️ Error: {error}</div>

  // Cari includes dari produk yang dipilih
  const selectedProduct = products.find(p => p.id === selectedProductId)
  const includes = selectedProduct?.includes || ''

  return (
    <div>
      <div className="pl-tabs">
        <button className={`pl-tab ${brand === 'SERAGAMAN' ? 'active' : ''}`} onClick={() => switchBrand('SERAGAMAN')}>SERAGAMAN</button>
        <button className={`pl-tab ${brand === 'CLOTHINGWELL' ? 'active' : ''}`} onClick={() => switchBrand('CLOTHINGWELL')}>CLOTHINGWELL</button>
        <button className={`pl-tab ${brand === 'KAMPUS APPAREL' ? 'active' : ''}`} onClick={() => switchBrand('KAMPUS APPAREL')}>KAMPUS APPAREL</button>
      </div>

      <div className="pl-two-columns">
        <div className="pl-products-section">
          <div className="kpro-card">
            <div className="kpro-card-header">
              <span className="kpro-card-title">Pilih Produk</span>
            </div>
            <div className="kpro-card-body">
              <ProductTypeSelector
                products={products}
                onSelectProduct={(id, name, inc) => handleSelectProduct(id, name, inc)}
              />
              {selectedProductId && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Pilih Kain</h4>
                  <FabricSelector
                    productId={selectedProductId}
                    fabrics={fabrics}
                    onSelectFabric={handleSelectFabric}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pl-cart-section">
          <Cart
            cart={cart}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onSendWhatsApp={handleSendWhatsApp}
            onCopyText={handleCopyText}
          />
        </div>
      </div>

      <QuantityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={selectedProductId}
        fabricId={selectedFabric.id}
        fabricName={selectedFabric.name}
        productName={selectedProductName}
        includes={includes}
        brand={brand}
        sizeAdjustments={sizeAdjustments}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
}