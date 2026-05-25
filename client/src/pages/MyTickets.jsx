import React, { useEffect, useState } from 'react'
import api from '../utils/api'

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    api.get('/bookings/me').then(r => {
      setTickets(r.data.tickets || [])
    }).catch(() => {})
  }, [])

  async function handleResend(bookingId) {
    try {
      await api.post(`/bookings/${bookingId}/resend`);
      alert('Resend email requested — check your inbox.');
    } catch (err) {
      alert(err.response?.data?.message || 'Resend failed');
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900 sm:text-2xl">My Tickets</h2>
      <div className="grid gap-4">
        {tickets.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-slate-600">No tickets yet</div>}
        {tickets.map(t => (
          <div key={t._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium uppercase tracking-wide text-indigo-600">Ticket</div>
                <div className="mt-1 break-words text-lg font-semibold text-slate-900">{t.eventId?.title || 'Event ticket'}</div>
                <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div><span className="font-medium text-slate-800">Event date:</span> {formatDateTime(t.eventId?.date)}</div>
                  <div><span className="font-medium text-slate-800">Venue:</span> {t.eventId?.venue || '—'}</div>
                  <div><span className="font-medium text-slate-800">Ticket type:</span> {t.eventId?.ticketTypes?.find(tt => String(tt._id) === String(t.bookingId?.ticketTypeId))?.name || 'Standard'}</div>
                  <div><span className="font-medium text-slate-800">Booking date:</span> {formatDateTime(t.bookingId?.createdAt || t.createdAt)}</div>
                  <div><span className="font-medium text-slate-800">Ticket ID:</span> <span className="break-all">{t._id}</span></div>
                  <div><span className="font-medium text-slate-800">Booking ID:</span> <span className="break-all">{t.bookingId?._id || '—'}</span></div>
                  <div><span className="font-medium text-slate-800">Checked in:</span> {t.isCheckedIn ? `Yes (${formatDateTime(t.checkedInAt)})` : 'No'}</div>
                  <div><span className="font-medium text-slate-800">Status:</span> {t.bookingId?.status || 'confirmed'}</div>
                </div>
              </div>
              {t.qrCodeBase64 && <img src={t.qrCodeBase64} alt="ticket QR" className="w-40 max-w-full self-start rounded-xl border border-slate-200 bg-white p-2 shadow-sm" />}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button className="rounded bg-indigo-600 px-3 py-2 text-white" onClick={() => navigator.clipboard?.writeText(t._id) || alert('Copied ticket id')}>Copy Ticket ID</button>
              {t.bookingId?._id ? (
                <button className="rounded bg-emerald-600 px-3 py-2 text-white" onClick={() => handleResend(t.bookingId._id)}>Resend Email</button>
              ) : (
                <span className="text-sm text-gray-500">No booking id</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
