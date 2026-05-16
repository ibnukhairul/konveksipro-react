import { getTiersForProductAndFabric } from '../../services/priceService'

export default function FabricSelector({ productId, fabrics, onSelectFabric }) {
  // Filter kain yang memiliki tier untuk produk ini
  const availableFabrics = fabrics.filter(fabric => {
    const tiers = getTiersForProductAndFabric(productId, fabric.id)
    return tiers.length > 0
  })

  if (!productId) return <div className="pl-empty">Pilih produk terlebih dahulu</div>
  if (availableFabrics.length === 0) return <div className="pl-empty">Belum ada kain untuk produk ini</div>

  // Helper untuk ambil harga termurah
  const getLowestPrice = (productId, fabricId) => {
    const tiers = getTiersForProductAndFabric(productId, fabricId)
    if (!tiers.length) return 0
    const lowestTier = tiers.sort((a, b) => a.min_qty - b.min_qty)[0]
    return lowestTier.price
  }

  return (
    <div className="pl-products-grid">
      {availableFabrics.map(fabric => {
        const lowestPrice = getLowestPrice(productId, fabric.id)
        const priceText = lowestPrice > 0 ? `Rp ${lowestPrice.toLocaleString('id-ID')}` : 'NEGOTIABLE'
        return (
          <div
            key={fabric.id}
            className="pl-product-card"
            onClick={() => onSelectFabric(fabric.id, fabric.fabric_name)}
          >
            <div className="pl-product-name">{fabric.fabric_name}</div>
            <div className="pl-product-price">{priceText}</div>
            <div className="pl-product-category">
              <span className="pl-product-badge">Mulai dari {priceText}</span>
            </div>
            <div className="pl-add-icon">+</div>
          </div>
        )
      })}
    </div>
  )
}