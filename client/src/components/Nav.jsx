import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAuth, getAuthUser, isLoggedIn, subscribeAuth } from '../utils/auth'

export default function Nav() {
  const nav = useNavigate()
  const [user, setUser] = useState(getAuthUser())
  const [logged, setLogged] = useState(isLoggedIn())

  useEffect(() => subscribeAuth(() => {
    setUser(getAuthUser())
    setLogged(isLoggedIn())
  }), [])

  function handleLogout() {
    clearAuth()
    setUser(null)
    setLogged(false)
    nav('/login')
  }

  return (
    <nav className="border-b border-slate-200 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="font-semibold text-base tracking-wide text-white sm:text-lg">Event Booking QR</div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
          <Link to="/events" className="rounded-full px-3 py-1 text-sm text-indigo-50 transition hover:bg-white/10 hover:text-white">Events</Link>
          {logged ? (
            <>
              <Link to="/tickets" className="rounded-full px-3 py-1 text-sm text-indigo-50 transition hover:bg-white/10 hover:text-white">My Tickets</Link>
              {user && user.role === 'admin' && (
                <Link to="/admin" className="rounded-full px-3 py-1 text-sm text-indigo-50 transition hover:bg-white/10 hover:text-white">Admin</Link>
              )}
              <button onClick={handleLogout} className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20">Login</Link>
              <Link to="/register" className="rounded-full bg-white px-3 py-1 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
