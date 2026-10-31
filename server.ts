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
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });

  // Google Drive Video Streaming Proxy with Range Support and Local Disk Caching
  // Solves the mobile Google Drive preview controls obstruction and mobile playback errors completely.
  app.get('/api/drive-video/:fileId', async (req, res) => {
    const { fileId } = req.params;
    if (!fileId || fileId.length < 10) {
      return res.status(400).json({ error: 'ID do arquivo do Google Drive inválido' });
    }

    const cachedFilePath = path.join(MEDIA_DIR, `drive_${fileId}.mp4`);

    // If already cached locally on disk, stream directly with instant seek & range support
    if (fs.existsSync(cachedFilePath)) {
      const stat = fs.statSync(cachedFilePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(cachedFilePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        });
        return file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
        });
        return fs.createReadStream(cachedFilePath).pipe(res);
      }
    }

    // Direct stream from Google Drive with confirm=t
    try {
      const googleStreamUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
      }

      const googleRes = await fetch(googleStreamUrl, {
        headers: fetchHeaders,
      });

      if (!googleRes.ok && googleRes.status !== 206) {
        // Fallback: redirect to direct Google preview
        return res.redirect(`https://drive.google.com/file/d/${fileId}/preview`);
      }

      const contentType = googleRes.headers.get('content-type') || 'video/mp4';

      // If Google returned HTML (e.g. unknown confirmation), redirect to preview
      if (contentType.includes('text/html')) {
        return res.redirect(`https://drive.google.com/file/d/${fileId}/preview`);
      }

      const resHeaders: Record<string, string> = {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      const contentRange = googleRes.headers.get('content-range');
      const contentLength = googleRes.headers.get('content-length');

      if (contentRange) resHeaders['Content-Range'] = contentRange;
      if (contentLength) resHeaders['Content-Length'] = contentLength;

      res.writeHead(googleRes.status, resHeaders);

      if (googleRes.body) {
        // Pipe stream directly to client
        const stream = googleRes.body as any;
        if (typeof stream.pipe === 'function') {
          stream.pipe(res);
        } else {
          // Web stream to Node response
          const reader = googleRes.body.getReader();
          const pump = async () => {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              return;
            }
            res.write(value);
            await pump();
          };
          pump().catch(() => res.end());
        }
      } else {
        res.end();
      }

      // In background, cache to disk if it was a full request (range 0 or no range)
      if (!req.headers.range || req.headers.range.startsWith('bytes=0-')) {
        fetch(googleStreamUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }).then(async (downloadRes) => {
          if (downloadRes.ok && downloadRes.body) {
            const tempPath = path.join(MEDIA_DIR, `temp_${fileId}_${Date.now()}.mp4`);
            const fileStream = fs.createWriteStream(tempPath);
            const bodyStream = downloadRes.body as any;
            if (typeof bodyStream.pipe === 'function') {
              bodyStream.pipe(fileStream);
              fileStream.on('finish', () => {
                try {
                  fs.renameSync(tempPath, cachedFilePath);
                  console.log(`🎬 Vídeo do Google Drive salvo em cache local: drive_${fileId}.mp4`);
                } catch {}
              });
            }
          }
        }).catch(() => {});
      }

    } catch (err: any) {
      console.warn('Erro ao repassar stream do Google Drive:', err?.message || err);
      res.redirect(`https://drive.google.com/file/d/${fileId}/preview`);
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
