// Semua pemanggilan ke backend Laravel dikumpulkan di sini,
// supaya kalau nanti URL API berubah, cukup ganti di satu tempat.

const API_URL = import.meta.env.VITE_API_URL || 'http://seebus.local/api'

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.message || Object.values(data?.errors || {})[0]?.[0] || 'Terjadi kesalahan'
    throw new Error(message)
  }
  return data
}

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  // GET /api/wilayah -> daftar kota
  getWilayah: async () => {
    const res = await fetch(`${API_URL}/wilayah`)
    const json = await handleResponse(res)
    return json.data
  },

  // GET /api/jadwal?dari=&tujuan=&tanggal=
  cariJadwal: async ({ dari, tujuan, tanggal }) => {
    const params = new URLSearchParams({ dari, tujuan, tanggal })
    const res = await fetch(`${API_URL}/jadwal?${params}`)
    const json = await handleResponse(res)
    return json.data
  },

  // GET /api/jadwal/{id}/kursi
  getKursi: async (availabilityId) => {
    const res = await fetch(`${API_URL}/jadwal/${availabilityId}/kursi`)
    const json = await handleResponse(res)
    return json.data
  },

  // POST /api/pesan
  kirimPesan: async ({ nama, email, pesan }) => {
    const res = await fetch(`${API_URL}/pesan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, email, pesan }),
    })
    return handleResponse(res)
  },

  // POST /api/register
  register: async ({ nama, email, password }) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, email, password }),
    })
    return handleResponse(res)
  },

  // POST /api/login
  login: async ({ email, password }) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse(res)
  },

  // POST /api/logout
  logout: async () => {
    const res = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { ...authHeaders() },
    })
    return handleResponse(res)
  },

  // GET /api/user
  getMe: async () => {
    const res = await fetch(`${API_URL}/user`, {
      headers: { ...authHeaders() },
    })
    return handleResponse(res)
  },
}
