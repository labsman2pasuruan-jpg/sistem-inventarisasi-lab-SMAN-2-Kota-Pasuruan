import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const callAppsScript = async (action: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
    if (!APPS_SCRIPT_URL) {
      throw new Error('GOOGLE_APPS_SCRIPT_URL is not defined in environment variables');
    }

    let url = APPS_SCRIPT_URL;
    const options: RequestInit = { method };

    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...data });
      url += (url.includes('?') ? '&' : '?') + params.toString();
    } else {
      options.body = JSON.stringify({ action, ...data });
      options.headers = { 'Content-Type': 'application/json' };
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Apps Script returned ${response.status}: ${text.substring(0, 100)}`);
    }

    const result = await response.json();
    if (result && result.error) {
      throw new Error(result.error);
    }
    return result;
  };

  // API Routes
  app.get('/api/items', async (req, res) => {
    try {
      const items = await callAppsScript('getItems');
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal mengambil data dari Google Sheets' });
    }
  });

  app.post('/api/items', async (req, res) => {
    try {
      const result = await callAppsScript('addItem', 'POST', req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/items/update-image', async (req, res) => {
    try {
      const result = await callAppsScript('updateItemImageUrl', 'POST', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await callAppsScript('getSettings');
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal mengambil pengaturan' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const result = await callAppsScript('updateSettings', 'POST', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memperbarui pengaturan' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    console.log('API POST /api/transactions - Body:', JSON.stringify(req.body));
    try {
      const result = await callAppsScript('addMultipleTransactions', 'POST', req.body);
      console.log('Apps Script Result:', JSON.stringify(result));
      res.json(result);
    } catch (error: any) {
      console.error('Transaction API Error:', error.message);
      res.status(400).json({ error: error.message || 'Gagal memproses transaksi di server' });
    }
  });

  app.get('/api/history', async (req, res) => {
    try {
      const history = await callAppsScript('getHistory');
      res.json(history);
    } catch (error: any) {
      console.error('History fetch error:', error);
      res.status(500).json({ error: error.message || 'Gagal mengambil riwayat transaksi' });
    }
  });

  app.post('/api/history/delete', async (req, res) => {
    try {
      const result = await callAppsScript('deleteHistory', 'POST', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/reports/generate', async (req, res) => {
    try {
      const result = await callAppsScript('generateReport', 'GET', req.query);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const user = await callAppsScript('login', 'POST', req.body);
      res.json(user);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Invalid credentials' });
    }
  });

  app.post('/api/register', async (req, res) => {
    try {
      const result = await callAppsScript('register', 'POST', req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  app.post('/api/sync-structure', async (req, res) => {
    try {
      const result = await callAppsScript('syncStructure', 'POST');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Sync failed' });
    }
  });

  app.post('/api/return-qr', async (req, res) => {
    try {
      const result = await callAppsScript('syncByQR', 'POST', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await callAppsScript('getUsers');
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal mengambil data pengguna' });
    }
  });

  app.post('/api/users/update-status', async (req, res) => {
    try {
      const result = await callAppsScript('updateUserStatus', 'POST', req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
