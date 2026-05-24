import React, { useState } from 'react'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'
import { setAuth } from '../utils/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    try {
      const r = await api.post('/auth/login', { email, password })
      setAuth(r.data)
      nav('/')
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-lg border border-slate-300 p-2 outline-none ring-0 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" className="w-full rounded-lg border border-slate-300 p-2 outline-none ring-0 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700">Login</button>
      </form>
    </div>
  )
}
