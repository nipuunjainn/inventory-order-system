import { useState, useEffect } from 'react'
import { productsApi } from '../api/client'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { StockBadge } from '../components/Badge'
import { useToast } from '../components/Toast'

const EMPTY_FORM = { sku: '', name: '', description: '', price: '', stock_quantity: '' }

export default function Products() {
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchProducts = async (q = search) => {
    setLoading(true)
    try {
      const res = await productsApi.list({ search: q || undefined, limit: 200 })
      setProducts(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const openCreate = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setForm({ sku: p.sku, name: p.name, description: p.description || '', price: p.price, stock_quantity: p.stock_quantity })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) }
      if (editProduct) {
        await productsApi.update(editProduct.id, { name: data.name, description: data.description, price: data.price, stock_quantity: data.stock_quantity })
        toast('Product updated successfully', 'success')
      } else {
        await productsApi.create(data)
        toast('Product created successfully', 'success')
      }
      setModalOpen(false)
      fetchProducts()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await productsApi.delete(id)
      toast('Product deleted', 'success')
      setDeleteConfirm(null)
      fetchProducts()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to delete product', 'error')
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    fetchProducts(e.target.value)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{products.length} products in catalog</p>
        </div>
        <button id="btn-create-product" className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search-products"
                className="form-input search-input"
                type="text"
                placeholder="Search by name or SKU…"
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading products…</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-text">No products found</div>
            <div className="empty-state-subtext">Add your first product to get started</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><span className="font-mono"><Badge variant="purple">{p.sku}</Badge></span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</div>}
                  </td>
                  <td style={{ fontWeight: 600 }}>${Number(p.price).toFixed(2)}</td>
                  <td><StockBadge quantity={p.stock_quantity} /></td>
                  <td>
                    <div className="table-actions">
                      <button id={`btn-edit-product-${p.id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button id={`btn-delete-product-${p.id}`} className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit Product' : 'Add Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button id="btn-save-product" className="btn btn-primary" form="product-form" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : (editProduct ? 'Save Changes' : 'Create Product')}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required" htmlFor="prod-sku">SKU</label>
              <input id="prod-sku" className="form-input" placeholder="e.g. PROD-001" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })} required disabled={!!editProduct} />
            </div>
            <div className="form-group">
              <label className="form-label required" htmlFor="prod-price">Price ($)</label>
              <input id="prod-price" className="form-input" type="number" step="0.01" min="0" placeholder="0.00"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="prod-name">Product Name</label>
            <input id="prod-name" className="form-input" placeholder="Product name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="prod-desc">Description</label>
            <textarea id="prod-desc" className="form-input form-textarea" placeholder="Optional description"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="prod-stock">Initial Stock</label>
            <input id="prod-stock" className="form-input" type="number" min="0" placeholder="0"
              value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} required />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button id="btn-confirm-delete-product" className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}
