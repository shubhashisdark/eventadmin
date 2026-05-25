import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAuthUser } from '../../utils/auth'
import api from '../../utils/api'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const eventList = Array.isArray(events) ? events : []
  const user = getAuthUser()
  const canScan = user && (user.role === 'admin' || user.role === 'staff')

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data.items || [])).catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Admin — Events</h2>
        <div className="flex flex-wrap gap-2">
          {canScan && (
            <Link to="/scanner" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-800">
              Open Scanner
            </Link>
          )}
          <Link to="/admin/new" className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-white shadow-sm transition hover:bg-emerald-700">
            Create Event
          </Link>
        </div>
      </div>
      <div className="grid gap-3 md:gap-4">
        {eventList.map(ev => (
          <div key={ev._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-slate-900">{ev.title}</div>
              <div className="text-sm text-slate-500">{new Date(ev.date).toLocaleString()}</div>
            </div>
            <div className="flex flex-wrap gap-2">
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
