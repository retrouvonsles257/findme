/**
 * =====================================================
 * RETROUVONSLES - Proxy Configuration
 * Proxy pour les appels API Hugging Face (CORS bypass)
 * NOUVEAU: Utilise router.huggingface.co (2025+)
 * =====================================================
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/huggingface',
    createProxyMiddleware({
      target: 'https://router.huggingface.co',
      changeOrigin: true,
      pathRewrite: {
        '^/api/huggingface/models': '/hf-inference/models',
      },
      onError: (err, req, res) => {
        console.error('[Proxy HF] Erreur:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erreur proxy Hugging Face', details: err.message }));
      },
    })
  );
};
