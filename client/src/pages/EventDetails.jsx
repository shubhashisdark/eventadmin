import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'

export default function EventDetails() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState('')
  const [bookingBusy, setBookingBusy] = useState(false)

  useEffect(() => {
    api.get(`/events/${id}`).then(r => {
      const data = r.data
      setEvent(data)
      setSelectedTicketTypeId(data?.ticketTypes?.[0]?._id || '')
    }).catch(() => {})
  }, [id])

  if (!event) return <div>Loading...</div>

  const ticketTypes = Array.isArray(event.ticketTypes) ? event.ticketTypes : []
  const seatsLeft = Math.max(0, (event.capacity || 0) - (event.registeredCount || 0))

  async function handleBook() {
    const token = localStorage.getItem('accessToken')
    if (!token) return alert('Please login first')
    if (!selectedTicketTypeId) return alert('Please select a ticket option')

    setBookingBusy(true)
    try {
      const r = await api.post('/bookings', { eventId: id, ticketTypeId: selectedTicketTypeId })
      const qr = r.data.qrCode
      const w = window.open('about:blank')
      if (w) w.document.write(`<img src="${qr}" alt="QR ticket"/>`)
    } catch (e) {
      alert(e.response?.data?.message || 'Booking failed')
    } finally {
      setBookingBusy(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        {event.bannerUrl && (
          <img src={event.bannerUrl} alt={event.title} className="h-48 w-full object-cover sm:h-56 lg:h-64" />
        )}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">{event.title}</h2>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">{event.category} · {event.venue}</p>
              <p className="text-sm text-gray-600">{new Date(event.date).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-indigo-100 sm:min-w-[220px]">
              <div><span className="font-semibold">Status:</span> {event.status}</div>
              <div><span className="font-semibold">Capacity:</span> {event.capacity}</div>
              <div><span className="font-semibold">Booked:</span> {event.registeredCount || 0}</div>
              <div><span className="font-semibold">Seats left:</span> {seatsLeft}</div>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-800 sm:mt-5 sm:text-base">{event.description}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:p-6 lg:p-8">
        <h3 className="text-lg font-semibold sm:text-xl">Ticket Options</h3>
        <p className="mt-1 text-sm text-gray-600">Choose the option you want before booking.</p>

        {ticketTypes.length === 0 ? (
          <div className="mt-4 rounded bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            No ticket options are configured for this event yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ticketTypes.map((ticketType) => {
              const isSelected = selectedTicketTypeId === ticketType._id
              const available = typeof ticketType.capacity === 'number'
                ? Math.max(0, ticketType.capacity - (ticketType.sold || 0))
                : null

              return (
                <button
                  key={ticketType._id}
                  type="button"
                  onClick={() => setSelectedTicketTypeId(ticketType._id)}
                  className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-fuchsia-500 bg-fuchsia-50 shadow-md' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{ticketType.name}</div>
                      <div className="text-sm text-gray-600">Price: ${ticketType.price ?? 0}</div>
                    </div>
                    {isSelected && <span className="rounded-full bg-blue-600 px-2 py-1 text-xs text-white">Selected</span>}
                  </div>
                  <div className="mt-2 text-sm text-gray-700">Capacity: {ticketType.capacity}</div>
                  {available !== null && <div className="text-sm text-gray-700">Remaining: {available}</div>}
                  {ticketType.description && <div className="mt-2 text-sm text-gray-700">{ticketType.description}</div>}
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-3 text-white shadow-md disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 sm:w-auto sm:py-2"
            onClick={handleBook}
            disabled={bookingBusy || ticketTypes.length === 0}
          >
            {bookingBusy ? 'Booking...' : 'Book Now'}
          </button>
          <span className="text-sm text-gray-500">You must be logged in to book.</span>
        </div>
      </div>
    </div>
  )
}
