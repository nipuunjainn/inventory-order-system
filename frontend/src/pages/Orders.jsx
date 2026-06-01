import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi, customersApi, productsApi } from '../api/client'
import Modal from '../components/Modal'
import { StatusBadge } from '../components/Badge'
import { useToast } from '../components/Toast'

export default function Orders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [orderForm, setOrderForm] = useState({ customer_id: '', notes: '', items: [{ product_id: '', quantity: 1 }] })
  const [saving, setSaving] = useState(false)

  const fetchOrders = async (status = statusFilter) => {
    setLoading(true)
    try {
      const res = await ordersApi.list({ status: status || undefined, limit: 100 })
      setOrders(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const openCreate = async () => {
    setOrderForm({ customer_id: '', notes: '', items: [{ product_id: '', quantity: 1 }] })
    const [c, p] = await Promise.all([
      customersApi.list({ limit: 200 }),
      productsApi.list({ limit: 200 }),
    ])
    setCustomers(c.data)
    setProducts(p.data)
    setCreateOpen(true)
  }

  const addItem = () => setOrderForm((f) => ({ ...f, items: [...f.items, { product_id: '', quantity: 1 }] }))
  const removeItem = (i) => setOrderForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, field, value) => setOrderForm((f) => {
    const items = [...f.items]
    items[i] = { ...items[i], [field]: value }
    return { ...f, items }
  })

  const getProduct = (id) => products.find((p) => p.id === Number(id))

  const orderTotal = orderForm.items.reduce((sum, item) => {
    const p = getProduct(item.product_id)
    return sum + (p ? Number(p.price) * Number(item.quantity || 0) : 0)
  }, 0)

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        customer_id: Number(orderForm.customer_id),
        notes: orderForm.notes,
        items: orderForm.items
          .filter((i) => i.product_id && i.quantity > 0)
          .map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
      }
      await ordersApi.create(payload)
      toast('Order created successfully', 'success')
      setCreateOpen(false)
      fetchOrders()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to create order', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      if (newStatus === 'cancelled') {
        await ordersApi.cancel(orderId)
      } else {
        await ordersApi.updateStatus(orderId, newStatus)
      }
      toast('Order status updated', 'success')
      fetchOrders()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update status', 'error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} orders</p>
        </div>
        <button id="btn-create-order" className="btn btn-primary" onClick={openCreate}>+ New Order</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <select
              id="filter-order-status"
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); fetchOrders(e.target.value) }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <div className="empty-state-text">No orders found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link to={`/orders/${o.id}`} className="text-accent" style={{ fontWeight: 600 }}>#{o.id}</Link></td>
                  <td>{o.customer?.name}</td>
                  <td>{o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}</td>
                  <td style={{ fontWeight: 600 }}>${Number(o.total_amount).toFixed(2)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link id={`btn-view-order-${o.id}`} to={`/orders/${o.id}`} className="btn btn-secondary btn-sm">View</Link>
                      {o.status !== 'cancelled' && o.status !== 'shipped' && (
                        <button
                          id={`btn-cancel-order-${o.id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange(o.id, 'cancelled')}
                        >Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Order"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Total: <strong style={{ color: 'var(--text-primary)' }}>${orderTotal.toFixed(2)}</strong>
            </span>
            <button id="btn-submit-order" className="btn btn-primary" form="order-form" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" /> Creating…</> : 'Create Order'}
            </button>
          </>
        }
      >
        <form id="order-form" onSubmit={handleCreateOrder} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label required" htmlFor="order-customer">Customer</label>
            <select id="order-customer" className="form-select" value={orderForm.customer_id}
              onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })} required>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Order Items</label>
            <div className="order-items-builder">
              {orderForm.items.map((item, i) => {
                const prod = getProduct(item.product_id)
                return (
                  <div key={i} className="order-item-row">
                    <div className="form-group" style={{ margin: 0 }}>
                      <select
                        id={`order-item-product-${i}`}
                        className="form-select"
                        value={item.product_id}
                        onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — ${Number(p.price).toFixed(2)} (Stock: {p.stock_quantity})
                          </option>
                        ))}
                      </select>
                      {prod && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                          Available: {prod.stock_quantity} units
                          {item.quantity > prod.stock_quantity && (
                            <span style={{ color: 'var(--danger)', marginLeft: 8 }}>⚠ Exceeds stock!</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <input
                        id={`order-item-qty-${i}`}
                        className="form-input"
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => removeItem(i)}
                      disabled={orderForm.items.length === 1}
                    >✕</button>
                  </div>
                )
              })}
              <button type="button" className="add-item-btn" onClick={addItem}>+ Add another item</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="order-notes">Notes</label>
            <textarea id="order-notes" className="form-input form-textarea" placeholder="Optional order notes"
              value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
