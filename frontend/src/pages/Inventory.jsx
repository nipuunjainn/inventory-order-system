import { useState, useEffect } from 'react'
import { inventoryApi } from '../api/client'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

export default function Inventory() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [restockModal, setRestockModal] = useState(null)
  const [restockQty, setRestockQty] = useState(10)
  const [saving, setSaving] = useState(false)

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const res = await inventoryApi.list()
      setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInventory() }, [])

  const handleRestock = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await inventoryApi.restock(restockModal.id, Number(restockQty))
      toast(`Added ${restockQty} units to ${restockModal.name}`, 'success')
      setRestockModal(null)
      fetchInventory()
    } catch (err) {
      toast(err.response?.data?.detail || 'Restock failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getStockClass = (qty) => {
    if (qty === 0) return 'stock-low'
    if (qty <= 5) return 'stock-low'
    if (qty <= 20) return 'stock-medium'
    return 'stock-high'
  }

  const getBarWidth = (qty) => Math.min((qty / 100) * 100, 100)
  const getBarColor = (qty) => {
    if (qty === 0 || qty <= 5) return 'var(--danger)'
    if (qty <= 20) return 'var(--warning)'
    return 'var(--success)'
  }

  const lowCount = items.filter((i) => i.stock_quantity <= 5).length
  const outCount = items.filter((i) => i.stock_quantity === 0).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            {items.length} products · {outCount} out of stock · {lowCount} low stock
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>
            <span style={{ color: 'var(--success)' }}>✓</span>
          </div>
          <div className="stat-value">{items.filter((i) => i.stock_quantity > 20).length}</div>
          <div className="stat-label">Well Stocked (&gt;20)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>
            <span style={{ color: 'var(--warning)' }}>⚠</span>
          </div>
          <div className="stat-value">{items.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= 20).length}</div>
          <div className="stat-label">Low Stock (1–20)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>
            <span style={{ color: 'var(--danger)' }}>✕</span>
          </div>
          <div className="stat-value">{outCount}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <span style={{ fontWeight: 600 }}>Stock Levels</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Sorted: lowest stock first</span>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading inventory…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No products in inventory</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Quantity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><span className="font-mono" style={{ color: 'var(--accent-primary)' }}>{item.sku}</span></td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>
                    <div className="stock-bar">
                      <div
                        className="stock-bar-fill"
                        style={{
                          width: `${getBarWidth(item.stock_quantity)}%`,
                          background: getBarColor(item.stock_quantity),
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`${getStockClass(item.stock_quantity)}`} style={{ fontWeight: 600 }}>
                      {item.stock_quantity === 0 ? '⚠ Out' : item.stock_quantity}
                    </span>
                  </td>
                  <td>
                    <button
                      id={`btn-restock-${item.id}`}
                      className="btn btn-success btn-sm"
                      onClick={() => { setRestockModal(item); setRestockQty(10) }}
                    >
                      + Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={!!restockModal}
        onClose={() => setRestockModal(null)}
        title="Restock Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRestockModal(null)}>Cancel</button>
            <button id="btn-confirm-restock" className="btn btn-success" form="restock-form" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" /> Adding…</> : 'Add Stock'}
            </button>
          </>
        }
      >
        <form id="restock-form" onSubmit={handleRestock}>
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
            Adding stock to <strong style={{ color: 'var(--text-primary)' }}>{restockModal?.name}</strong>
            {' '}(current: <strong>{restockModal?.stock_quantity}</strong> units)
          </p>
          <div className="form-group">
            <label className="form-label required" htmlFor="restock-qty">Quantity to Add</label>
            <input
              id="restock-qty"
              className="form-input"
              type="number"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              required
              autoFocus
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
