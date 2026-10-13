import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  nama_lengkap: string;
  role: 'ADMIN' | 'PETUGAS';
  created_at?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PETUGAS'>('PETUGAS');

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setPassword('');
    setNamaLengkap('');
    setRole('PETUGAS');
    setError('');
    setSuccess('');
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/guests/users');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (err) {
      setError('Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      resetForm();
    }
  }, [isOpen]);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setUsername(user.username);
    setNamaLengkap(user.nama_lengkap);
    setRole(user.role);
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = editingId ? `/api/guests/users/${editingId}` : '/api/guests/users';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          nama_lengkap: namaLengkap,
          role,
        }),
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');

      setSuccess(editingId ? 'User berhasil diperbarui' : 'User berhasil ditambahkan');
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/guests/users/${id}`, { method: 'DELETE' });
      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) throw new Error(data.error || 'Gagal menghapus user');

      setSuccess('User berhasil dihapus');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 p-6 text-white shadow-2xl border border-slate-800 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold">⚙️ Kelola Akun Petugas / Admin</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">{error}</div>}
        {success && <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">{success}</div>}

        {/* Form Tambah / Edit */}
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: budi123"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password {editingId && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
            </label>
            <input
              type="password"
              required={!editingId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Role / Hak Akses</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'PETUGAS')}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="PETUGAS">PETUGAS</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 mt-2">
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
                Batal Edit
              </button>
            )}
            <button type="submit" className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold">
              {editingId ? 'Simpan Perubahan' : '+ Tambah User'}
            </button>
          </div>
        </form>

        {/* Tabel Daftar User */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase">
              <tr>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Username</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Memuat data user...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Belum ada user.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-white">{u.nama_lengkap}</td>
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button type="button" onClick={() => handleEdit(u)} className="px-2 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded">
                        Edit
                      </button>
                      {u.id !== 1 && (
                        <button type="button" onClick={() => handleDelete(u.id)} className="px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded">
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};