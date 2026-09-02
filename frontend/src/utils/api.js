const API_URL = import.meta.env.VITE_API_URL || 'http://seebus.local/api'

// disimpan di sessionStorage supaya tetap sama selama sesi booking berjalan.
export function getSessionId() {
  const key = 'seebus_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `sid-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(key, id)
  }
  return id
}
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


async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  })
}
export const api = {
  getWilayah: async () => {
    const res = await apiFetch(`${API_URL}/wilayah`)
    const json = await handleResponse(res)
    return json.data
  },
  cariJadwal: async ({ dari, tujuan, tanggal }) => {
    const params = new URLSearchParams({
      dari,
      tujuan,
      tanggal,
    })
    const res = await apiFetch(`${API_URL}/jadwal?${params}`)
    const json = await handleResponse(res)
    return json.data
  },
  getKursi: async (availabilityId) => {
    const res = await apiFetch(`${API_URL}/jadwal/${availabilityId}/kursi`)
    const json = await handleResponse(res)
    return json.data
  },
  kirimPesan: async ({ nama, email, subjek, pesan }) => {
    const res = await apiFetch(`${API_URL}/pesan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama,
        email,
        subjek,
        pesan,
      }),
    })
    return handleResponse(res)
  },
  login: async ({ email, password }) => {
    const res = await apiFetch(`${API_URL}/login`, {
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
    const res = await apiFetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getMe: async () => {
    const res = await apiFetch(`${API_URL}/user`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  lockKursi: async ({ availability_id, nomor_kursi }) => {
    const res = await apiFetch(`${API_URL}/kursi/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        availability_id,
        nomor_kursi,
        session_id: getSessionId(),
      }),
    })
    return handleResponse(res)
  },
  unlockKursi: async ({ availability_id, nomor_kursi }) => {
    const res = await apiFetch(`${API_URL}/kursi/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        availability_id,
        nomor_kursi,
        session_id: getSessionId(),
      }),
    })
    return handleResponse(res)
  },
  createBooking: async (payload) => {
    const res = await apiFetch(`${API_URL}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  lookupBooking: async ({ bk_code, email }) => {
    const res = await apiFetch(`${API_URL}/booking/lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bk_code, email }),
    })
    const json = await handleResponse(res)
    return json.data
  },
  createPaypalOrder: async ({ booking_id }) => {
    const res = await apiFetch(`${API_URL}/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id }),
    })
    return handleResponse(res)
  },
  capturePaypalOrder: async ({ booking_id, orderID }) => {
    const res = await apiFetch(`${API_URL}/paypal/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id, orderID }),
    })
    return handleResponse(res)
  },
  getAdminPesan: async ({ status, cari, page } = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (cari) params.set('cari', cari)
    if (page) params.set('page', page)
    const res = await apiFetch(`${API_URL}/admin/pesan?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tandaiPesanDibaca: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/pesan/${id}/baca`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  hapusPesan: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/pesan/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminJadwal: async ({ tanggal, page } = {}) => {
    const params = new URLSearchParams()
    if (tanggal) params.set('tanggal', tanggal)
    if (page) params.set('page', page)
    const res = await apiFetch(`${API_URL}/admin/jadwal?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminJadwalOptions: async () => {
    const res = await apiFetch(`${API_URL}/admin/jadwal-options`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tambahJadwal: async (payload) => {
    const res = await apiFetch(`${API_URL}/admin/jadwal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  generateJadwal: async (payload) => {
    const res = await apiFetch(`${API_URL}/admin/jadwal/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  ubahJadwal: async (id, payload) => {
    const res = await apiFetch(`${API_URL}/admin/jadwal/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  nonaktifkanJadwal: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/jadwal/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminBusType: async ({ cari, page } = {}) => {
    const params = new URLSearchParams()
    if (cari) params.set('cari', cari)
    if (page) params.set('page', page)
    const res = await apiFetch(`${API_URL}/admin/bus-type?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminBusTypeOptions: async () => {
    const res = await apiFetch(`${API_URL}/admin/bus-type-options`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tambahBusType: async (payload) => {
    const res = await apiFetch(`${API_URL}/admin/bus-type`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  ubahBusType: async (id, payload) => {
    const res = await apiFetch(`${API_URL}/admin/bus-type/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  hapusBusType: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/bus-type/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminRoute: async ({ cari, page } = {}) => {
    const params = new URLSearchParams()
    if (cari) params.set('cari', cari)
    if (page) params.set('page', page)
    const res = await apiFetch(`${API_URL}/admin/route?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminRouteOptions: async () => {
    const res = await apiFetch(`${API_URL}/admin/route-options`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tambahRoute: async (payload) => {
    const res = await apiFetch(`${API_URL}/admin/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  ubahRoute: async (id, payload) => {
    const res = await apiFetch(`${API_URL}/admin/route/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  hapusRoute: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/route/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminStation: async ({ cari, page } = {}) => {
    const params = new URLSearchParams()
    if (cari) params.set('cari', cari)
    if (page) params.set('page', page)
    const res = await apiFetch(`${API_URL}/admin/station?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminStationOptions: async () => {
    const res = await apiFetch(`${API_URL}/admin/station-options`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tambahStation: async (payload) => {
    const res = await apiFetch(`${API_URL}/admin/station`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  ubahStation: async (id, payload) => {
    const res = await apiFetch(`${API_URL}/admin/station/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  hapusStation: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/station/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
}