import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function Events() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')
  const eventList = Array.isArray(events) ? events : []

  useEffect(() => {
    let mounted = true
    api
      .get('/events')
      .then(r => {
        if (!mounted) return
        const payload = r.data
        setEvents(Array.isArray(payload) ? payload : payload?.items || [])
      })
      .catch((err) => {
        if (!mounted) return
        setError(err.response?.data?.message || 'Failed to load events')
      })
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900 sm:text-2xl">Events</h2>
      {error && <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {eventList.length === 0 && <div>No events yet</div>}
        {eventList.map(ev => (
          <div key={ev._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
            <div className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">{ev.category}</div>
            <h3 className="text-lg font-bold text-slate-900">{ev.title}</h3>
            <p className="text-sm text-slate-500">{new Date(ev.date).toLocaleString()}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 sm:text-base">{ev.description}</p>
            <Link to={`/events/${ev._id}`} className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 sm:w-auto">
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
