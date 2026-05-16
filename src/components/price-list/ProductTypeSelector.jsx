export default function ProductTypeSelector({ products, onSelectProduct }) {
  if (!products.length) return <div className="pl-empty">Belum ada produk untuk brand ini.</div>

  return (
    <div className="product-type-selector">
      {products.map(product => (
        <button
          key={product.id}
          className="product-type-btn"
          onClick={() => onSelectProduct(product.id, product.product_type, product.includes)}
        >
          {product.product_type}
        </button>
      ))}
    </div>
  )
}