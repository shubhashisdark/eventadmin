import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const eventList = Array.isArray(events) ? events : []

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data.items || [])).catch(() => {})
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Admin — Events</h2>
        <Link to="/admin/new" className="rounded-full bg-emerald-600 px-4 py-2 text-white shadow-sm transition hover:bg-emerald-700">Create Event</Link>
      </div>
      <div className="grid gap-3">
        {eventList.map(ev => (
          <div key={ev._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div className="font-semibold text-slate-900">{ev.title}</div>
              <div className="text-sm text-slate-500">{new Date(ev.date).toLocaleString()}</div>
            </div>
            <div className="space-x-2">
              <Link to={`/admin/${ev._id}`} className="text-sm text-indigo-600">Edit</Link>
              <Link to={`/admin/${ev._id}/attendees`} className="text-sm text-fuchsia-600">Attendees</Link>
              <Link to={`/admin/${ev._id}/stats`} className="text-sm text-slate-700">Stats</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
