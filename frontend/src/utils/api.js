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
  getTitikPemberhentian: async (availabilityId) => {
    const res = await apiFetch(`${API_URL}/jadwal/${availabilityId}/titik-pemberhentian`)
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
  getAdminJadwal: async ({ tanggal, routeId, busUnitId, status, page } = {}) => {
    const params = new URLSearchParams()
    if (tanggal) params.set('tanggal', tanggal)
    if (routeId) params.set('route_id', routeId)
    if (busUnitId) params.set('bus_unit_id', busUnitId)
    if (status) params.set('status', status)
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
  getAdminBusUnit: async ({ cari, page, busTypeId } = {}) => {
    const params = new URLSearchParams()
    if (cari) params.set('cari', cari)
    if (page) params.set('page', page)
    if (busTypeId) params.set('bus_type_id', busTypeId)
    const res = await apiFetch(`${API_URL}/admin/bus-unit?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getAdminBusUnitOptions: async () => {
    const res = await apiFetch(`${API_URL}/admin/bus-unit-options`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tambahBusUnit: async (payload) => {
    const res = await apiFetch(`${API_URL}/admin/bus-unit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  ubahBusUnit: async (id, payload) => {
    const res = await apiFetch(`${API_URL}/admin/bus-unit/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  toggleBusUnitStatus: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/bus-unit/${id}/status`, {
      method: 'PATCH',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  hapusBusUnit: async (id) => {
    const res = await apiFetch(`${API_URL}/admin/bus-unit/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  getBookingRekap: async ({ mode, dari, sampai } = {}) => {
    const params = new URLSearchParams()
    if (mode) params.set('mode', mode)
    if (dari) params.set('dari', dari)
    if (sampai) params.set('sampai', sampai)
    const res = await apiFetch(`${API_URL}/admin/booking/rekap?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  exportBookingRekap: async ({ mode, dari, sampai } = {}) => {
    const params = new URLSearchParams()
    if (mode) params.set('mode', mode)
    if (dari) params.set('dari', dari)
    if (sampai) params.set('sampai', sampai)
    const res = await apiFetch(`${API_URL}/admin/booking/export?${params}`, {
      headers: {
        ...authHeaders(),
      },
    })
    if (!res.ok) throw new Error('Gagal mengekspor laporan.')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-penjualan-${mode || 'harian'}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
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
  getRouteStops: async (routeId) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tambahRouteStop: async (routeId, payload) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  ubahRouteStop: async (routeId, stopId, payload) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops/${stopId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  hapusRouteStop: async (routeId, stopId) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops/${stopId}`, {
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
  getRouteStops: async (routeId) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops`, {
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
  tambahRouteStop: async (routeId, payload) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  ubahRouteStop: async (routeId, stopId, payload) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops/${stopId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    })
    return handleResponse(res)
  },
  hapusRouteStop: async (routeId, stopId) => {
    const res = await apiFetch(`${API_URL}/admin/route/${routeId}/stops/${stopId}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders(),
      },
    })
    return handleResponse(res)
  },
}