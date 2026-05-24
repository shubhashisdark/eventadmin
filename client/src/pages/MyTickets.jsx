import React, { useEffect, useState } from 'react'
import api from '../utils/api'

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
      <h2 className="mb-4 text-xl font-semibold text-slate-900">My Tickets</h2>
      <div className="space-y-4">
        {tickets.length === 0 && <div>No tickets</div>}
        {tickets.map(t => (
          <div key={t._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="font-semibold text-slate-900">Ticket: {t._id}</div>
            <div className="text-slate-600">Checked in: {t.isCheckedIn ? 'Yes' : 'No'}</div>
            {t.qrCodeBase64 && <img src={t.qrCodeBase64} alt="qr" className="mt-2 w-40" />}
            <div className="mt-3">
              <button className="mr-2 rounded bg-indigo-600 px-3 py-1 text-white" onClick={() => navigator.clipboard?.writeText(t._id) || alert('Copied ticket id')}>Copy Ticket ID</button>
              {t.bookingId ? (
                <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={() => handleResend(t.bookingId)}>Resend Email</button>
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
