import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../utils/api'

export default function AdminAttendees(){
  const { id } = useParams()
  const [attendees, setAttendees] = useState([])
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', ticketTypeId: '' })
  const [createdBooking, setCreatedBooking] = useState(null)

  const copyValue = async (value) => {
    try {
      await navigator.clipboard.writeText(String(value || ''))
    } catch {
      // ignore clipboard errors
    }
  }

  useEffect(()=>{
    if (!id) return
    api.get(`/admin/events/${id}/attendees`)
      .then(r=>{
        setAttendees(r.data.attendees || [])
        setEvent(r.data.event || null)
        setCustomerForm((current) => ({
          ...current,
          ticketTypeId: current.ticketTypeId || r.data.event?.ticketTypes?.[0]?._id || ''
        }))
      })
      .catch(err=>setError(err.response?.data?.message || 'Failed to load attendees'))
  },[id])

  async function submitCustomer(e) {
    e.preventDefault()
    try {
      setError('')
      const r = await api.post(`/admin/events/${id}/customers`, customerForm)
      setCreatedBooking(r.data)
      setCustomerForm({ name: '', phone: '', email: '', ticketTypeId: event?.ticketTypes?.[0]?._id || '' })
      const refreshed = await api.get(`/admin/events/${id}/attendees`)
      setAttendees(refreshed.data.attendees || [])
      setEvent(refreshed.data.event || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer booking')
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold sm:text-2xl">Attendees</h2>
      {error && <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {event && (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow sm:p-5">
          <div className="text-sm text-gray-500">Event Details</div>
          <div className="text-lg font-semibold text-slate-900">{event.title}</div>
          <div className="text-sm text-gray-600">{event.category} · {event.venue}</div>
          <div className="text-sm text-gray-600">{new Date(event.date).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Capacity: {event.capacity} · Registered: {event.registeredCount}</div>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-semibold text-slate-900">Add Customer Manually</h3>
        <p className="text-sm text-slate-600">Create a booking, QR ticket, and customer profile for this event.</p>

        <form onSubmit={submitCustomer} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={customerForm.name}
            onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
            placeholder="Customer name"
          />
          <input
            className="rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={customerForm.phone}
            onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
            placeholder="Phone"
          />
          <input
            className="rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:col-span-2"
            value={customerForm.email}
            onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
            placeholder="Email"
          />
          <select
            className="rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={customerForm.ticketTypeId}
            onChange={e => setCustomerForm({ ...customerForm, ticketTypeId: e.target.value })}
          >
            {(event?.ticketTypes || []).map(tt => (
              <option key={tt._id} value={tt._id}>{tt.name} - ${tt.price ?? 0}</option>
            ))}
          </select>
          <button className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-3 text-white shadow-md sm:col-span-2">Create Customer Booking</button>
        </form>

        {createdBooking && (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-200">
            <div className="font-semibold text-emerald-800">Customer booking created</div>
            <div className="text-sm text-slate-700">Name: {createdBooking.user?.name}</div>
            <div className="text-sm text-slate-700">Phone: {createdBooking.user?.phone || 'N/A'}</div>
            <div className="text-sm text-slate-700">Email: {createdBooking.user?.email}</div>
            <div className="text-sm text-slate-700">Booking ID: {createdBooking.booking?.id}</div>
            <div className="text-sm text-slate-700">Ticket ID: {createdBooking.ticket?.id}</div>
            {createdBooking.qrCode && <img src={createdBooking.qrCode} alt="Generated QR" className="mt-3 w-40 max-w-full rounded border sm:w-48" />}
          </div>
        )}
      </div>

      <a className="mb-3 inline-block text-blue-600" href={`/api/v1/admin/events/${id}/export`}>Download CSV</a>

      <div className="space-y-3 md:hidden">
        {attendees.length === 0 && (
          <div className="rounded-lg border bg-white px-4 py-4 text-sm text-gray-500 shadow">No booked tickets found.</div>
        )}

        {attendees.map(a => (
          <div key={a.ticketId} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Ticket</div>
                <div className="break-all font-mono text-xs text-gray-800">{a.ticket?._id || a.ticketId}</div>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {a.ticket?.isCheckedIn ? 'Checked in' : 'Not checked in'}
              </div>
            </div>

            <div className="mt-3 grid gap-3 text-sm text-gray-700">
              <div><span className="font-semibold">User:</span> {a.user?.name || 'Unknown user'}</div>
              <div><span className="font-semibold">Email:</span> {a.user?.email || 'No email'}</div>
              <div><span className="font-semibold">Phone:</span> {a.user?.phone || 'N/A'}</div>
              <div><span className="font-semibold">Event:</span> {a.event?.title}</div>
              <div><span className="font-semibold">Ticket Option:</span> {a.ticketType?.name || 'N/A'}</div>
              <div><span className="font-semibold">Booking ID:</span> {a.booking?._id || 'N/A'}</div>
              <div><span className="font-semibold">Status:</span> {a.booking?.status || 'unknown'}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded bg-gray-100 px-3 py-2 text-xs" onClick={() => copyValue(a.ticket?._id)}>Copy Ticket ID</button>
              <button className="rounded bg-gray-100 px-3 py-2 text-xs" onClick={() => copyValue(a.booking?._id)}>Copy Booking ID</button>
              <button className="rounded bg-gray-100 px-3 py-2 text-xs" onClick={() => copyValue(a.user?._id)}>Copy User ID</button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border bg-white shadow md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Ticket ID</th>
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Ticket Option</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendees.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan="8">No booked tickets found.</td>
              </tr>
            )}
            {attendees.map(a => (
              <tr key={a.ticketId} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-mono text-xs text-gray-800">{a.ticket?._id || a.ticketId}</div>
                  <div className="mt-1 text-xs text-gray-500">QR: {a.ticket?.qrPayload ? 'present' : 'missing'}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-mono text-xs text-gray-800">{a.booking?._id || 'N/A'}</div>
                  <div className="mt-1 text-xs text-gray-500">{a.booking?.status || 'unknown'}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold">{a.user?.name || 'Unknown user'}</div>
                  <div className="text-gray-600">{a.user?.email || 'No email'}</div>
                  <div className="mt-1 text-xs text-gray-500">User ID: {a.user?._id || 'N/A'}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-gray-700">{a.user?.phone || 'N/A'}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold">{a.event?.title}</div>
                  <div className="text-gray-600">{a.event?.venue}</div>
                  <div className="text-xs text-gray-500">{a.event?.category} · {new Date(a.event?.date).toLocaleString()}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold">{a.ticketType?.name || 'N/A'}</div>
                  <div className="text-gray-600">Price: ${a.ticketType?.price ?? 0}</div>
                  <div className="text-xs text-gray-500">Ticket Type ID: {a.booking?.ticketTypeId || 'N/A'}</div>
                </td>
                <td className="px-4 py-4">
                  <div>{a.ticket?.isCheckedIn ? 'Checked in' : 'Not checked in'}</div>
                  <div className="text-xs text-gray-500">{a.ticket?.checkedInAt ? new Date(a.ticket.checkedInAt).toLocaleString() : '—'}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded bg-gray-100 px-2 py-1 text-xs" onClick={() => copyValue(a.ticket?._id)}>Copy Ticket ID</button>
                    <button className="rounded bg-gray-100 px-2 py-1 text-xs" onClick={() => copyValue(a.booking?._id)}>Copy Booking ID</button>
                    <button className="rounded bg-gray-100 px-2 py-1 text-xs" onClick={() => copyValue(a.user?._id)}>Copy User ID</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
