import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsApi, customersApi, ordersApi, inventoryApi } from '../api/client'
import { StatusBadge } from '../components/Badge'

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0, lowStock: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [products, customers, orders, inventory] = await Promise.all([
          productsApi.list({ limit: 200 }),
          customersApi.list({ limit: 200 }),
          ordersApi.list({ limit: 5 }),
          inventoryApi.list(),
        ])
        const lowStock = inventory.data.filter((p) => p.stock_quantity <= 5)
        setStats({
          products: products.data.length,
          customers: customers.data.length,
          orders: orders.data.length,
          lowStock: lowStock.length,
        })
        setRecentOrders(orders.data.slice(0, 5))
        setLowStockItems(lowStock.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const statCards = [
    { label: 'Total Products', value: stats.products, icon: '📦', color: 'var(--accent-light)', iconColor: 'var(--accent-primary)' },
    { label: 'Total Customers', value: stats.customers, icon: '👥', color: 'var(--info-light)', iconColor: 'var(--info)' },
    { label: 'Recent Orders', value: stats.orders, icon: '🛒', color: 'var(--success-light)', iconColor: 'var(--success)' },
    { label: 'Low Stock Alerts', value: stats.lowStock, icon: '⚠', color: 'var(--danger-light)', iconColor: 'var(--danger)' },
  ]

  if (loading) return (
    <div className="loading-state"><span className="spinner" /> Loading dashboard…</div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory and orders</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>
              <span style={{ color: s.iconColor }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Recent Orders */}
        <div className="table-container">
          <div className="table-toolbar">
            <span style={{ fontWeight: 600 }}>Recent Orders</span>
            <Link to="/orders" className="btn btn-secondary btn-sm">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-text">No orders yet</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/orders/${o.id}`} className="text-accent">#{o.id}</Link>
                    </td>
                    <td>{o.customer?.name}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="table-container">
          <div className="table-toolbar">
            <span style={{ fontWeight: 600 }}>⚠ Low Stock Alerts</span>
            <Link to="/inventory" className="btn btn-secondary btn-sm">Manage</Link>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">All products well-stocked</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((p) => (
                  <tr key={p.id}>
                    <td><span className="font-mono">{p.sku}</span></td>
                    <td>{p.name}</td>
                    <td className={p.stock_quantity === 0 ? 'stock-low' : 'stock-medium'}>
                      {p.stock_quantity === 0 ? '⚠ Out of stock' : `${p.stock_quantity} left`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
