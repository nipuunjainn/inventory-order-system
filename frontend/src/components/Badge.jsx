const VARIANTS = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  purple: 'badge-purple',
  muted: 'badge-muted',
}

export default function Badge({ children, variant = 'muted' }) {
  return <span className={`badge ${VARIANTS[variant] || 'badge-muted'}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = {
    pending: { variant: 'warning', label: 'Pending' },
    confirmed: { variant: 'info', label: 'Confirmed' },
    shipped: { variant: 'success', label: 'Shipped' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
  }
  const cfg = map[status] || { variant: 'muted', label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function StockBadge({ quantity }) {
  if (quantity === 0) return <Badge variant="danger">Out of Stock</Badge>
  if (quantity <= 5) return <Badge variant="danger">Low: {quantity}</Badge>
  if (quantity <= 20) return <Badge variant="warning">{quantity} units</Badge>
  return <Badge variant="success">{quantity} units</Badge>
}
