import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../utils/api'

export default function AdminAttendees(){
  const { id } = useParams()
  const [attendees, setAttendees] = useState([])
  const [event, setEvent] = useState(null)
  const [error, setError] = useState('')

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
      })
      .catch(err=>setError(err.response?.data?.message || 'Failed to load attendees'))
  },[id])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Attendees</h2>
      {error && <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {event && (
        <div className="mb-4 rounded bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Event Details</div>
          <div className="text-lg font-semibold">{event.title}</div>
          <div className="text-sm text-gray-600">{event.category} · {event.venue}</div>
          <div className="text-sm text-gray-600">{new Date(event.date).toLocaleString()}</div>
          <div className="text-sm text-gray-600">Capacity: {event.capacity} · Registered: {event.registeredCount}</div>
        </div>
      )}

      <a className="inline-block mb-3 text-blue-600" href={`/api/v1/admin/events/${id}/export`}>Download CSV</a>
      <div className="overflow-x-auto rounded-lg border bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Ticket ID</th>
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Ticket Option</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {attendees.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan="7">No booked tickets found.</td>
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
