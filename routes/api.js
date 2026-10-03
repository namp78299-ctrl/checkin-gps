const express = require('express');
const QRCode = require('qrcode');
const { validateLocationInput } = require('../utils/validation');

/**
 * Nhận diện loại thiết bị rõ ràng từ User-Agent
 * @param {string} ua
 * @returns {string}
 */
function detectDevice(ua) {
  if (!ua || ua === 'Unknown') return 'Không xác định';
  if (/iPhone/i.test(ua)) return 'Điện thoại (iPhone - iOS)';
  if (/iPad/i.test(ua)) return 'Máy tính bảng (iPad)';
  if (/Android.*Mobile/i.test(ua) || /Mobile.*Android/i.test(ua)) return 'Điện thoại (Android)';
  if (/Android/i.test(ua)) return 'Máy tính bảng (Android Tablet)';
  if (/Windows NT/i.test(ua) || /Windows/i.test(ua)) return 'Máy tính (Windows PC)';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Máy tính (Apple MacBook/Mac)';
  if (/Linux/i.test(ua)) return 'Máy tính (Linux PC)';
  return 'Thiết bị khác';
}

/**
 * Creates API router for receiving location data
 * @param {import('../utils/ringBuffer')} ringBuffer
 * @param {(eventName: string, data: any) => void} broadcast
 */
function createApiRouter(ringBuffer, broadcast) {
  const router = express.Router();

  router.post('/location', (req, res, next) => {
    try {
      const { lat, lng, accuracy, name, code, ua, ts } = req.body || {};

      // Server-side validation
      const validationError = validateLocationInput({ lat, lng, accuracy, name });
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const uaString = typeof ua === 'string' && ua.trim() ? ua.trim().slice(0, 255) : (req.headers['user-agent'] || 'Unknown');
      const deviceType = detectDevice(uaString);

      // Build sanitized record
      const record = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 100) : 'Khách tham dự',
        code: typeof code === 'string' && code.trim() ? code.trim().slice(0, 50) : '',
        device: deviceType,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        accuracy: Math.round(accuracy * 10) / 10,
        ua: uaString,
        ts: typeof ts === 'number' && !Number.isNaN(ts) ? ts : Date.now()
      };

      // In thông tin trực tiếp ra màn hình CMD
      const timeStr = new Date(record.ts).toLocaleTimeString('vi-VN', { hour12: false });
      const dateStr = new Date(record.ts).toLocaleDateString('vi-VN');
      console.log('\n================== [CHECK-IN MỚI] ==================');
      console.log(`⏰ Thời gian:      ${timeStr} - ${dateStr}`);
      console.log(`👤 Người tham dự:  ${record.name}${record.code ? ` (Mã/SĐT: ${record.code})` : ''}`);
      console.log(`📱 Thiết bị:       ${record.device}`);
      console.log(`📍 Tọa độ GPS:     ${record.lat}, ${record.lng}`);
      console.log(`🎯 Độ chính xác:   ±${record.accuracy} mét`);
      console.log(`🗺️  Google Maps:    https://www.google.com/maps?q=${record.lat},${record.lng}`);
      console.log('====================================================\n');

      // Push to in-memory ring buffer (max 100)
      ringBuffer.push(record);

      // Realtime push to admin dashboard clients via SSE
      broadcast('location', record);

      return res.status(201).json({
        success: true,
        id: record.id
      });
    } catch (err) {
      next(err);
    }
  });

  // Endpoint xem toàn bộ dữ liệu thô dạng JSON
  router.get('/locations', (req, res) => {
    res.json({
      total: ringBuffer.size(),
      maxCapacity: ringBuffer.capacity,
      data: ringBuffer.getAll()
    });
  });

  // Endpoint tạo mã QR từ URL bất kỳ để chia sẻ cho điện thoại quét
  router.get('/qr', async (req, res, next) => {
    try {
      const targetUrl = req.query.url || `${req.protocol}://${req.get('host')}/`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        margin: 2,
        width: 260,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      res.json({ qr: qrDataUrl, url: targetUrl });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createApiRouter;
