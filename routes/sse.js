const express = require('express');

/**
 * Creates an SSE manager and router
 * @param {import('../utils/ringBuffer')} ringBuffer
 */
function createSseRouter(ringBuffer) {
  const router = express.Router();
  const clients = new Set();

  // Heartbeat every 30 seconds to keep connection alive through proxies
  const heartbeatInterval = setInterval(() => {
    for (const client of clients) {
      try {
        client.write(':heartbeat\n\n');
      } catch (err) {
        clients.delete(client);
      }
    }
  }, 30000);

  // Clean interval on process exit
  heartbeatInterval.unref();

  // SSE endpoint for admin dashboard
  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Flush headers immediately
    res.flushHeaders?.();

    // Register client
    clients.add(res);

    // Send initial buffer history
    const initialPayload = JSON.stringify(ringBuffer.getAll());
    res.write(`event: init\ndata: ${initialPayload}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
      clients.delete(res);
      res.end();
    });
  });

  // Broadcast event to all active admin clients
  function broadcast(eventName, data) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      try {
        client.write(payload);
      } catch (err) {
        clients.delete(client);
      }
    }
  }

  return { router, broadcast };
}

module.exports = createSseRouter;
