import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  const router = express.Router();

  // Health check
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 1. LOGIN AUTH
  router.post('/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan Password wajib diisi' });
      }

      const [rows]: any = await pool.query(
        'SELECT id, username, nama_lengkap, role FROM users WHERE username = ? AND password = ?',
        [username.trim(), password.trim()]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Username atau Password salah' });
      }

      const user = rows[0];
      res.json({
        message: 'Login berhasil',
        user: {
          id: user.id,
          username: user.username,
          nama: user.nama_lengkap,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Error Login:', err);
      res.status(500).json({ error: 'Gagal memproses login' });
    }
  });

  // 2. MANAJEMEN USER (CRUD)
  router.get('/users', async (_req, res) => {
    try {
      const [rows]: any = await pool.query(
        'SELECT id, username, nama_lengkap, role, created_at FROM users ORDER BY created_at DESC'
      );
      res.json({ data: rows });
    } catch (err) {
      console.error('Error Get Users:', err);
      res.status(500).json({ error: 'Gagal mengambil data user' });
    }
  });

  router.post('/users', async (req, res) => {
    try {
      const { username, password, nama_lengkap, role } = req.body;

      if (!username || !password || !nama_lengkap) {
        return res.status(400).json({ error: 'Username, Password, dan Nama Lengkap wajib diisi' });
      }

      const [existing]: any = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
      }

      await pool.query(
        'INSERT INTO users (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)',
        [username.trim(), password.trim(), nama_lengkap.trim(), role || 'PETUGAS']
      );

      res.status(201).json({ message: 'User berhasil ditambahkan' });
    } catch (err) {
      console.error('Error Add User:', err);
      res.status(500).json({ error: 'Gagal menambahkan user' });
    }
  });

  router.put('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, nama_lengkap, role } = req.body;

      if (!username || !nama_lengkap) {
        return res.status(400).json({ error: 'Username dan Nama Lengkap wajib diisi' });
      }

      if (password && password.trim() !== '') {
        await pool.query(
          'UPDATE users SET username = ?, password = ?, nama_lengkap = ?, role = ? WHERE id = ?',
          [username.trim(), password.trim(), nama_lengkap.trim(), role || 'PETUGAS', id]
        );
      } else {
        await pool.query(
          'UPDATE users SET username = ?, nama_lengkap = ?, role = ? WHERE id = ?',
          [username.trim(), nama_lengkap.trim(), role || 'PETUGAS', id]
        );
      }

      res.json({ message: 'Data user berhasil diperbarui' });
    } catch (err) {
      console.error('Error Edit User:', err);
      res.status(500).json({ error: 'Gagal memperbarui user' });
    }
  });

  router.delete('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;

      if (id === '1') {
        return res.status(400).json({ error: 'User Admin utama tidak dapat dihapus' });
      }

      const [result]: any = await pool.query('DELETE FROM users WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }

      res.json({ message: 'User berhasil dihapus' });
    } catch (err) {
      console.error('Error Delete User:', err);
      res.status(500).json({ error: 'Gagal menghapus user' });
    }
  });

  // 3. FITUR TAMU (GUESTS)
  router.get('/stats', async (_req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [rowsTotal]: any = await pool.query('SELECT COUNT(*) as total FROM guests');
      const [rowsToday]: any = await pool.query('SELECT COUNT(*) as totalHariIni FROM guests WHERE tanggal = ?', [today]);
      const [rowsActive]: any = await pool.query("SELECT COUNT(*) as aktifHariIni FROM guests WHERE tanggal = ? AND status = 'CHECKED_IN'", [today]);
      const [rowsOut]: any = await pool.query("SELECT COUNT(*) as keluarHariIni FROM guests WHERE tanggal = ? AND status = 'CHECKED_OUT'", [today]);

      const [popular]: any = await pool.query(`
        SELECT tujuan, COUNT(*) as count 
        FROM guests 
        GROUP BY tujuan 
        ORDER BY count DESC 
        LIMIT 5
      `);

      res.json({
        totalHariIni: rowsToday[0].totalHariIni,
        aktifHariIni: rowsActive[0].aktifHariIni,
        keluarHariIni: rowsOut[0].keluarHariIni,
        totalKeseluruhan: rowsTotal[0].total,
        tujuanPopuler: popular,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal mengambil statistik' });
    }
  });

  router.get('/', async (req, res) => {
    try {
      const { search, status, startDate, endDate, bulan, unit } = req.query;

      let query = 'SELECT * FROM guests WHERE 1=1';
      const params: any[] = [];

      if (search && typeof search === 'string') {
        query += ' AND (nama_tamu LIKE ? OR unit_tujuan LIKE ? OR nomor_kartu LIKE ? OR no_tlp LIKE ? OR tujuan LIKE ?)';
        const q = `%${search.trim()}%`;
        params.push(q, q, q, q, q);
      }

      if (status && status !== 'ALL' && typeof status === 'string') {
        query += ' AND status = ?';
        params.push(status);
      }

      if (bulan && typeof bulan === 'string') {
        query += ' AND tanggal LIKE ?';
        params.push(`${bulan}%`);
      }

      if (startDate && typeof startDate === 'string') {
        query += ' AND tanggal >= ?';
        params.push(startDate);
      }

      if (endDate && typeof endDate === 'string') {
        query += ' AND tanggal <= ?';
        params.push(endDate);
      }

      if (unit && typeof unit === 'string') {
        query += ' AND unit_tujuan LIKE ?';
        params.push(`%${unit.trim()}%`);
      }

      query += ' ORDER BY createdAt DESC';

      const [rows]: any = await pool.query(query, params);
      res.json({ total: rows.length, data: rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal mengambil data tamu' });
    }
  });

  router.get('/token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const [rows]: any = await pool.query('SELECT * FROM guests WHERE qr_code_token = ? OR id = ? OR nomor_kartu = ?', [token, token, token]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Data tamu tidak ditemukan' });
      }

      res.json({ data: rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Gagal mencari token' });
    }
  });

  router.get('/lookup/:query', async (req, res) => {
    try {
      const rawQuery = (req.params.query || '').trim();
      if (!rawQuery) {
        return res.status(400).json({ error: 'Parameter pencarian tidak boleh kosong' });
      }

      const searchDigits = rawQuery.replace(/[^0-9]/g, '');

      const [rows]: any = await pool.query(`
        SELECT * FROM guests 
        WHERE (no_tlp LIKE ? AND CHAR_LENGTH(?) >= 4)
           OR LOWER(nomor_kartu) = LOWER(?)
           OR LOWER(qr_code_token) = LOWER(?)
           OR LOWER(id) = LOWER(?)
        ORDER BY CASE WHEN status = 'CHECKED_IN' THEN 0 ELSE 1 END, createdAt DESC
      `, [`%${searchDigits}%`, searchDigits, rawQuery, rawQuery, rawQuery]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Tiket tamu tidak ditemukan' });
      }

      res.json({ data: rows[0], totalMatches: rows.length });
    } catch (err) {
      res.status(500).json({ error: 'Gagal mencari tiket' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query('SELECT * FROM guests WHERE id = ?', [id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Tamu tidak ditemukan' });
      }

      res.json({ data: rows[0] });
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengambil data tamu' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { nama_tamu, no_tlp, tujuan, unit_tujuan, identitas_yang_dititip, nomor_kartu, ttd_masuk, catatan } = req.body;

      if (!nama_tamu || !tujuan || !unit_tujuan || !ttd_masuk) {
        return res.status(400).json({ error: 'Harap lengkapi data wajib' });
      }

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const [todayCount]: any = await pool.query('SELECT COUNT(*) as count FROM guests WHERE tanggal = ?', [todayStr]);
      const seq = String(todayCount[0].count + 1).padStart(3, '0');
      const id = `GW-${yyyy}${mm}${dd}-${seq}`;

      const jam_masuk = now.toTimeString().split(' ')[0];
      const qr_code_token = `GW-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

      const [totalAll]: any = await pool.query('SELECT COUNT(*) as total FROM guests');
      const cardNum = nomor_kartu?.trim() || `VIS-${String(totalAll[0].total + 1).padStart(3, '0')}`;

      const query = `
        INSERT INTO guests 
        (id, tanggal, nama_tamu, no_tlp, tujuan, unit_tujuan, jam_masuk, ttd_masuk, identitas_yang_dititip, nomor_kartu, status, qr_code_token, catatan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CHECKED_IN', ?, ?)
      `;

      await pool.query(query, [
        id, todayStr, nama_tamu.trim(), no_tlp?.trim() || '-', tujuan.trim(), unit_tujuan.trim().toUpperCase(),
        jam_masuk, ttd_masuk, identitas_yang_dititip?.trim() || 'KTP', cardNum, qr_code_token, catatan?.trim() || null
      ]);

      const [newGuest]: any = await pool.query('SELECT * FROM guests WHERE id = ?', [id]);

      res.status(201).json({ message: 'Check-In berhasil dicatat', data: newGuest[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal menyimpan check-in' });
    }
  });

  router.post('/:id/checkout', async (req, res) => {
    try {
      const { id } = req.params;
      const { ttd_keluar, catatan } = req.body;

      const [rows]: any = await pool.query('SELECT * FROM guests WHERE id = ? OR qr_code_token = ?', [id, id]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Data tamu tidak ditemukan' });
      }

      const guest = rows[0];
      if (guest.status === 'CHECKED_OUT') {
        return res.status(400).json({ error: 'Tamu sudah melakukan Check-Out sebelumnya', data: guest });
      }

      const jam_keluar = new Date().toTimeString().split(' ')[0];
      const finalTtdKeluar = ttd_keluar || guest.ttd_masuk;

      let newCatatan = guest.catatan;
      if (catatan) {
        newCatatan = guest.catatan ? `${guest.catatan}; ${catatan}` : catatan;
      }

      await pool.query(`
        UPDATE guests 
        SET jam_keluar = ?, ttd_keluar = ?, status = 'CHECKED_OUT', catatan = ?
        WHERE id = ?
      `, [jam_keluar, finalTtdKeluar, newCatatan, guest.id]);

      const [updated]: any = await pool.query('SELECT * FROM guests WHERE id = ?', [guest.id]);

      res.json({ message: 'Check-Out berhasil diproses', data: updated[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Gagal memproses check-out' });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [result]: any = await pool.query('DELETE FROM guests WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Data tamu tidak ditemukan' });
      }

      res.json({ message: 'Data tamu berhasil dihapus' });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus data' });
    }
  });

  // PASANG ROUTER DI /api/guests
  app.use('/api/guests', router);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Buku Tamu Digital Gateway Pesanggrahan running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});