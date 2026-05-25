import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../utils/api'
import { getAuthUser } from '../utils/auth'

export default function Scanner() {
  const divRef = useRef(null)
  const qrRef = useRef(null)
  const [message, setMessage] = useState('Starting camera...')
  const [scanResult, setScanResult] = useState(null)

  useEffect(() => {
    const user = getAuthUser()
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      setMessage('Scanner requires a staff or admin account.')
      return () => {}
    }

    const id = 'html5qr'
    const qrcode = new Html5Qrcode(id)
    qrRef.current = qrcode
    qrcode.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, async (decoded) => {
      // decoded is the scanned string (JWT)
      try {
        setMessage('QR detected, verifying ticket...')
        const r = await api.post('/verify/scan', { qr: decoded })
        setScanResult(r.data)
        setMessage(`Scan result: ${r.data.status}`)
        alert(`Result: ${r.data.status}`)
      } catch (err) {
        setMessage(err.response?.data?.message || 'Scan failed')
        alert(err.response?.data?.message || 'Scan failed')
      }
    }).catch(err => {
      console.warn('scanner start failed', err)
      setMessage(err.message || 'Camera failed to start')
    })

    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(() => {}).finally(() => {
          qrRef.current.clear().catch(() => {})
        })
      }
    }
  }, [])

  return (
    <div className="rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold text-slate-900 sm:text-2xl">Scanner</h2>
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-950 p-2 sm:p-3">
        <div id="html5qr" ref={divRef} className="h-[300px] w-full overflow-hidden rounded-xl bg-slate-950 sm:h-[380px] lg:h-[420px]"></div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{message}</p>

      {scanResult?.customer && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="font-semibold">Customer Details</div>
          <div>Name: {scanResult.customer.name}</div>
          <div>Phone: {scanResult.customer.phone || 'N/A'}</div>
          <div>Email: {scanResult.customer.email}</div>
          <div>Ticket ID: {scanResult.ticketId}</div>
          <div>Booking ID: {scanResult.bookingId || 'N/A'}</div>
          <div>Event: {scanResult.event?.title || 'N/A'}</div>
        </div>
      )}
    </div>
  )
}
