import { createClient } from '@supabase/supabase-js';

const rateState = new Map();

const getClientIp = (req) => {
  const fwd = String(req.headers?.['x-forwarded-for'] || '').trim();
  if (fwd) return fwd.split(',')[0].trim();
  return String(req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown');
};

const rateLimit = (key, limit, windowMs) => {
  const now = Date.now();
  const existing = rateState.get(key);
  if (!existing || now - existing.start > windowMs) {
    const next = { start: now, count: 1 };
    rateState.set(key, next);
    return { ok: true };
  }
  existing.count += 1;
  return { ok: existing.count <= limit };
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const ip = getClientIp(req);
  const rl = rateLimit(`activate:${ip}`, 10, 60 * 1000);
  if (!rl.ok) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Muitas requisições. Tente novamente em instantes.' }));
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const licenseServerKey = String(process.env.LICENSE_KEY || '').trim();

  if (!supabaseUrl || !serviceRoleKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Supabase service role não configurado no servidor.' }));
    return;
  }

  if (!licenseServerKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'LICENSE_KEY não configurada no servidor.' }));
    return;
  }

  const authHeader = String(req.headers?.authorization || '').trim();
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Não autenticado.' }));
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'JSON inválido no corpo da requisição.' }));
    return;
  }

  const licenseKey = String(body?.licenseKey || '').trim();
  if (!licenseKey) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'licenseKey é obrigatório.' }));
    return;
  }

  if (licenseKey.trim().toUpperCase() !== licenseServerKey.trim().toUpperCase()) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Chave inválida.' }));
    return;
  }

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Token inválido.' }));
      return;
    }

    const u = userData.user;
    const nextAppMeta = { ...(u.app_metadata || {}), plan: 'pro' };
    const nextUserMeta = { ...(u.user_metadata || {}), plan: 'pro' };

    const { error: updateError } = await admin.auth.admin.updateUserById(u.id, {
      app_metadata: nextAppMeta,
      user_metadata: nextUserMeta,
    });

    if (updateError) throw updateError;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    const message = err?.message ? String(err.message) : 'Erro inesperado';
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  }
}
