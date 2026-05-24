import React, { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../utils/api'

export default function Scanner() {
  const divRef = useRef(null)
  const qrRef = useRef(null)

  useEffect(() => {
    const id = 'html5qr'
    const qrcode = new Html5Qrcode(id)
    qrRef.current = qrcode
    qrcode.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, async (decoded) => {
      // decoded is the scanned string (JWT)
      try {
        const r = await api.post('/verify/scan', { qr: decoded })
        alert(`Result: ${r.data.status}`)
      } catch (err) {
        alert(err.response?.data?.message || 'Scan failed')
      }
    }).catch(err => console.warn('scanner start failed', err))

    return () => { qrRef.current && qrRef.current.stop().catch(()=>{}) }
  }, [])

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Scanner</h2>
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-fuchsia-950 p-3">
        <div id="html5qr" ref={divRef} className="h-[400px] w-full overflow-hidden rounded-xl bg-slate-950"></div>
      </div>
      <p className="mt-3 text-sm text-slate-600">Point the camera at the ticket QR code.</p>
    </div>
  )
}
