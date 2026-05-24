import React, { useState } from 'react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    try {
      await api.post('/auth/register', { name, email, password })
      nav('/login')
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Register</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" />
        <input className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (min 8)" />
        <button className="rounded-lg bg-fuchsia-600 px-4 py-2 text-white transition hover:bg-fuchsia-700">Register</button>
      </form>
    </div>
  )
}
