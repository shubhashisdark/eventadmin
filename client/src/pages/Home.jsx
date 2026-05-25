import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl sm:p-8 lg:p-10">
      <div className="max-w-2xl">
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">Welcome</h1>
        <p className="mb-6 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base sm:leading-8">
          Browse upcoming events, choose your ticket option, and get QR tickets for fast entry.
        </p>
        <Link to="/events" className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:w-auto">
          Browse Events
        </Link>
      </div>
    </div>
  )
}
