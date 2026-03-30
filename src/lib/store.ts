// Хранилище состояния приложения (localStorage)

export interface User {
  login: string;
  pinHash: string;
  securityQuestion: string;
  securityAnswer: string;
  textColor: string;
  createdAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  color: string;
  timestamp: number;
  encrypted: boolean;
}

export interface Chat {
  id: string;
  name: string;
  participants: string[];
  createdAt: number;
  expiresAt: number; // +24h
  lastMessage?: string;
  lastMessageTime?: number;
}

// Simple hash (для демо — не для прода)
export function hashPin(pin: string): string {
  let hash = 0;
  const str = pin + 'folio_salt_v1';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Simple XOR encrypt for demo
export function encryptText(text: string, key: string): string {
  const keyBytes = Array.from(key).map(c => c.charCodeAt(0));
  return Array.from(text).map((c, i) => {
    return String.fromCharCode(c.charCodeAt(0) ^ keyBytes[i % keyBytes.length]);
  }).join('');
}

export function decryptText(encrypted: string, key: string): string {
  return encryptText(encrypted, key); // XOR is symmetric
}

// Storage keys
const USERS_KEY = 'folio_users';
const CURRENT_USER_KEY = 'folio_current_user';
const CHATS_KEY = 'folio_chats';
const MESSAGES_KEY = 'folio_messages';

export function getUsers(): Record<string, User> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch { return {}; }
}

export function saveUser(user: User): void {
  const users = getUsers();
  users[user.login] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getUser(login: string): User | null {
  return getUsers()[login] || null;
}

export function deleteUser(login: string): void {
  const users = getUsers();
  delete users[login];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUser(login: string | null): void {
  if (login) {
    localStorage.setItem(CURRENT_USER_KEY, login);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getChats(): Chat[] {
  try {
    const chats: Chat[] = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
    // Фильтруем просроченные чаты
    const now = Date.now();
    return chats.filter(c => c.expiresAt > now);
  } catch { return []; }
}

export function saveChat(chat: Chat): void {
  const chats = getChats();
  const idx = chats.findIndex(c => c.id === chat.id);
  if (idx >= 0) chats[idx] = chat;
  else chats.push(chat);
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function createChat(name: string, currentUser: string): Chat {
  const chat: Chat = {
    id: `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name,
    participants: [currentUser],
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  saveChat(chat);
  return chat;
}

export function getMessages(chatId: string): Message[] {
  try {
    const all: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    return all.filter(m => m.chatId === chatId).sort((a, b) => a.timestamp - b.timestamp);
  } catch { return []; }
}

export function saveMessage(msg: Message): void {
  try {
    const all: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    all.push(msg);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  } catch { return; }
}

export function clearChatMessages(chatId: string): void {
  try {
    const all: Message[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    const filtered = all.filter(m => m.chatId !== chatId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(filtered));
  } catch { return; }
}

export function deleteChat(chatId: string): void {
  const chats = getChats();
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats.filter(c => c.id !== chatId)));
  clearChatMessages(chatId);
}

export function formatTimeLeft(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'истёк';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}ч ${mins}м`;
  return `${mins}м`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'сегодня';
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'long' });
}

export const TEXT_COLORS = [
  { name: 'Чёрные чернила', value: '#2c1f0e' },
  { name: 'Красный кармин', value: '#7a2e1a' },
  { name: 'Синий индиго', value: '#1a3a5c' },
  { name: 'Изумрудный', value: '#1e4a2e' },
  { name: 'Пурпурный', value: '#5c2a5c' },
  { name: 'Золотой', value: '#7a5c1a' },
  { name: 'Медный', value: '#7a3a1a' },
  { name: 'Серый аспид', value: '#3a3a4a' },
];
