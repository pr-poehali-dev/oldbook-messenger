import { useState, useEffect, useRef } from 'react';
import { formatTimeLeft, formatTime } from '@/lib/store';
import { apiGetChats, apiCreateChat, ServerChat } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import BottomNav from '@/components/BottomNav';
import { Screen } from './Index';
import Icon from '@/components/ui/icon';

interface ChatsPageProps {
  currentUser: string;
  navigate: (s: Screen, chatId?: string) => void;
}

export default function ChatsPage({ currentUser, navigate }: ChatsPageProps) {
  const [chats, setChats] = useState<ServerChat[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const prevChatsRef = useRef<ServerChat[]>([]);
  const { requestPermission, notifyNewMessage } = useNotifications();

  const visibleChats = chats.filter(c => !hiddenIds.has(c.id));

  const loadChats = async () => {
    try {
      const data = await apiGetChats();
      const now = Date.now();
      const active = data.filter(c => c.expiresAt > now);

      // Detect new messages from other users
      const prev = prevChatsRef.current;
      if (prev.length > 0) {
        for (const chat of active) {
          const oldChat = prev.find(p => p.id === chat.id);
          const isNewMsg =
            chat.lastMessageTime !== null &&
            (oldChat === undefined || oldChat.lastMessageTime !== chat.lastMessageTime);
          if (isNewMsg && chat.lastMessage) {
            // Try to determine sender — if lastMessage changed and we can't know for sure,
            // we notify if we are not the only possible sender (unread > 0 is a signal)
            if (chat.unread > 0) {
              notifyNewMessage(
                chat.name,
                chat.lastMessage,
                chat.name,
                chat.id
              );
            }
          }
        }
      }

      prevChatsRef.current = active;
      setChats(active);
    } catch {
      // Сервер недоступен — оставляем текущее состояние
    }
  };

  useEffect(() => {
    loadChats();
    const t = setInterval(loadChats, 5000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) { setError('Введите название беседы'); return; }
    setCreating(true);
    setError('');
    try {
      const chat = await apiCreateChat(newName.trim());
      setNewName('');
      setShowNew(false);
      await loadChats();
      navigate('chat', chat.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания беседы');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Скрыть беседу из списка?')) {
      setHiddenIds(prev => new Set([...prev, id]));
    }
  };

  return (
    <div className="screen" style={{ background: 'var(--sepia-light)' }}>
      {/* Header */}
      <div className="header-bar px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-uncial text-xl text-sepia-light tracking-wider">Беседы</h1>
            <p className="text-ink-faded text-xs font-cormorant italic mt-0.5">
              Временные · до 24 часов
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => requestPermission()}
              className="w-10 h-10 rounded-sm flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'rgba(196,168,130,0.2)', color: 'var(--sepia-dark)' }}
              title="Разрешить уведомления"
            >
              <Icon name="Bell" size={18} />
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="w-10 h-10 rounded-sm flex items-center justify-center transition-all active:scale-95"
              style={{ background: 'var(--sepia-dark)', color: 'var(--ink)' }}
            >
              <Icon name="Plus" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* New chat modal */}
      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(44,31,14,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowNew(false); setNewName(''); setError(''); } }}
        >
          <div
            className="w-full max-w-[430px] mx-auto rounded-t-xl p-6 animate-fade-in"
            style={{ background: 'var(--parchment)', border: '1px solid var(--sepia-dark)' }}
          >
            <div className="ornament-line font-fell text-base mb-5">Новая беседа</div>

            <div className="flex flex-col gap-3">
              <input
                className="vintage-input w-full px-3 py-3 rounded-sm"
                placeholder="Название беседы..."
                value={newName}
                onChange={e => { setNewName(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                maxLength={40}
                disabled={creating}
              />
              {error && (
                <p className="text-aged-red text-sm font-cormorant italic animate-fade-in">{error}</p>
              )}

              <div
                className="flex items-center gap-2 p-3 rounded-sm"
                style={{ background: 'var(--sepia-mid)' }}
              >
                <Icon name="Clock" size={14} className="text-ink-faded" />
                <p className="text-xs font-cormorant text-ink-faded italic">
                  Беседа автоматически исчезнет через 24 часа
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  className="ghost-btn flex-1 py-3 rounded-sm"
                  onClick={() => { setShowNew(false); setNewName(''); setError(''); }}
                  disabled={creating}
                >
                  Отмена
                </button>
                <button
                  className="ink-btn flex-1 py-3 rounded-sm"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? 'Создаём...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {visibleChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 px-8">
            <div className="text-5xl opacity-30">📖</div>
            <p className="font-fell text-ink-faded text-center text-lg">Книга пуста</p>
            <p className="font-cormorant text-ink-faded text-center text-sm italic">
              Создайте первую беседу, нажав «+»
            </p>
          </div>
        ) : (
          visibleChats.map(chat => (
            <button
              key={chat.id}
              className="chat-item w-full text-left px-5 py-4 flex items-center gap-4"
              onClick={() => navigate('chat', chat.id)}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-12 h-12 rounded-sm flex items-center justify-center text-lg font-fell"
                  style={{ background: 'var(--sepia-dark)', color: 'var(--ink)' }}
                >
                  {chat.name.charAt(0).toUpperCase()}
                </div>
                {chat.unread > 0 && (
                  <div
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-cormorant font-bold px-1"
                    style={{ background: 'var(--aged-red)', color: 'var(--parchment)' }}
                  >
                    {chat.unread > 99 ? '99+' : chat.unread}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-cormorant font-semibold text-ink text-base truncate">
                    {chat.name}
                  </span>
                  <span className="text-xs font-cormorant text-ink-faded shrink-0 ml-2">
                    {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-sm font-cormorant text-ink-faded italic truncate">
                    {chat.lastMessage || 'Беседа открыта'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Icon name="Clock" size={10} className="text-ink-faded" />
                    <span className="text-xs font-cormorant text-ink-faded">
                      {formatTimeLeft(chat.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete (hide locally) */}
              <button
                onClick={e => handleDelete(chat.id, e)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-sm transition-colors hover:bg-sepia-mid"
              >
                <Icon name="Trash2" size={14} className="text-ink-faded hover:text-aged-red" />
              </button>
            </button>
          ))
        )}
      </div>

      <BottomNav active="chats" navigate={navigate} />
    </div>
  );
}
