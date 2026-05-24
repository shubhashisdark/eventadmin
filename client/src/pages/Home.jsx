import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Welcome</h1>
        <p className="mb-6 text-indigo-100">Browse upcoming events, choose your ticket option, and get QR tickets for fast entry.</p>
        <Link to="/events" className="inline-flex rounded-full bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50">Browse Events</Link>
      </div>
    </div>
  )
}
