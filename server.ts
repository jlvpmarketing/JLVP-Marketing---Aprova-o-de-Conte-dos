import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

function readDatabase(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Erro ao ler db.json:', err);
  }
  return { clients: [], projects: [], posts: [], users: [], notifications: [], updatedAt: new Date().toISOString() };
}

function writeDatabase(data: any): void {
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar db.json:', err);
  }
}

async function startServer() {
  const app = express();

  // Allow up to 100MB body for video files and high-res media
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // --- API Routes ---

  // Full Database Sync
  app.get('/api/sync', (req, res) => {
    const db = readDatabase();
    res.json(db);
  });

  // Get Posts
  app.get('/api/posts', (req, res) => {
    const db = readDatabase();
    res.json(db.posts || []);
  });

  // Save / Update Post
  app.post('/api/posts', (req, res) => {
    const post = req.body;
    if (!post || !post.id) {
      return res.status(400).json({ error: 'Post inválido' });
    }

    const db = readDatabase();
    const posts: any[] = db.posts || [];
    const index = posts.findIndex(p => p.id === post.id);

    post.updatedAt = new Date().toISOString();

    if (index >= 0) {
      posts[index] = { ...posts[index], ...post };
    } else {
      posts.unshift(post);
    }

    db.posts = posts;
    writeDatabase(db);

    console.log(`📡 Post ${post.id} sincronizado no servidor com ${post.mediaUrls?.length || 0} mídias`);
    res.json({ success: true, post: posts[index >= 0 ? index : 0] });
  });

  // Delete Post
  app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const db = readDatabase();
    db.posts = (db.posts || []).filter((p: any) => p.id !== id);
    writeDatabase(db);
    res.json({ success: true });
  });

  // Media Upload (saves base64 video/image to disk and returns direct streaming URL)
  app.post('/api/media', (req, res) => {
    try {
      const { data, mimeType, name } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Dados da mídia ausentes' });
      }

      // If already a URL or Google Drive link, return as is
      if (typeof data === 'string' && (data.startsWith('http://') || data.startsWith('https://'))) {
        return res.json({ success: true, url: data });
      }

      let buffer: Buffer;
      let extension = 'mp4';

      if (data.startsWith('data:')) {
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
          if (mime.includes('jpeg') || mime.includes('jpg')) extension = 'jpg';
          else if (mime.includes('png')) extension = 'png';
          else if (mime.includes('webp')) extension = 'webp';
          else if (mime.includes('quicktime') || mime.includes('mov')) extension = 'mov';
          else extension = 'mp4';
        } else {
          return res.status(400).json({ error: 'Formato de base64 inválido' });
        }
      } else {
        buffer = Buffer.from(data, 'base64');
      }

      const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const fileName = `${mediaId}.${extension}`;
      const filePath = path.join(MEDIA_DIR, fileName);

      fs.writeFileSync(filePath, buffer);
      console.log(`🎬 Arquivo de mídia salvo no servidor: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

      res.json({
        success: true,
        url: `/api/media/${fileName}`,
        mediaId,
        size: buffer.length
      });
    } catch (err: any) {
      console.error('Erro ao processar mídia no servidor:', err);
      res.status(500).json({ error: err.message || 'Erro ao processar mídia' });
    }
  });

  // Media Streamer with HTTP 206 Range support (allows mobile Safari/Chrome to stream videos seamlessly)
  app.get('/api/media/:file', (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(MEDIA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'video/mp4';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.mov') contentType = 'video/quicktime';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Client Sync Endpoint
  app.post('/api/sync/client', (req, res) => {
    const { client, project, post } = req.body;
    const db = readDatabase();

    if (client) {
      const cIdx = (db.clients || []).findIndex((c: any) => c.id === client.id);
      if (cIdx >= 0) db.clients[cIdx] = client;
      else db.clients.push(client);
    }
    if (project) {
      const pIdx = (db.projects || []).findIndex((p: any) => p.id === project.id);
      if (pIdx >= 0) db.projects[pIdx] = project;
      else db.projects.push(project);
    }
    if (post) {
      const postIdx = (db.posts || []).findIndex((p: any) => p.id === post.id);
      if (postIdx >= 0) db.posts[postIdx] = post;
      else db.posts.unshift(post);
    }

    writeDatabase(db);
    res.json({ success: true });
  });

  // --- Vite / Frontend Middleware ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Aprovaflow Server rodando na porta ${PORT} (dev/full-stack)`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
