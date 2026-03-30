import { useState, useEffect } from 'react';
import { getChats, createChat, deleteChat, formatTimeLeft, formatTime, Chat } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import { Screen } from './Index';
import Icon from '@/components/ui/icon';

interface ChatsPageProps {
  currentUser: string;
  navigate: (s: Screen, chatId?: string) => void;
}

export default function ChatsPage({ currentUser, navigate }: ChatsPageProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const load = () => setChats(getChats());

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) { setError('Введите название беседы'); return; }
    const chat = createChat(newName.trim(), currentUser);
    setNewName('');
    setShowNew(false);
    setError('');
    load();
    navigate('chat', chat.id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить беседу и все сообщения?')) {
      deleteChat(id);
      load();
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
          <button
            onClick={() => setShowNew(true)}
            className="w-10 h-10 rounded-sm flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--sepia-dark)', color: 'var(--ink)' }}
          >
            <Icon name="Plus" size={20} />
          </button>
        </div>
      </div>

      {/* New chat modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(44,31,14,0.6)' }}>
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
              />
              {error && <p className="text-aged-red text-sm font-cormorant italic">{error}</p>}

              <div className="flex items-center gap-2 p-3 rounded-sm" style={{ background: 'var(--sepia-mid)' }}>
                <Icon name="Clock" size={14} className="text-ink-faded" />
                <p className="text-xs font-cormorant text-ink-faded italic">
                  Беседа автоматически исчезнет через 24 часа
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  className="ghost-btn flex-1 py-3 rounded-sm"
                  onClick={() => { setShowNew(false); setNewName(''); setError(''); }}
                >
                  Отмена
                </button>
                <button className="ink-btn flex-1 py-3 rounded-sm" onClick={handleCreate}>
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 px-8">
            <div className="text-5xl opacity-30">📖</div>
            <p className="font-fell text-ink-faded text-center text-lg">Книга пуста</p>
            <p className="font-cormorant text-ink-faded text-center text-sm italic">
              Создайте первую беседу, нажав «+»
            </p>
          </div>
        ) : (
          chats.map(chat => (
            <button
              key={chat.id}
              className="chat-item w-full text-left px-5 py-4 flex items-center gap-4"
              onClick={() => navigate('chat', chat.id)}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-sm flex items-center justify-center shrink-0 text-lg font-fell"
                style={{ background: 'var(--sepia-dark)', color: 'var(--ink)' }}
              >
                {chat.name.charAt(0).toUpperCase()}
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

              {/* Delete */}
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
