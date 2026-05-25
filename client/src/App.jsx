import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetails from './pages/EventDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import MyTickets from './pages/MyTickets'
import Scanner from './pages/Scanner'
import AdminEvents from './pages/admin/AdminEvents'
import AdminEventForm from './pages/admin/AdminEventForm'
import AdminAttendees from './pages/admin/AdminAttendees'
import AdminStats from './pages/admin/AdminStats'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-fuchsia-50">
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/admin" element={<AdminEvents />} />
          <Route path="/admin/new" element={<AdminEventForm />} />
          <Route path="/admin/:id" element={<AdminEventForm />} />
          <Route path="/admin/:id/attendees" element={<AdminAttendees />} />
          <Route path="/admin/:id/stats" element={<AdminStats />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="/scanner" element={<Scanner />} />
        </Routes>
      </main>
    </div>
  )
}
