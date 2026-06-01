import { useState, useEffect } from 'react'
import { customersApi } from '../api/client'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchCustomers = async (q = search) => {
    setLoading(true)
    try {
      const res = await customersApi.list({ search: q || undefined, limit: 200 })
      setCustomers(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const openCreate = () => {
    setEditCustomer(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditCustomer(c)
    setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editCustomer) {
        await customersApi.update(editCustomer.id, form)
        toast('Customer updated', 'success')
      } else {
        await customersApi.create(form)
        toast('Customer created', 'success')
      }
      setModalOpen(false)
      fetchCustomers()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to save customer', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await customersApi.delete(id)
      toast('Customer deleted', 'success')
      setDeleteConfirm(null)
      fetchCustomers()
    } catch (err) {
      toast(err.response?.data?.detail || 'Failed to delete', 'error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} registered customers</p>
        </div>
        <button id="btn-create-customer" className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search-customers"
                className="form-input search-input"
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); fetchCustomers(e.target.value) }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner" /> Loading customers…</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">No customers found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td>{c.phone || <span className="text-muted">—</span>}</td>
                  <td>{c.address ? c.address.slice(0, 40) + (c.address.length > 40 ? '…' : '') : <span className="text-muted">—</span>}</td>
                  <td>
                    <div className="table-actions">
                      <button id={`btn-edit-customer-${c.id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button id={`btn-delete-customer-${c.id}`} className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(c)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCustomer ? 'Edit Customer' : 'Add Customer'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button id="btn-save-customer" className="btn btn-primary" form="customer-form" type="submit" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : (editCustomer ? 'Save Changes' : 'Create Customer')}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label required" htmlFor="cust-name">Full Name</label>
            <input id="cust-name" className="form-input" placeholder="John Doe" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="cust-email">Email</label>
            <input id="cust-email" className="form-input" type="email" placeholder="john@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cust-phone">Phone</label>
            <input id="cust-phone" className="form-input" type="tel" placeholder="+1 234 567 8900" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cust-address">Address</label>
            <textarea id="cust-address" className="form-input form-textarea" placeholder="Street, City, Country"
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button id="btn-confirm-delete-customer" className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
          </>
        }
      >
        <p>Delete <strong>{deleteConfirm?.name}</strong>? Their order history will also be affected.</p>
      </Modal>
    </div>
  )
}
