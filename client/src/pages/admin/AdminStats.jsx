import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../utils/api'

export default function AdminStats(){
  const { id } = useParams()
  const [stats, setStats] = useState(null)

  useEffect(()=>{ if (id) api.get(`/admin/events/${id}/stats`).then(r=>setStats(r.data)).catch(()=>{}) }, [id])

  if (!stats) return <div>Loading...</div>

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Stats</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 text-white shadow-md">Total Registrations<br/><span className="font-bold text-2xl">{stats.totalRegistrations}</span></div>
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-600 to-fuchsia-500 p-4 text-white shadow-md">Checked-In<br/><span className="font-bold text-2xl">{stats.checkedIn}</span></div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-4 text-white shadow-md">Remaining<br/><span className="font-bold text-2xl">{stats.remainingCapacity}</span></div>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-slate-900">Hourly</h3>
        <pre className="mt-2 rounded-2xl bg-slate-950 p-4 text-sm text-slate-100 shadow-inner">{JSON.stringify(stats.hourly, null, 2)}</pre>
      </div>
    </div>
  )
}
