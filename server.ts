import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Temporary upload folder
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max per file
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Peer & Room Management
export interface DevicePeer {
  id: string;
  name: string;
  type: 'mobile' | 'desktop';
  platform: 'iOS' | 'macOS' | 'Windows' | 'Android' | 'Linux' | 'Other';
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  joinedAt: number;
  lastActive: number;
}

export interface SharedFileItem {
  id: string;
  filename: string;
  storedPath: string;
  size: number;
  mimetype: string;
  senderId: string;
  senderName: string;
  targetId?: string;
  roomCode: string;
  userEmail?: string;
  createdAt: number;
  downloadCount: number;
  packageId?: string;
  orderIndex?: number;
}

export interface SharedPackageItem {
  id: string;
  name: string;
  files: SharedFileItem[];
  totalSize: number;
  senderId: string;
  senderName: string;
  targetId?: string;
  roomCode: string;
  userEmail?: string;
  createdAt: number;
  downloadCount: number;
}

export interface SharedTextItem {
  id: string;
  text: string;
  type: 'text' | 'url';
  senderId: string;
  senderName: string;
  roomCode: string;
  createdAt: number;
}

// In-memory state
const rooms = new Map<string, Map<string, DevicePeer>>();
const sseClients = new Map<string, { res: Response; peer: DevicePeer }>();
const sharedFiles = new Map<string, SharedFileItem>();
const sharedPackages = new Map<string, SharedPackageItem>();
const sharedTexts: SharedTextItem[] = [];

// Helper to broadcast SSE event to all peers in a room
function broadcastToRoom(roomCode: string, eventName: string, data: any, excludePeerId?: string) {
  const roomPeers = rooms.get(roomCode);
  if (!roomPeers) return;

  for (const peerId of roomPeers.keys()) {
    if (excludePeerId && peerId === excludePeerId) continue;
    const client = sseClients.get(peerId);
    if (client) {
      try {
        client.res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('SSE write error to peer', peerId, err);
      }
    }
  }
}

// Clean up stale files & packages every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, file] of sharedFiles.entries()) {
    if (now - file.createdAt > 3 * 3600 * 1000) {
      try {
        if (fs.existsSync(file.storedPath)) {
          fs.unlinkSync(file.storedPath);
        }
      } catch (e) {
        // ignore
      }
      sharedFiles.delete(id);
    }
  }
  for (const [id, pkg] of sharedPackages.entries()) {
    if (now - pkg.createdAt > 3 * 3600 * 1000) {
      sharedPackages.delete(id);
    }
  }
}, 30 * 60 * 1000);

// API: Configuration endpoint for QR code pairing URLs
app.get('/api/config', (req: Request, res: Response) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const detectedUrl = host ? `${proto}://${host}` : '';
  const appUrl = process.env.APP_URL || detectedUrl;
  const sharedUrl = 'https://ais-pre-3osiqoney2doeixxvcqgom-538328217497.us-east1.run.app';
  const devUrl = 'https://ais-dev-3osiqoney2doeixxvcqgom-538328217497.us-east1.run.app';

  res.json({
    appUrl,
    detectedUrl,
    sharedUrl,
    devUrl,
    userEmail: 'contosf47@gmail.com',
  });
});

// API: Server-Sent Events Endpoint for real-time presence & transfers
app.get('/api/events', (req: Request, res: Response) => {
  const peerId = (req.query.peerId as string) || `peer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const roomCode = ((req.query.room as string) || 'default').toUpperCase().trim();
  const name = (req.query.name as string) || 'Dispositivo';
  const type = (req.query.type as 'mobile' | 'desktop') || 'desktop';
  const platform = (req.query.platform as DevicePeer['platform']) || 'Other';
  const userEmail = (req.query.userEmail as string) || undefined;
  const userName = (req.query.userName as string) || undefined;
  const userAvatar = (req.query.userAvatar as string) || undefined;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const peer: DevicePeer = {
    id: peerId,
    name,
    type,
    platform,
    userEmail,
    userName,
    userAvatar,
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };

  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, new Map());
  }
  const room = rooms.get(roomCode)!;
  room.set(peerId, peer);

  sseClients.set(peerId, { res, peer });

  // Initial handshake data
  const currentPeers = Array.from(room.values());
  const roomFiles = Array.from(sharedFiles.values())
    .filter(f => f.roomCode === roomCode && !f.packageId)
    .slice(-30);
  const roomPackages = Array.from(sharedPackages.values())
    .filter(p => p.roomCode === roomCode)
    .slice(-20);
  const roomTexts = sharedTexts
    .filter(t => t.roomCode === roomCode)
    .slice(-20);

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      peerId,
      roomCode,
      peers: currentPeers,
      files: roomFiles,
      packages: roomPackages,
      texts: roomTexts,
    })}\n\n`
  );

  // Broadcast peer joined
  broadcastToRoom(roomCode, 'peer-joined', { peer, peers: Array.from(room.values()) }, peerId);

  // Heartbeat every 15s
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(peerId);
    if (rooms.has(roomCode)) {
      const r = rooms.get(roomCode)!;
      r.delete(peerId);
      if (r.size === 0) {
        rooms.delete(roomCode);
      } else {
        broadcastToRoom(roomCode, 'peer-left', { peerId, peers: Array.from(r.values()) });
      }
    }
  });
});

// API: Heartbeat
app.post('/api/heartbeat', (req: Request, res: Response) => {
  const { peerId, roomCode } = req.body;
  if (roomCode && peerId && rooms.has(roomCode)) {
    const peer = rooms.get(roomCode)?.get(peerId);
    if (peer) {
      peer.lastActive = Date.now();
    }
  }
  res.json({ status: 'ok' });
});

// API: WebRTC Signaling Relay
app.post('/api/signal', (req: Request, res: Response) => {
  const { roomCode, fromPeerId, targetPeerId, signalType, payload } = req.body;
  if (!roomCode || !targetPeerId) {
    res.status(400).json({ error: 'Missing roomCode or targetPeerId' });
    return;
  }

  const client = sseClients.get(targetPeerId);
  if (client) {
    try {
      client.res.write(`event: signal\ndata: ${JSON.stringify({ fromPeerId, signalType, payload })}\n\n`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to dispatch signal' });
    }
  } else {
    res.status(404).json({ error: 'Target peer not connected' });
  }
});

// API: Upload files (individual or as an organized package)
app.post('/api/upload', upload.array('files', 50), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const { roomCode, senderId, senderName, targetId, userEmail, isPackage, packageName } = req.body;

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const targetRoom = (roomCode || 'DEFAULT').toUpperCase().trim();
  const shouldCreatePackage = isPackage === 'true' || (files.length > 1 && packageName);
  const packageId = shouldCreatePackage
    ? `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    : undefined;

  const uploadedRecords: SharedFileItem[] = [];
  let totalPackageSize = 0;

  files.forEach((f, idx) => {
    const fileId = `file_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
    let originalName = f.originalname;
    try {
      originalName = Buffer.from(f.originalname, 'latin1').toString('utf8');
    } catch {
      // keep originalName
    }

    const item: SharedFileItem = {
      id: fileId,
      filename: originalName,
      storedPath: f.path,
      size: f.size,
      mimetype: f.mimetype || 'application/octet-stream',
      senderId: senderId || 'anonymous',
      senderName: senderName || 'Desconhecido',
      targetId: targetId || undefined,
      roomCode: targetRoom,
      userEmail: userEmail || undefined,
      createdAt: Date.now(),
      downloadCount: 0,
      packageId,
      orderIndex: idx + 1,
    };

    totalPackageSize += f.size;
    sharedFiles.set(fileId, item);
    uploadedRecords.push(item);
  });

  if (shouldCreatePackage && packageId) {
    const defaultPkgName = packageName && packageName.trim()
      ? packageName.trim()
      : `Pacote com ${uploadedRecords.length} arquivos`;

    const packageItem: SharedPackageItem = {
      id: packageId,
      name: defaultPkgName,
      files: uploadedRecords,
      totalSize: totalPackageSize,
      senderId: senderId || 'anonymous',
      senderName: senderName || 'Desconhecido',
      targetId: targetId || undefined,
      roomCode: targetRoom,
      userEmail: userEmail || undefined,
      createdAt: Date.now(),
      downloadCount: 0,
    };

    sharedPackages.set(packageId, packageItem);

    // Broadcast package added
    broadcastToRoom(targetRoom, 'package-added', { package: packageItem });

    res.json({
      success: true,
      isPackage: true,
      package: packageItem,
      count: uploadedRecords.length,
    });
  } else {
    // Broadcast individual files added
    broadcastToRoom(targetRoom, 'files-added', { files: uploadedRecords, senderId, senderName });

    res.json({
      success: true,
      isPackage: false,
      count: uploadedRecords.length,
      files: uploadedRecords,
    });
  }
});

// API: Download single file
app.get('/api/download/:fileId', (req: Request, res: Response) => {
  const { fileId } = req.params;
  const file = sharedFiles.get(fileId);

  if (!file || !fs.existsSync(file.storedPath)) {
    res.status(404).send('Arquivo não encontrado ou expirado.');
    return;
  }

  file.downloadCount += 1;
  const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';

  res.setHeader('Content-Type', file.mimetype);
  res.setHeader(
    'Content-Disposition',
    `${disposition}; filename*=UTF-8''${encodeURIComponent(file.filename)}`
  );

  const fileStream = fs.createReadStream(file.storedPath);
  fileStream.pipe(res);
});

// API: Download entire package as a single ZIP file
app.get('/api/packages/:packageId/zip', (req: Request, res: Response) => {
  const { packageId } = req.params;
  const pkg = sharedPackages.get(packageId);

  if (!pkg || !pkg.files || pkg.files.length === 0) {
    res.status(404).send('Pacote não encontrado ou vazio.');
    return;
  }

  pkg.downloadCount += 1;

  const zipFilename = `${pkg.name.replace(/[^a-zA-Z0-9_\-\.\u00C0-\u00FF]/g, '_')}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(zipFilename)}`
  );

  const archive = new ZipArchive({
    zlib: { level: 6 },
  });

  archive.on('error', (err: any) => {
    console.error('Archive error:', err);
    if (!res.headersSent) {
      res.status(500).send('Erro ao gerar arquivo compactado do pacote.');
    }
  });

  archive.pipe(res);

  // Add each file to the archive preserving its clean name
  for (const file of pkg.files) {
    if (fs.existsSync(file.storedPath)) {
      archive.file(file.storedPath, { name: file.filename });
    }
  }

  archive.finalize();
});

// API: Delete package and its files
app.delete('/api/packages/:packageId', (req: Request, res: Response) => {
  const { packageId } = req.params;
  const pkg = sharedPackages.get(packageId);

  if (pkg) {
    for (const f of pkg.files) {
      try {
        if (fs.existsSync(f.storedPath)) {
          fs.unlinkSync(f.storedPath);
        }
      } catch {
        // ignore
      }
      sharedFiles.delete(f.id);
    }
    const room = pkg.roomCode;
    sharedPackages.delete(packageId);
    broadcastToRoom(room, 'package-deleted', { packageId });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Package not found' });
  }
});

// API: Delete single file
app.delete('/api/files/:fileId', (req: Request, res: Response) => {
  const { fileId } = req.params;
  const file = sharedFiles.get(fileId);
  if (file) {
    try {
      if (fs.existsSync(file.storedPath)) {
        fs.unlinkSync(file.storedPath);
      }
    } catch {
      // ignore
    }
    const room = file.roomCode;
    sharedFiles.delete(fileId);
    broadcastToRoom(room, 'file-deleted', { fileId });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// API: Share quick text / link between devices
app.post('/api/share-text', (req: Request, res: Response) => {
  const { text, type, senderId, senderName, roomCode } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Text cannot be empty' });
    return;
  }

  const room = (roomCode || 'DEFAULT').toUpperCase().trim();
  const textItem: SharedTextItem = {
    id: `txt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    text: text.trim(),
    type: type === 'url' ? 'url' : 'text',
    senderId: senderId || 'anonymous',
    senderName: senderName || 'Dispositivo',
    roomCode: room,
    createdAt: Date.now(),
  };

  sharedTexts.push(textItem);
  if (sharedTexts.length > 50) {
    sharedTexts.shift();
  }

  broadcastToRoom(room, 'text-added', { item: textItem });
  res.json({ success: true, item: textItem });
});

// Setup Vite or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AirShare Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
