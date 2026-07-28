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
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}
export const api = {
  getWilayah: async () => {
    const res = await fetch(`${API_URL}/wilayah`)
    const json = await handleResponse(res)
    return json.data
  },
  cariJadwal: async ({ dari, tujuan, tanggal }) => {
    const params = new URLSearchParams({
      dari,
      tujuan,
      tanggal,
    })
    const res = await fetch(`${API_URL}/jadwal?${params}`)
    const json = await handleResponse(res)
    return json.data
  },
  getKursi: async (availabilityId) => {
    const res = await fetch(`${API_URL}/jadwal/${availabilityId}/kursi`)
    const json = await handleResponse(res)
    return json.data
  },
  kirimPesan: async ({ nama, email, pesan }) => {
    const res = await fetch(`${API_URL}/pesan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama,
        email,
        pesan,
      }),
    })
    return handleResponse(res)
  },
  login: async ({ email, password }) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
    return handleResponse(res)
  },
  logout: async () => {
    const res = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getMe: async () => {
    const res = await fetch(`${API_URL}/user`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  createBooking: async (payload) => {
    const res = await fetch(`${API_URL}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  createPaypalOrder: async ({ booking_id }) => {
    const res = await fetch(`${API_URL}/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id }),
    })
    return handleResponse(res)
  },
  capturePaypalOrder: async ({ booking_id, orderID }) => {
    const res = await fetch(`${API_URL}/paypal/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id, orderID }),
    })
    return handleResponse(res)
  },
}