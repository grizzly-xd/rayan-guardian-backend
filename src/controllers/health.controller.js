export function health(_req, res) {
  res.json({
    status: 'ok',
    service: 'rayan-guardian-backend',
    apiVersion: '1.1.0', // Versi API ditambahkan
    time: new Date().toISOString()
  });
}
