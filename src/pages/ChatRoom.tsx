import { useState, useEffect, useRef } from 'react';
import {
  getMessages, saveMessage, clearChatMessages, getChats, saveChat,
  getUser, formatTime, formatTimeLeft, Message, Chat, encryptText, decryptText, TEXT_COLORS
} from '@/lib/store';
import Icon from '@/components/ui/icon';

interface ChatRoomProps {
  chatId: string;
  currentUser: string;
  onBack: () => void;
}

export default function ChatRoomPage({ chatId, currentUser, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getUser(currentUser);
  const userColor = user?.textColor || '#2c1f0e';

  const loadMessages = () => {
    const msgs = getMessages(chatId);
    // Декрипт для показа
    const decrypted = msgs.map(m => ({
      ...m,
      text: m.encrypted ? decryptText(m.text, chatId) : m.text,
    }));
    setMessages(decrypted);
  };

  const loadChat = () => {
    const chats = getChats();
    const c = chats.find(c => c.id === chatId) || null;
    setChat(c);
  };

  useEffect(() => {
    loadMessages();
    loadChat();
    const t = setInterval(() => { loadMessages(); loadChat(); }, 5000);
    return () => clearInterval(t);
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    const encrypted = encryptText(text.trim(), chatId);
    const msg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      chatId,
      senderId: currentUser,
      text: encrypted,
      color: userColor,
      timestamp: Date.now(),
      encrypted: true,
    };
    saveMessage(msg);

    // Update last message in chat
    if (chat) {
      saveChat({ ...chat, lastMessage: text.trim().slice(0, 50), lastMessageTime: Date.now() });
    }

    setText('');
    loadMessages();
  };

  const handleClear = () => {
    if (confirm('Удалить все сообщения в этой беседе?')) {
      clearChatMessages(chatId);
      loadMessages();
      setShowMenu(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!chat) {
    return (
      <div className="screen parchment-bg flex flex-col items-center justify-center">
        <p className="font-fell text-ink-faded text-xl">Беседа не найдена</p>
        <button className="ghost-btn mt-4 px-6 py-2 rounded-sm" onClick={onBack}>Назад</button>
      </div>
    );
  }

  const timeLeft = formatTimeLeft(chat.expiresAt);

  return (
    <div className="screen flex flex-col" style={{ background: 'var(--sepia-light)' }}>
      {/* Header */}
      <div className="header-bar px-4 pt-12 pb-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-sm transition-all active:scale-90"
          style={{ color: 'var(--sepia-light)' }}
        >
          <Icon name="ChevronLeft" size={22} />
        </button>

        <div
          className="w-10 h-10 rounded-sm flex items-center justify-center text-base font-fell shrink-0"
          style={{ background: 'var(--sepia-dark)', color: 'var(--ink)' }}
        >
          {chat.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-cormorant font-semibold text-sepia-light text-base truncate">
            {chat.name}
          </p>
          <div className="flex items-center gap-1">
            <Icon name="Clock" size={10} className="text-ink-faded" />
            <span className="text-xs font-cormorant text-ink-faded">истекает через {timeLeft}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="shield-badge">E2E</span>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 flex items-center justify-center"
            style={{ color: 'var(--sepia-light)' }}
          >
            <Icon name="MoreVertical" size={18} />
          </button>
        </div>
      </div>

      {/* Menu dropdown */}
      {showMenu && (
        <div
          className="absolute top-24 right-4 z-50 rounded-sm shadow-xl animate-fade-in overflow-hidden"
          style={{ background: 'var(--parchment)', border: '1px solid var(--sepia-dark)', minWidth: 180 }}
        >
          <button
            className="w-full px-4 py-3 text-left font-cormorant text-sm text-aged-red flex items-center gap-2 hover:bg-sepia-mid transition-colors"
            onClick={handleClear}
          >
            <Icon name="Trash2" size={14} />
            Удалить все сообщения
          </button>
          <div style={{ borderTop: '1px solid var(--sepia-mid)' }} />
          <button
            className="w-full px-4 py-3 text-left font-cormorant text-sm text-ink-light flex items-center gap-2 hover:bg-sepia-mid transition-colors"
            onClick={() => setShowMenu(false)}
          >
            <Icon name="Shield" size={14} />
            E2E шифрование активно
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
            <div className="text-4xl opacity-20">🔒</div>
            <p className="font-cormorant text-ink-faded italic text-center text-sm">
              Беседа защищена сквозным шифрованием.
              <br />Напишите первое сообщение
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUser;
          const showDate = i === 0 || formatTime(messages[i - 1].timestamp) !== formatTime(msg.timestamp);

          return (
            <div key={msg.id} className="flex flex-col">
              {showDate && i === 0 && (
                <div className="ornament-line text-xs text-ink-faded mb-2">сегодня</div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-4 py-2.5 ${isOwn ? 'message-bubble-out' : 'message-bubble-in'}`}>
                  {!isOwn && (
                    <p className="text-xs font-cormorant font-semibold mb-1" style={{ color: 'var(--sepia-deep)' }}>
                      {msg.senderId}
                    </p>
                  )}
                  <p
                    className="font-cormorant text-base leading-snug"
                    style={{ color: isOwn ? 'var(--parchment)' : msg.color }}
                  >
                    {msg.text}
                  </p>
                  <p className={`text-[10px] font-cormorant mt-1 text-right ${isOwn ? 'text-sepia-dark opacity-70' : 'text-ink-faded'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 flex items-end gap-3"
        style={{
          background: 'var(--parchment)',
          borderTop: '1px solid var(--sepia-dark)',
        }}
      >
        <textarea
          className="vintage-input flex-1 px-3 py-2.5 rounded-sm resize-none text-base leading-snug"
          style={{ color: userColor, minHeight: 44, maxHeight: 120 }}
          placeholder="Напишите послание..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="w-11 h-11 rounded-sm flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
          style={{
            background: 'var(--ink)',
            color: 'var(--parchment)',
          }}
        >
          <Icon name="Send" size={18} />
        </button>
      </div>
    </div>
  );
}
