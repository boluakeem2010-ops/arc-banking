import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url));
const dataPath = process.env.VERCEL === '1'
  ? resolve('/tmp', 'arc-demo-data.json')
  : resolve(rootDirectory, 'data.json');
const buildDirectory = resolve(rootDirectory, 'dist');
const port = Number(process.env.PORT ?? 3001);
const maxBodyBytes = 16 * 1024;
const sessionCookieName = 'arc_session';
const sessionDurationMs = 24 * 60 * 60 * 1000;
const resetDurationMs = 15 * 60 * 1000;
const scrypt = promisify(scryptCallback);
const allowedDestinations = new Set(['Rainy day savings', 'First home goal', 'Japan trip goal']);
const sessions = new Map();

let cachedData;
let mutationQueue = Promise.resolve();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function createSampleData() {
  return {
    balance: { total: 20670.42, changePercent: 4.8 },
    income: { month: 5240, lastDeposit: 2620 },
    spending: { month: 2184.68, budget: 3000 },
    accounts: [
      { name: 'Everyday', lastFour: '2841', balance: 8420, kind: 'checking' },
      { name: 'Rainy day', lastFour: '6108', balance: 12250, kind: 'savings' },
    ],
    transactions: [
      { id: 'tx-cafe', name: 'Market Street Café', meta: 'Food & drink · Today, 9:42 AM', amount: -18.5, status: 'Settled', icon: 'M', iconClass: 'icon-market' },
      { id: 'tx-salary', name: 'Acme Studio', meta: 'Salary · Today, 8:15 AM', amount: 2620, status: 'Incoming', icon: '↙', iconClass: 'icon-pay' },
      { id: 'tx-stream', name: 'Streamline+', meta: 'Subscriptions · Yesterday', amount: -12.99, status: 'Settled', icon: '▸', iconClass: 'icon-stream' },
      { id: 'tx-grocery', name: 'Good Foods Market', meta: 'Groceries · Oct 9, 4:28 PM', amount: -64.32, status: 'Settled', icon: '✳', iconClass: 'icon-grocery' },
    ],
    goals: [
      { name: 'First home', current: 18400, target: 30000, icon: '⌂', iconClass: 'home-goal', trackClass: '' },
      { name: 'Japan trip', current: 2180, target: 4000, icon: '✳', iconClass: 'trip-goal', trackClass: 'trip-track' },
    ],
    upcomingBills: [
      { name: 'Melody Music', meta: 'Subscription · Oct 14', amount: 10.99, icon: '♫', iconClass: 'music-icon' },
      { name: 'Home rent', meta: 'Housing · Oct 15', amount: 1450, icon: '⌂', iconClass: 'home-icon' },
    ],
    transfers: [],
    users: [],
  };
}

async function saveData(data) {
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function getData() {
  if (cachedData) return cachedData;

  try {
    const contents = await readFile(dataPath, 'utf8');
    const parsed = JSON.parse(contents);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transfers)) {
      throw new Error('data.json does not contain valid Arc demo data.');
    }
    if (!Array.isArray(parsed.users)) parsed.users = [];
    cachedData = parsed;
    return cachedData;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      const sample = createSampleData();
      await saveData(sample);
      cachedData = sample;
      return cachedData;
    }
    throw error;
  }
}

async function updateData(update) {
  const operation = mutationQueue.then(async () => {
    const current = await getData();
    const next = await update(current);
    await saveData(next);
    cachedData = next;
    return next;
  });
  mutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function getSummary(data, userId) {
  const transfers = data.transfers.filter((transfer) => transfer.userId === userId).map((transfer) => ({
    id: transfer.id,
    name: `Transfer to ${transfer.destination}`,
    meta: `Demo transfer · ${new Date(transfer.createdAt).toLocaleString('en-US')}`,
    amount: -transfer.amount,
    status: 'Queued',
    icon: '↗',
    iconClass: 'icon-pay',
  }));

  return {
    balance: data.balance,
    income: data.income,
    spending: data.spending,
    accounts: data.accounts,
    transactions: [...transfers.reverse(), ...data.transactions],
    goals: data.goals,
    upcomingBills: data.upcomingBills,
  };
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

function parseCookies(request) {
  const cookieHeader = request.headers.cookie ?? '';
  return Object.fromEntries(
    cookieHeader.split(';').map((cookie) => {
      const separator = cookie.indexOf('=');
      if (separator < 0) return ['', ''];
      return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1).trim())];
    }).filter(([name]) => name),
  );
}

function setSessionCookie(request, response, sessionId, maxAge) {
  const secure = request.socket.encrypted || request.headers['x-forwarded-proto'] === 'https';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${encodeURIComponent(sessionId)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`,
  );
}

function clearSessionCookie(request, response) {
  setSessionCookie(request, response, '', 0);
}

function createSession(request, response, user) {
  const sessionId = randomBytes(32).toString('hex');
  sessions.set(sessionId, {
    userId: user.id,
    expiresAt: Date.now() + sessionDurationMs,
  });
  setSessionCookie(request, response, sessionId, Math.floor(sessionDurationMs / 1000));
}

function createDemoSession(request, response) {
  const user = {
    id: `demo-${randomUUID()}`,
    name: 'Demo User',
    email: 'demo@example.test',
  };
  const sessionId = randomBytes(32).toString('hex');
  sessions.set(sessionId, {
    userId: user.id,
    demoUser: user,
    expiresAt: Date.now() + sessionDurationMs,
  });
  setSessionCookie(request, response, sessionId, Math.floor(sessionDurationMs / 1000));
  return user;
}

async function requireUser(request) {
  const sessionId = parseCookies(request)[sessionCookieName];
  const session = sessionId ? sessions.get(sessionId) : null;
  if (!session || session.expiresAt <= Date.now()) {
    if (sessionId) sessions.delete(sessionId);
    throw new HttpError(401, 'Sign in to access your dashboard.');
  }

  if (session.demoUser) return session.demoUser;

  const data = await getData();
  const user = data.users.find((entry) => entry.id === session.userId);
  if (!user) {
    sessions.delete(sessionId);
    throw new HttpError(401, 'Sign in to access your dashboard.');
  }
  return user;
}

function publicUser(user) {
  return { name: user.name, email: user.email };
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const key = await scrypt(password, salt, 64);
  return { salt, hash: key.toString('hex') };
}

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function safeStringEqual(left, right) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new HttpError(413, 'Request body is too large.');
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

async function handleApi(request, response, pathname) {
  if (pathname === '/api/demo-session' && request.method === 'POST') {
    const user = createDemoSession(request, response);
    sendJson(response, 200, { user: publicUser(user) });
    return;
  }

  if (pathname === '/api/auth/register' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const password = body?.password;
    if (name.length < 2 || name.length > 80) {
      throw new HttpError(400, 'Enter a name between 2 and 80 characters.');
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'Enter a valid email address.');
    }
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      throw new HttpError(400, 'Password must be between 10 and 128 characters.');
    }

    const passwordCredentials = await hashPassword(password);
    const user = {
      id: randomUUID(),
      name,
      email,
      passwordSalt: passwordCredentials.salt,
      passwordHash: passwordCredentials.hash,
      resetTokenHash: null,
      resetExpiresAt: null,
    };
    await updateData((data) => {
      if (data.users.some((entry) => entry.email === email)) {
        throw new HttpError(409, 'An account with that email already exists.');
      }
      return { ...data, users: [...data.users, user] };
    });

    createSession(request, response, user);
    sendJson(response, 201, { user: publicUser(user) });
    return;
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (password.length > 128) {
      throw new HttpError(400, 'Password must be no more than 128 characters.');
    }
    const data = await getData();
    const user = data.users.find((entry) => entry.email === email);
    const credentials = user
      ? await hashPassword(password, user.passwordSalt)
      : await hashPassword(password || 'invalid-password');

    if (!user || !safeStringEqual(credentials.hash, user.passwordHash)) {
      throw new HttpError(401, 'Email or password is incorrect.');
    }

    createSession(request, response, user);
    sendJson(response, 200, { user: publicUser(user) });
    return;
  }

  if (pathname === '/api/auth/me' && request.method === 'GET') {
    const user = await requireUser(request);
    sendJson(response, 200, { user: publicUser(user) });
    return;
  }

  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    const sessionId = parseCookies(request)[sessionCookieName];
    if (sessionId) sessions.delete(sessionId);
    clearSessionCookie(request, response);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (pathname === '/api/auth/forgot-password' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'Enter a valid email address.');
    }

    const token = randomBytes(32).toString('hex');
    const user = (await getData()).users.find((entry) => entry.email === email);
    if (user) {
      await updateData((data) => ({
        ...data,
        users: data.users.map((entry) => entry.id === user.id
          ? {
              ...entry,
              resetTokenHash: hashResetToken(token),
              resetExpiresAt: Date.now() + resetDurationMs,
            }
          : entry),
      }));
    }
    sendJson(response, 200, {
      message: user
        ? 'If an account exists for that email, a reset link is ready. Demo reset token:'
        : 'If an account exists for that email, a reset link is ready.',
      ...(user ? { resetToken: token } : {}),
    });
    return;
  }

  if (pathname === '/api/auth/reset-password' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : '';
    const token = typeof body?.token === 'string' ? body.token : '';
    const password = body?.password;
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) {
      throw new HttpError(400, 'Password must be between 10 and 128 characters.');
    }
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      throw new HttpError(400, 'The reset token is invalid or has expired.');
    }

    const existingUser = (await getData()).users.find((entry) => entry.email === email);
    const passwordCredentials = await hashPassword(password);
    let resetUserId;
    await updateData((data) => {
      const user = data.users.find((entry) => entry.email === email);
      const isValid = user
        && user.resetTokenHash
        && user.resetExpiresAt > Date.now()
        && safeStringEqual(hashResetToken(token), user.resetTokenHash);
      if (!isValid) throw new HttpError(400, 'The reset token is invalid or has expired.');
      resetUserId = user.id;
      return {
        ...data,
        users: data.users.map((entry) => entry.id === user.id
          ? {
              ...entry,
              passwordSalt: passwordCredentials.salt,
              passwordHash: passwordCredentials.hash,
              resetTokenHash: null,
              resetExpiresAt: null,
            }
          : entry),
      };
    });
    for (const [sessionId, session] of sessions) {
      if (session.userId === (resetUserId ?? existingUser?.id)) sessions.delete(sessionId);
    }
    clearSessionCookie(request, response);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (pathname === '/api/summary' && request.method === 'GET') {
    const user = await requireUser(request);
    sendJson(response, 200, getSummary(await getData(), user.id));
    return;
  }

  if (pathname === '/api/transfers' && request.method === 'POST') {
    const user = await requireUser(request);
    const body = await readJsonBody(request);
    const amount = body?.amount;
    const destination = body?.destination;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 8420) {
      throw new HttpError(400, 'Transfer amount must be greater than $0 and no more than $8,420.');
    }
    if (Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-8) {
      throw new HttpError(400, 'Transfer amount can have no more than two decimal places.');
    }
    if (typeof destination !== 'string' || !allowedDestinations.has(destination)) {
      throw new HttpError(400, 'Choose a valid demo transfer destination.');
    }

    const transfer = {
      id: randomUUID(),
      amount,
      destination,
      userId: user.id,
      status: 'Queued',
      createdAt: new Date().toISOString(),
    };
    const updatedData = await updateData((data) => ({
      ...data,
      transfers: [...data.transfers, transfer],
    }));

    sendJson(response, 201, { transfer, summary: getSummary(updatedData, user.id) });
    return;
  }

  if (pathname === '/api/reset-demo' && request.method === 'POST') {
    const user = await requireUser(request);
    const updatedData = await updateData((data) => ({
      ...data,
      transfers: data.transfers.filter((transfer) => transfer.userId !== user.id),
    }));
    sendJson(response, 200, getSummary(updatedData, user.id));
    return;
  }

  if (pathname.startsWith('/api/')) {
    sendJson(response, 404, { error: 'API route not found.' });
    return;
  }

  return false;
}

async function serveStatic(request, response, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    throw new HttpError(400, 'Invalid URL path.');
  }

  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = resolve(buildDirectory, `.${requestedPath}`);
  if (!filePath.startsWith(`${buildDirectory}${sep}`) && filePath !== buildDirectory) {
    throw new HttpError(403, 'Path is not allowed.');
  }

  let contents;
  try {
    contents = await readFile(filePath);
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
    if (extname(decodedPath)) {
      throw new HttpError(404, 'File not found.');
    }
    contents = await readFile(resolve(buildDirectory, 'index.html')).catch(() => {
      throw new HttpError(503, 'Built frontend not found. Run npm run build first.');
    });
  }

  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
  };
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(requestedPath)] ?? 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') {
    response.end();
  } else {
    response.end(contents);
  }
}

export async function handleRequest(request, response) {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(request, response, url.pathname);
      if (handled !== false) return;
    } else if (request.method === 'GET' || request.method === 'HEAD') {
      await serveStatic(request, response, url.pathname);
      return;
    } else {
      throw new HttpError(405, 'Method not allowed.');
    }
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status >= 500) console.error('Arc server request failed:', error);
    if (!response.headersSent) {
      sendJson(response, status, {
        error: error instanceof Error && status < 500 ? error.message : 'The server could not complete the request.',
      });
    } else {
      response.destroy();
    }
  }
}

if (process.env.VERCEL !== '1') {
  const server = createServer(handleRequest);

  server.listen(port, () => {
    console.log(`Arc demo server listening at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    console.error('Arc server failed to start:', error);
    process.exitCode = 1;
  });
}
