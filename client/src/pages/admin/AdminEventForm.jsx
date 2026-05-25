import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../utils/api'

export default function AdminEventForm(){
  const { id } = useParams()
  const nav = useNavigate()
  const [data, setData] = useState({ title:'', description:'', date:'', venue:'', category:'', capacity:100, ticketTypes:[] })
  const [banner, setBanner] = useState(null)

  useEffect(()=>{ if (id) api.get(`/events/${id}`).then(r=>setData(r.data)).catch(()=>{}) }, [id])

  function addTicketType() {
    setData((current) => ({
      ...current,
      ticketTypes: [
        ...(Array.isArray(current.ticketTypes) ? current.ticketTypes : []),
        { name: '', price: 0, capacity: 1 }
      ]
    }))
  }

  function updateTicketType(index, field, value) {
    setData((current) => {
      const ticketTypes = [...(Array.isArray(current.ticketTypes) ? current.ticketTypes : [])]
      ticketTypes[index] = { ...ticketTypes[index], [field]: value }
      return { ...current, ticketTypes }
    })
  }

  function removeTicketType(index) {
    setData((current) => ({
      ...current,
      ticketTypes: (Array.isArray(current.ticketTypes) ? current.ticketTypes : []).filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  async function submit(e){
    e.preventDefault()
    try{
      if (id) await api.put(`/events/${id}`, data)
      else {
        const r = await api.post('/events', data)
        if (r.data && r.data._id) nav(`/admin/${r.data._id}`)
      }
      if (banner && id) {
        const form = new FormData(); form.append('banner', banner);
        await api.post(`/admin/events/${id}/banner`, form, { headers: {'Content-Type':'multipart/form-data'} })
      }
      nav('/admin')
    }catch(err){ alert(err.response?.data?.message || 'Save failed') }
  }

  return (
    <div className="rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:p-6 lg:p-8">
      <h2 className="mb-4 text-xl font-semibold text-slate-900 sm:text-2xl">{id ? 'Edit' : 'Create'} Event</h2>
      <form onSubmit={submit} className="max-w-3xl space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 md:col-span-2" value={data.title} onChange={e=>setData({...data,title:e.target.value})} placeholder="Title" />
          <textarea className="w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 md:col-span-2" value={data.description} onChange={e=>setData({...data,description:e.target.value})} placeholder="Description" rows={5} />
          <input type="datetime-local" className="w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" value={data.date ? new Date(data.date).toISOString().slice(0,16) : ''} onChange={e=>setData({...data,date:e.target.value})} />
          <input className="w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" value={data.venue} onChange={e=>setData({...data,venue:e.target.value})} placeholder="Venue" />
          <input className="w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" value={data.category} onChange={e=>setData({...data,category:e.target.value})} placeholder="Category" />
          <input type="number" className="w-full rounded-lg border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" value={data.capacity} onChange={e=>setData({...data,capacity:Number(e.target.value)})} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Ticket Options</h3>
              <p className="text-xs text-slate-500">Add the ticket types users can book for this event.</p>
            </div>
            <button type="button" onClick={addTicketType} className="rounded-full bg-indigo-600 px-3 py-2 text-sm text-white">Add Option</button>
          </div>

          <div className="mt-4 space-y-3">
            {(!Array.isArray(data.ticketTypes) || data.ticketTypes.length === 0) && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                No ticket options yet. Add at least one so attendees can book.
              </div>
            )}

            {Array.isArray(data.ticketTypes) && data.ticketTypes.map((ticketType, index) => (
              <div key={index} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-4">
                <div className="grid gap-2 md:grid-cols-3">
                  <input
                    className="rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={ticketType.name || ''}
                    onChange={e => updateTicketType(index, 'name', e.target.value)}
                    placeholder="Option name"
                  />
                  <input
                    type="number"
                    className="rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={ticketType.price ?? 0}
                    onChange={e => updateTicketType(index, 'price', Number(e.target.value))}
                    placeholder="Price"
                  />
                  <input
                    type="number"
                    className="rounded-lg border border-slate-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={ticketType.capacity ?? 1}
                    onChange={e => updateTicketType(index, 'capacity', Number(e.target.value))}
                    placeholder="Capacity"
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button type="button" onClick={() => removeTicketType(index)} className="text-sm text-rose-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Banner (optional)</label>
          <input type="file" onChange={e=>setBanner(e.target.files[0])} />
        </div>
        <div>
          <button className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-3 text-white shadow-md sm:w-auto sm:py-2">Save</button>
        </div>
      </form>
    </div>
  )
}
