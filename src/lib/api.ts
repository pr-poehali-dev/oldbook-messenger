// API-клиент для мессенджера Фолиант
const BASE_URL = 'https://functions.poehali.dev/cbd033c5-2f10-42a0-a3c8-eb0ef8253638';

function getSession(): { login: string; token: string } | null {
  try {
    const s = localStorage.getItem('folio_session');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function saveSession(login: string, token: string) {
  localStorage.setItem('folio_session', JSON.stringify({ login, token }));
}

export function clearSession() {
  localStorage.removeItem('folio_session');
}

export function getSessionLogin(): string | null {
  return getSession()?.login || null;
}

async function request(action: string, opts: {
  method?: string;
  body?: Record<string, unknown>;
  auth?: boolean;
} = {}) {
  const { method = 'GET', body, auth = false } = opts;
  const session = getSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && session) {
    headers['X-User-Login'] = session.login;
    headers['X-Session-Token'] = session.token;
  }

  const res = await fetch(`${BASE_URL}?action=${action}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

export async function apiRegister(params: {
  login: string;
  pinHash: string;
  securityQuestion: string;
  securityAnswer: string;
  textColor: string;
}) {
  const data = await request('register', { method: 'POST', body: params });
  saveSession(data.login, data.token);
  return data as { login: string; token: string };
}

export async function apiLogin(login: string, pinHash: string) {
  const data = await request('login', { method: 'POST', body: { login, pinHash } });
  saveSession(data.login, data.token);
  return data as { login: string; token: string; securityQuestion: string; textColor: string };
}

export async function apiLogout() {
  try {
    await request('logout', { method: 'POST', auth: true });
  } finally {
    clearSession();
  }
}

export async function apiGetUser(login: string) {
  return request(`user_get&login=${encodeURIComponent(login)}`, { auth: false });
}

export async function apiUpdateColor(textColor: string) {
  return request('user_color', { method: 'PUT', body: { textColor }, auth: true });
}

export async function apiUpdatePin(newPinHash: string) {
  return request('user_pin', { method: 'PUT', body: { newPinHash }, auth: true });
}

export async function apiDeleteAccount() {
  const data = await request('user_delete', { method: 'POST', auth: true });
  clearSession();
  return data;
}

// ── CHATS ─────────────────────────────────────────────────────────────────────

export interface ServerChat {
  id: string;
  name: string;
  creatorLogin: string;
  createdAt: number;
  expiresAt: number;
  lastMessage: string | null;
  lastMessageTime: number | null;
  unread: number;
}

export async function apiGetChats(): Promise<ServerChat[]> {
  const data = await request('chats_list', { auth: true });
  return data.chats;
}

export async function apiCreateChat(name: string): Promise<ServerChat> {
  return request('chats_create', { method: 'POST', body: { name }, auth: true });
}

export async function apiClearChat(chatId: string) {
  return request('chat_clear', { method: 'POST', body: { chatId }, auth: true });
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────

export interface ServerMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  color: string;
  encrypted: boolean;
  timestamp: number;
}

export async function apiGetMessages(chatId: string, since = 0): Promise<ServerMessage[]> {
  const data = await request(`messages_get&chatId=${encodeURIComponent(chatId)}&since=${since}`, { auth: true });
  return data.messages;
}

export async function apiSendMessage(chatId: string, text: string, color: string, encrypted = true): Promise<ServerMessage> {
  return request('messages_send', {
    method: 'POST',
    body: { chatId, text, color, encrypted },
    auth: true,
  });
}

// ── UNREAD ────────────────────────────────────────────────────────────────────

export async function apiGetUnread(): Promise<{ unread: Record<string, number>; total: number }> {
  return request('unread_get', { auth: true });
}
