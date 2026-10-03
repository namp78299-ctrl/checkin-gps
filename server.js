const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const RingBuffer = require('./utils/ringBuffer');
const createSseRouter = require('./routes/sse');
const createApiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory ring buffer (maximum 100 entries, no database, no file persistence)
const ringBuffer = new RingBuffer(100);

// SSE broadcaster setup
const { router: sseRouter, broadcast } = createSseRouter(ringBuffer);
const apiRouter = createApiRouter(ringBuffer, broadcast);

// Middleware: Body parsing
app.use(express.json({ limit: '10kb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

let publicUrl = null;

// Endpoint lấy link public hiện tại
app.get('/api/public-url', (req, res) => {
  if (process.env.RENDER) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return res.json({ url: `${proto}://${req.get('host')}` });
  }
  res.json({ url: publicUrl });
});

// Specific routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API & SSE routes
app.use('/api', apiRouter);
app.use('/api/sse', sseRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint không tồn tại.' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Lỗi máy chủ nội bộ.' : err.message
  });
});

const server = app.listen(PORT, async () => {
  console.log(`[INFO] Server running at port ${PORT}`);
  console.log(`[INFO] Trang quản trị (Admin): http://localhost:${PORT}/admin`);

  // Nếu đang deploy trên Cloud (Render, Railway...) thì đã có sẵn HTTPS vĩnh viễn, không cần chạy Cloudflare
  if (process.env.RENDER) {
    console.log('[INFO] Đang chạy trên Cloud Render.com (Đã có sẵn HTTPS vĩnh viễn 24/7).');
    return;
  }

  console.log(`[INFO] Đang tạo đường link Cloudflare HTTPS công khai...`);

  // Tự động kích hoạt Cloudflare Quick Tunnel khi chạy tại máy cá nhân (Localhost)
  const cloudflaredBin = path.join(__dirname, 'node_modules', 'cloudflared', 'bin', 'cloudflared.exe');

  try {
    const tunnelProcess = spawn(cloudflaredBin, ['tunnel', '--url', `http://localhost:${PORT}`]);

    tunnelProcess.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match && !publicUrl) {
        publicUrl = match[0];

        console.log('\n========================================================');
        console.log('⚡ CLOUDFLARE TUNNEL SẴN SÀNG (VÀO THẲNG, KHÔNG CẦN NHẬP IP):');
        console.log(`👉 Link gửi bạn bè:  ${publicUrl}`);
        console.log(`📱 Mã QR trên Admin: http://localhost:${PORT}/admin đã tự cập nhật`);
        console.log('========================================================\n');

        broadcast('public-url', { url: publicUrl });
      }
    });

    tunnelProcess.on('close', () => {
      publicUrl = null;
    });

    const cleanup = () => {
      try { tunnelProcess.kill(); } catch (e) {}
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (err) {
    console.log('[WARN] Không thể khởi động Cloudflare Tunnel:', err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
