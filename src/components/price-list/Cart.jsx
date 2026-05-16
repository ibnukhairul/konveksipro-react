export default function Cart({ cart, onRemoveItem, onClearCart, onSendWhatsApp, onCopyText }) {
  const formatRupiah = (num) => `Rp ${Math.round(num || 0).toLocaleString('id-ID')}`

  const calculateItemTotal = (item) => {
    let total = 0
    const totalQty = Object.values(item.quantities).reduce((a, b) => a + b, 0)
    for (const [size, qty] of Object.entries(item.quantities)) {
      if (qty > 0) {
        const adjust = item.sizeAdjustments?.find(s => s.size === size)?.additional_price || 0
        total += (item.pricePerUnit + adjust) * qty
      }
    }
    for (const addon of item.addons) {
      total += (addon.price || addon.pricePerPcs) * totalQty
    }
    return total
  }

  const grandTotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)

  if (cart.length === 0) {
    return (
      <div className="kpro-card">
        <div className="kpro-card-header">
          <span className="kpro-card-title">🛒 Keranjang <span className="pl-badge">0</span></span>
          <button className="pl-btn-clear" onClick={onClearCart}>Kosongkan</button>
        </div>
        <div className="kpro-card-body">
          <div className="pl-empty">✨ Belum ada produk<br />Pilih jenis produk untuk mulai</div>
        </div>
      </div>
    )
  }

  return (
    <div className="kpro-card">
      <div className="kpro-card-header">
        <span className="kpro-card-title">🛒 Keranjang <span className="pl-badge">{cart.length}</span></span>
        <button className="pl-btn-clear" onClick={onClearCart}>Kosongkan</button>
      </div>
      <div className="kpro-card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {cart.map(item => {
          const itemTotal = calculateItemTotal(item)
          const totalQty = Object.values(item.quantities).reduce((a, b) => a + b, 0)
          const sizesHtml = Object.entries(item.quantities)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => {
              const adjust = item.sizeAdjustments?.find(s => s.size === size)?.additional_price || 0
              return `<div>${size}: ${qty} pcs x ${formatRupiah(item.pricePerUnit + adjust)}</div>`
            }).join('')
          return (
            <div key={item.id} className="pl-cart-item">
              <div className="pl-cart-header">
                <div className="pl-cart-title">
                  {item.productName} + {item.fabricName}
                  <div style={{ fontSize: '11px', color: '#64748B' }}>✨ {item.includes?.substring(0, 50)}</div>
                </div>
                <button className="pl-cart-remove" onClick={() => onRemoveItem(item.id)}>✕ Hapus</button>
              </div>
              <div className="pl-custom-price">
                <span>💰 Harga: {item.isNegotiable ? 'NEGOTIABLE' : formatRupiah(item.pricePerUnit)} / pcs</span>
                {item.customPrice && <span style={{ fontSize: '10px', color: '#22C55E' }}> (Negosiasi)</span>}
              </div>
              <div className="pl-sizes" style={{ flexDirection: 'column', alignItems: 'flex-start' }} dangerouslySetInnerHTML={{ __html: sizesHtml }} />
              {item.addons.length > 0 && (
                <div>🔧 {item.addons.map(a => `${a.name} (+${formatRupiah(a.price || a.pricePerPcs)}/pcs) x ${totalQty} pcs = ${formatRupiah((a.price || a.pricePerPcs) * totalQty)}`).join(', ')}</div>
              )}
              <div className="pl-subtotal">💰 Subtotal: {formatRupiah(itemTotal)}</div>
            </div>
          )
        })}
      </div>
      <div className="kpro-card-footer">
        <div className="pl-total"><span>💰 Total</span><span>{formatRupiah(grandTotal)}</span></div>
        <button className="pl-btn-primary" onClick={onSendWhatsApp}>📱 Kirim ke WhatsApp</button>
        <button className="pl-btn-secondary" onClick={onCopyText}>📋 Salin Teks</button>
      </div>
    </div>
  )
}