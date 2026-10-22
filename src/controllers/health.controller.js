export function health(_req, res) {
  res.json({
    status: 'ok',
    service: 'rayan-guardian-backend',
    time: new Date().toISOString()
  });
}
