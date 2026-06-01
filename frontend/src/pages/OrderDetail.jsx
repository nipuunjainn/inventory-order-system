import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ordersApi } from '../api/client'
import { StatusBadge } from '../components/Badge'
import { useToast } from '../components/Toast'

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = async () => {
    try {
      const res = await ordersApi.get(id)
      setOrder(res.data)
    } catch {
      toast('Order not found', 'error')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrder() }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'cancelled') {
        await ordersApi.cancel(id)
      } else {
        await ordersApi.updateStatus(id, newStatus)
      }
      toast('Status updated', 'success')
      fetchOrder()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to update status', 'error')
    }
  }

  if (loading) return <div className="loading-state"><span className="spinner" /> Loading order…</div>
  if (!order) return null

  const transitions = STATUS_TRANSITIONS[order.status] || []

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <Link to="/orders" className="btn btn-secondary btn-sm">← Orders</Link>
            <StatusBadge status={order.status} />
          </div>
          <h1 className="page-title">Order #{order.id}</h1>
          <p className="page-subtitle">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {transitions.map((s) => (
            <button
              key={s}
              id={`btn-status-${s}`}
              className={`btn ${s === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => handleStatusChange(s)}
            >
              Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
        {/* Line Items */}
        <div className="table-container">
          <div className="table-toolbar">
            <span style={{ fontWeight: 600 }}>Order Items</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.product?.name}</td>
                  <td><span className="font-mono" style={{ color: 'var(--accent-primary)' }}>{item.product?.sku}</span></td>
                  <td>${Number(item.unit_price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 600 }}>${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>Order Total</div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                ${Number(order.total_amount).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>Customer</h3>
            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{order.customer?.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>{order.customer?.email}</div>
            {order.customer?.phone && <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>{order.customer.phone}</div>}
            {order.customer?.address && <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>{order.customer.address}</div>}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>Order Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items</span>
                <span>{order.items.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Created</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Updated</span>
                <span>{new Date(order.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="card">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>Notes</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
