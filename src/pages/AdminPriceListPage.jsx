import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { adminPriceService } from '../services/adminPriceService'
import { useToast } from '../hooks/useToast'

export default function AdminPriceListPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [brand, setBrand] = useState('SERAGAMAN')
  const [loading, setLoading] = useState(false)
  
  // Data state
  const [products, setProducts] = useState([])
  const [fabrics, setFabrics] = useState([])
  const [tiers, setTiers] = useState([])
  const [addons, setAddons] = useState([])
  const [sizes, setSizes] = useState([])
  
  // Filter untuk tiers & addons
  const [tierFilterProduct, setTierFilterProduct] = useState('')
  const [tierFilterFabric, setTierFilterFabric] = useState('')
  const [addonFilterProduct, setAddonFilterProduct] = useState('')
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('') // product, fabric, tier, addon, size
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({})

  const isAdmin = profile?.role === 'owner' || profile?.role === 'developer'

  // Load semua data
  const loadAllData = async () => {
    setLoading(true)
    try {
      const [productsData, fabricsData, tiersData, addonsData, sizesData] = await Promise.all([
        adminPriceService.getProducts(brand),
        adminPriceService.getFabrics(brand),
        adminPriceService.getTiers(),
        adminPriceService.getAddons(),
        adminPriceService.getSizeAdjustments(brand)
      ])
      setProducts(productsData)
      setFabrics(fabricsData)
      setTiers(tiersData)
      setAddons(addonsData)
      setSizes(sizesData)
    } catch (err) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadAllData()
  }, [brand, isAdmin])

  // Filter tiers berdasarkan produk dan kain
  const filteredTiers = tiers.filter(t => {
    if (tierFilterProduct && t.product_id !== tierFilterProduct) return false
    if (tierFilterFabric && t.fabric_id !== tierFilterFabric) return false
    return true
  })

  // Filter addons berdasarkan produk
  const filteredAddons = addons.filter(a => {
    if (addonFilterProduct && a.product_id !== addonFilterProduct) return false
    return true
  })

  // ========== PRODUCT CRUD ==========
  const openProductModal = (product = null) => {
    setModalType('product')
    setEditId(product?.id || null)
    setFormData({
      product_type: product?.product_type || '',
      category: product?.category || 'Kaos',
      includes: product?.includes || '',
      sort_order: product?.sort_order || 0,
      is_active: product?.is_active !== false
    })
    setModalOpen(true)
  }

  const saveProduct = async () => {
    if (!formData.product_type) {
      toast.warning('Nama produk wajib diisi')
      return
    }
    try {
      if (editId) {
        await adminPriceService.updateProduct(editId, { ...formData, brand })
        toast.success('Produk berhasil diupdate')
      } else {
        await adminPriceService.createProduct({ ...formData, brand })
        toast.success('Produk berhasil ditambahkan')
      }
      setModalOpen(false)
      loadAllData()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    }
  }

  const deleteProduct = async (id, name) => {
    if (!confirm(`Hapus produk "${name}"?\nSEMUA data tier dan addons terkait akan terhapus!`)) return
    try {
      await adminPriceService.deleteProduct(id)
      toast.success(`Produk "${name}" dihapus`)
      loadAllData()
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    }
  }

  // ========== FABRIC CRUD ==========
  const openFabricModal = (fabric = null) => {
    setModalType('fabric')
    setEditId(fabric?.id || null)
    setFormData({
      fabric_name: fabric?.fabric_name || '',
      sort_order: fabric?.sort_order || 0,
      is_active: fabric?.is_active !== false
    })
    setModalOpen(true)
  }

  const saveFabric = async () => {
    if (!formData.fabric_name) {
      toast.warning('Nama kain wajib diisi')
      return
    }
    try {
      if (editId) {
        await adminPriceService.updateFabric(editId, { ...formData, brand })
        toast.success('Kain berhasil diupdate')
      } else {
        await adminPriceService.createFabric({ ...formData, brand })
        toast.success('Kain berhasil ditambahkan')
      }
      setModalOpen(false)
      loadAllData()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    }
  }

  const deleteFabric = async (id, name) => {
    if (!confirm(`Hapus kain "${name}"?\nSEMUA data tier terkait akan terhapus!`)) return
    try {
      await adminPriceService.deleteFabric(id)
      toast.success(`Kain "${name}" dihapus`)
      loadAllData()
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    }
  }

  // ========== TIER CRUD ==========
  const openTierModal = (tier = null) => {
    setModalType('tier')
    setEditId(tier?.id || null)
    setFormData({
      product_id: tier?.product_id || '',
      fabric_id: tier?.fabric_id || '',
      min_qty: tier?.min_qty || '',
      max_qty: tier?.max_qty || '',
      price: tier?.price || 0
    })
    setModalOpen(true)
  }

  const saveTier = async () => {
    if (!formData.product_id || !formData.fabric_id || !formData.min_qty) {
      toast.warning('Produk, kain, dan min quantity wajib diisi')
      return
    }
    try {
      if (editId) {
        await adminPriceService.updateTier(editId, formData)
        toast.success('Tier harga berhasil diupdate')
      } else {
        await adminPriceService.createTier(formData)
        toast.success('Tier harga berhasil ditambahkan')
      }
      setModalOpen(false)
      loadAllData()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    }
  }

  const deleteTier = async (id) => {
    if (!confirm('Hapus tier harga ini?')) return
    try {
      await adminPriceService.deleteTier(id)
      toast.success('Tier harga dihapus')
      loadAllData()
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    }
  }

  // ========== ADDON CRUD ==========
  const openAddonModal = (addon = null) => {
    setModalType('addon')
    setEditId(addon?.id || null)
    setFormData({
      product_id: addon?.product_id || '',
      name: addon?.name || '',
      price: addon?.price || 0,
      sort_order: addon?.sort_order || 0,
      is_active: addon?.is_active !== false
    })
    setModalOpen(true)
  }

  const saveAddon = async () => {
    if (!formData.product_id || !formData.name) {
      toast.warning('Produk dan nama addon wajib diisi')
      return
    }
    try {
      if (editId) {
        await adminPriceService.updateAddon(editId, formData)
        toast.success('Addon berhasil diupdate')
      } else {
        await adminPriceService.createAddon(formData)
        toast.success('Addon berhasil ditambahkan')
      }
      setModalOpen(false)
      loadAllData()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    }
  }

  const deleteAddon = async (id, name) => {
    if (!confirm(`Hapus addon "${name}"?`)) return
    try {
      await adminPriceService.deleteAddon(id)
      toast.success(`Addon "${name}" dihapus`)
      loadAllData()
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    }
  }

  // ========== SIZE ADJUSTMENT CRUD ==========
  const openSizeModal = (size = null) => {
    setModalType('size')
    setEditId(size?.id || null)
    setFormData({
      size: size?.size || '',
      additional_price: size?.additional_price || 0,
      is_active: size?.is_active !== false
    })
    setModalOpen(true)
  }

  const saveSize = async () => {
    if (!formData.size) {
      toast.warning('Ukuran wajib diisi')
      return
    }
    try {
      if (editId) {
        await adminPriceService.updateSizeAdjustment(editId, { ...formData, brand })
        toast.success('Ukuran berhasil diupdate')
      } else {
        await adminPriceService.createSizeAdjustment({ ...formData, brand })
        toast.success('Ukuran berhasil ditambahkan')
      }
      setModalOpen(false)
      loadAllData()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    }
  }

  const deleteSize = async (id, name) => {
    if (!confirm(`Hapus ukuran "${name}"?`)) return
    try {
      await adminPriceService.deleteSizeAdjustment(id)
      toast.success(`Ukuran "${name}" dihapus`)
      loadAllData()
    } catch (err) {
      toast.error('Gagal hapus: ' + err.message)
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <div className="kpro-page-header"><div><h2 className="kpro-page-title">⚙️ Setting Price List</h2></div></div>
        <div className="kpro-card"><div className="kpro-empty"><div className="kpro-empty-icon">🔒</div><div className="kpro-empty-title">Akses Ditolak</div><div className="kpro-empty-desc">Halaman ini hanya untuk Owner dan Developer</div></div></div>
      </div>
    )
  }

  return (
    <div>
      <div className="kpro-page-header">
        <div><h2 className="kpro-page-title">⚙️ Setting Price List</h2><p className="kpro-page-subtitle">Kelola produk, kain, harga tier, addons, dan ukuran</p></div>
      </div>

      {/* Brand Tabs */}
      <div className="admin-brand-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['SERAGAMAN', 'CLOTHINGWELL', 'KAMPUS APPAREL'].map(b => (
          <button key={b} className={`kpro-btn ${brand === b ? 'kpro-btn-primary' : 'kpro-btn-secondary'}`} onClick={() => setBrand(b)}>
            {b === 'SERAGAMAN' ? '🏢 ' : b === 'CLOTHINGWELL' ? '👕 ' : '🎓 '}{b}
          </button>
        ))}
      </div>

      {loading && <div className="kpro-empty">🔄 Memuat data...</div>}

      {!loading && (
        <>
          {/* Section 1: Products */}
          <div className="kpro-card kpro-mb-5">
            <div className="kpro-card-header"><span className="kpro-card-title">📦 Produk (Jenis Pakaian)</span><button className="kpro-btn kpro-btn-primary kpro-btn-sm" onClick={() => openProductModal()}>+ Tambah Produk</button></div>
            <div className="kpro-table-wrap">
              <table className="kpro-table"><thead><tr><th>Nama Produk</th><th>Kategori</th><th>Include</th><th>Urutan</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>{products.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Belum ada produk</td></tr> : products.map(p => (<tr key={p.id}><td><strong>{p.product_type}</strong></td><td>{p.category}</td><td>{p.includes?.substring(0, 50) || '-'}</td><td>{p.sort_order}</td><td><span className={`kpro-badge ${p.is_active ? 'kpro-badge-success' : 'kpro-badge-danger'}`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td><button className="kpro-btn kpro-btn-sm kpro-btn-outline-primary" onClick={() => openProductModal(p)}>✏️</button> <button className="kpro-btn kpro-btn-sm kpro-btn-danger" onClick={() => deleteProduct(p.id, p.product_type)}>🗑</button></td></tr>))}</tbody></table>
            </div>
          </div>

          {/* Section 2: Fabrics */}
          <div className="kpro-card kpro-mb-5">
            <div className="kpro-card-header"><span className="kpro-card-title">🧵 Kain (Bahan)</span><button className="kpro-btn kpro-btn-primary kpro-btn-sm" onClick={() => openFabricModal()}>+ Tambah Kain</button></div>
            <div className="kpro-table-wrap">
              <table className="kpro-table"><thead><tr><th>Nama Kain</th><th>Urutan</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>{fabrics.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Belum ada kain</td></tr> : fabrics.map(f => (<tr key={f.id}><td><strong>{f.fabric_name}</strong></td><td>{f.sort_order}</td><td><span className={`kpro-badge ${f.is_active ? 'kpro-badge-success' : 'kpro-badge-danger'}`}>{f.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td><button className="kpro-btn kpro-btn-sm kpro-btn-outline-primary" onClick={() => openFabricModal(f)}>✏️</button> <button className="kpro-btn kpro-btn-sm kpro-btn-danger" onClick={() => deleteFabric(f.id, f.fabric_name)}>🗑</button></td></tr>))}</tbody></table>
            </div>
          </div>

          {/* Section 3: Tiers - dengan filter */}
          <div className="kpro-card kpro-mb-5">
            <div className="kpro-card-header"><span className="kpro-card-title">💰 Harga (Tier per Quantity)</span><button className="kpro-btn kpro-btn-primary kpro-btn-sm" onClick={() => openTierModal()}>+ Tambah Tier</button></div>
            <div className="kpro-card-body" style={{ paddingBottom: '0' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <select className="kpro-select" style={{ minWidth: '180px' }} value={tierFilterProduct} onChange={e => setTierFilterProduct(e.target.value)}><option value="">Semua Produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.product_type}</option>)}</select>
                <select className="kpro-select" style={{ minWidth: '180px' }} value={tierFilterFabric} onChange={e => setTierFilterFabric(e.target.value)}><option value="">Semua Kain</option>{fabrics.map(f => <option key={f.id} value={f.id}>{f.fabric_name}</option>)}</select>
                <button className="kpro-btn kpro-btn-sm kpro-btn-ghost" onClick={() => { setTierFilterProduct(''); setTierFilterFabric('') }}>Reset</button>
              </div>
            </div>
            <div className="kpro-table-wrap">
              <table className="kpro-table"><thead><tr><th>Produk</th><th>Kain</th><th>Min Qty</th><th>Max Qty</th><th>Harga</th><th>Aksi</th></tr></thead>
              <tbody>{filteredTiers.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Belum ada tier harga</td></tr> : filteredTiers.map(t => (<tr key={t.id}><td>{t.price_products?.product_type || '-'}</td><td>{t.price_fabrics?.fabric_name || '-'}</td><td>{t.min_qty}</td><td>{t.max_qty || '∞'}</td><td>{t.price === 0 ? '🔄 NEGOTIABLE' : `Rp ${t.price.toLocaleString('id-ID')}`}</td><td><button className="kpro-btn kpro-btn-sm kpro-btn-outline-primary" onClick={() => openTierModal(t)}>✏️</button> <button className="kpro-btn kpro-btn-sm kpro-btn-danger" onClick={() => deleteTier(t.id)}>🗑</button></td></tr>))}</tbody></table>
            </div>
          </div>

          {/* Section 4: Addons */}
          <div className="kpro-card kpro-mb-5">
            <div className="kpro-card-header"><span className="kpro-card-title">🔧 Addons (Tambahan)</span><button className="kpro-btn kpro-btn-primary kpro-btn-sm" onClick={() => openAddonModal()}>+ Tambah Addon</button></div>
            <div className="kpro-card-body" style={{ paddingBottom: '0' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <select className="kpro-select" style={{ minWidth: '200px' }} value={addonFilterProduct} onChange={e => setAddonFilterProduct(e.target.value)}><option value="">Semua Produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.product_type}</option>)}</select>
                <button className="kpro-btn kpro-btn-sm kpro-btn-ghost" onClick={() => setAddonFilterProduct('')}>Reset</button>
              </div>
            </div>
            <div className="kpro-table-wrap">
              <table className="kpro-table"><thead><tr><th>Produk</th><th>Nama Addon</th><th>Harga</th><th>Urutan</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>{filteredAddons.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Belum ada addon</td></tr> : filteredAddons.map(a => (<tr key={a.id}><td>{a.price_products?.product_type || '-'}</td><td><strong>{a.name}</strong></td><td>Rp {a.price.toLocaleString('id-ID')}</td><td>{a.sort_order}</td><td><span className={`kpro-badge ${a.is_active ? 'kpro-badge-success' : 'kpro-badge-danger'}`}>{a.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td><button className="kpro-btn kpro-btn-sm kpro-btn-outline-primary" onClick={() => openAddonModal(a)}>✏️</button> <button className="kpro-btn kpro-btn-sm kpro-btn-danger" onClick={() => deleteAddon(a.id, a.name)}>🗑</button></td></tr>))}</tbody></table>
            </div>
          </div>

          {/* Section 5: Size Adjustments */}
          <div className="kpro-card">
            <div className="kpro-card-header"><span className="kpro-card-title">📏 Penyesuaian Harga per Ukuran</span><button className="kpro-btn kpro-btn-primary kpro-btn-sm" onClick={() => openSizeModal()}>+ Tambah Ukuran</button></div>
            <div className="kpro-table-wrap">
              <table className="kpro-table"><thead><tr><th>Ukuran</th><th>Harga Tambahan</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>{sizes.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>Belum ada penyesuaian ukuran</td></tr> : sizes.map(s => (<tr key={s.id}><td><strong>{s.size}</strong></td><td>Rp {s.additional_price.toLocaleString('id-ID')}</td><td><span className={`kpro-badge ${s.is_active ? 'kpro-badge-success' : 'kpro-badge-danger'}`}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span></td><td><button className="kpro-btn kpro-btn-sm kpro-btn-outline-primary" onClick={() => openSizeModal(s)}>✏️</button> <button className="kpro-btn kpro-btn-sm kpro-btn-danger" onClick={() => deleteSize(s.id, s.size)}>🗑</button></td></tr>))}</tbody></table>
            </div>
          </div>
        </>
      )}

      {/* Modal Form (Reusable) */}
      {modalOpen && (
        <div className="kpro-modal-overlay is-open" onClick={() => setModalOpen(false)}>
          <div className="kpro-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="kpro-modal-header"><h3>{modalType === 'product' ? (editId ? 'Edit Produk' : 'Tambah Produk') : modalType === 'fabric' ? (editId ? 'Edit Kain' : 'Tambah Kain') : modalType === 'tier' ? (editId ? 'Edit Tier Harga' : 'Tambah Tier Harga') : modalType === 'addon' ? (editId ? 'Edit Addon' : 'Tambah Addon') : (editId ? 'Edit Ukuran' : 'Tambah Ukuran')}</h3><button className="kpro-modal-close" onClick={() => setModalOpen(false)}>✕</button></div>
            <div className="kpro-modal-body">
              {modalType === 'product' && (
                <>
                  <div className="kpro-form-group"><label>Nama Produk *</label><input className="kpro-input" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} placeholder="PDH, KAOS, POLO" /></div>
                  <div className="kpro-form-group"><label>Kategori</label><select className="kpro-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Jaket</option><option>Kaos</option><option>Polo</option><option>Kemeja</option><option>Rompi</option><option>Merchandise</option></select></div>
                  <div className="kpro-form-group"><label>Include</label><textarea className="kpro-textarea" rows="2" value={formData.includes} onChange={e => setFormData({...formData, includes: e.target.value})} placeholder="Bordir 1-3 titik, ukuran normal" /></div>
                  <div className="kpro-form-group"><label>Urutan</label><input type="number" className="kpro-input" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} /></div>
                  <div className="kpro-form-group"><label>Status</label><select className="kpro-select" value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></div>
                </>
              )}
              {modalType === 'fabric' && (
                <>
                  <div className="kpro-form-group"><label>Nama Kain *</label><input className="kpro-input" value={formData.fabric_name} onChange={e => setFormData({...formData, fabric_name: e.target.value})} placeholder="AMERICAN DRILL, COTTON 30s" /></div>
                  <div className="kpro-form-group"><label>Urutan</label><input type="number" className="kpro-input" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} /></div>
                  <div className="kpro-form-group"><label>Status</label><select className="kpro-select" value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></div>
                </>
              )}
              {modalType === 'tier' && (
                <>
                  <div className="kpro-form-group"><label>Produk *</label><select className="kpro-select" value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})}><option value="">Pilih Produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.product_type}</option>)}</select></div>
                  <div className="kpro-form-group"><label>Kain *</label><select className="kpro-select" value={formData.fabric_id} onChange={e => setFormData({...formData, fabric_id: e.target.value})}><option value="">Pilih Kain</option>{fabrics.map(f => <option key={f.id} value={f.id}>{f.fabric_name}</option>)}</select></div>
                  <div className="kpro-form-row"><div className="kpro-form-group"><label>Min Qty *</label><input type="number" className="kpro-input" value={formData.min_qty} onChange={e => setFormData({...formData, min_qty: parseInt(e.target.value) || 0})} /></div><div className="kpro-form-group"><label>Max Qty</label><input type="number" className="kpro-input" value={formData.max_qty} onChange={e => setFormData({...formData, max_qty: e.target.value ? parseInt(e.target.value) : ''})} placeholder="Kosongkan untuk unlimited" /></div></div>
                  <div className="kpro-form-group"><label>Harga (per pcs)</label><input type="number" className="kpro-input" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} /><div className="kpro-form-hint">Isi 0 jika harga dapat dinegosiasikan</div></div>
                </>
              )}
              {modalType === 'addon' && (
                <>
                  <div className="kpro-form-group"><label>Produk *</label><select className="kpro-select" value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value})}><option value="">Pilih Produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.product_type}</option>)}</select></div>
                  <div className="kpro-form-group"><label>Nama Addon *</label><input className="kpro-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Kombinasi kain, Lengan panjang" /></div>
                  <div className="kpro-form-group"><label>Harga Tambahan</label><input type="number" className="kpro-input" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} /></div>
                  <div className="kpro-form-group"><label>Urutan</label><input type="number" className="kpro-input" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} /></div>
                  <div className="kpro-form-group"><label>Status</label><select className="kpro-select" value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></div>
                </>
              )}
              {modalType === 'size' && (
                <>
                  <div className="kpro-form-group"><label>Ukuran *</label><input className="kpro-input" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value.toUpperCase()})} placeholder="XS, S, M, L, XL, XXL" /></div>
                  <div className="kpro-form-group"><label>Harga Tambahan</label><input type="number" className="kpro-input" value={formData.additional_price} onChange={e => setFormData({...formData, additional_price: parseInt(e.target.value) || 0})} /><div className="kpro-form-hint">Contoh: XXL tambah Rp 10.000</div></div>
                  <div className="kpro-form-group"><label>Status</label><select className="kpro-select" value={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}><option value="true">Aktif</option><option value="false">Nonaktif</option></select></div>
                </>
              )}
            </div>
            <div className="kpro-modal-footer"><button className="kpro-btn kpro-btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button className="kpro-btn kpro-btn-primary" onClick={() => { if (modalType === 'product') saveProduct(); else if (modalType === 'fabric') saveFabric(); else if (modalType === 'tier') saveTier(); else if (modalType === 'addon') saveAddon(); else saveSize(); }}>Simpan</button></div>
          </div>
        </div>
      )}
    </div>
  )
}