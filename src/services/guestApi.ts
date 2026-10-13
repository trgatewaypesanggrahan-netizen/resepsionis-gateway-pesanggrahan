import { Guest, GuestCheckInPayload, GuestCheckOutPayload, GuestFilterOptions, DashboardStats } from '../types/guest';

const BASE_URL = '/api/guests';

export async function fetchGuests(filters?: GuestFilterOptions): Promise<Guest[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.bulan) params.set('bulan', filters.bulan);
    if (filters?.unit) params.set('unit', filters.unit);

    const res = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!res.ok) throw new Error('Gagal mengambil data tamu');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Fetch guests error:', err);
    // Local fallback if server is unreachable
    const local = localStorage.getItem('gw_backup_guests');
    if (local) return JSON.parse(local);
    return [];
  }
}

export async function fetchStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${BASE_URL}/stats`);
    if (!res.ok) throw new Error('Gagal mengambil statistik');
    return await res.json();
  } catch (err) {
    console.error('Fetch stats error:', err);
    return {
      totalHariIni: 0,
      aktifHariIni: 0,
      keluarHariIni: 0,
      totalKeseluruhan: 0,
      tujuanPopuler: [],
    };
  }
}

export async function fetchGuestByToken(token: string): Promise<Guest> {
  const res = await fetch(`${BASE_URL}/token/${encodeURIComponent(token)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Barcode / Token tamu tidak ditemukan di sistem.');
  }
  const json = await res.json();
  return json.data;
}

export async function lookupGuestTicket(query: string): Promise<Guest> {
  const res = await fetch(`${BASE_URL}/lookup/${encodeURIComponent(query)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Tiket tamu tidak ditemukan. Periksa kembali Nomor HP atau Nomor Kartu.');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchGuestById(id: string): Promise<Guest> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Tamu tidak ditemukan.');
  }
  const json = await res.json();
  return json.data;
}

export async function submitCheckIn(payload: GuestCheckInPayload): Promise<Guest> {
  const res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal menyimpan check-in');
  }

  const json = await res.json();
  return json.data;
}

export async function submitCheckOut(id: string, payload: GuestCheckOutPayload): Promise<Guest> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal memproses check-out');
  }

  const json = await res.json();
  return json.data;
}

export async function updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal memperbarui tamu');
  }

  const json = await res.json();
  return json.data;
}

export async function deleteGuest(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal menghapus data tamu');
  }
}

export async function resetDemoData(): Promise<Guest[]> {
  const res = await fetch(`${BASE_URL}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Gagal mereset data');
  const json = await res.json();
  return json.data || [];
}
