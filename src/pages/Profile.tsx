import { useState, useEffect } from 'react';
import { apiGetChats, apiGetUser, apiLogout, ServerChat } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Screen } from './Index';
import Icon from '@/components/ui/icon';

interface ProfilePageProps {
  currentUser: string;
  navigate: (s: Screen) => void;
  onLogout: () => void;
}

export default function ProfilePage({ currentUser, navigate, onLogout }: ProfilePageProps) {
  const [chats, setChats] = useState<ServerChat[]>([]);
  const [createdAt, setCreatedAt] = useState<number>(Date.now());

  useEffect(() => {
    apiGetChats().then(setChats).catch(() => {});
    apiGetUser(currentUser).then(u => { if (u.createdAt) setCreatedAt(u.createdAt); }).catch(() => {});
  }, [currentUser]);

  const handleLogout = async () => {
    await apiLogout();
    onLogout();
  };

  const created = new Date(createdAt).toLocaleDateString('ru', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="screen" style={{ background: 'var(--sepia-light)' }}>
      <div className="header-bar px-5 pt-12 pb-6">
        <h1 className="font-uncial text-xl text-sepia-light tracking-wider">Профиль</h1>
        <p className="text-ink-faded text-xs font-cormorant italic mt-0.5">Ваша личная запись</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-5 py-5 flex flex-col gap-5 animate-fade-in">

        {/* Avatar card */}
        <div
          className="rounded-sm p-6 flex flex-col items-center gap-3 vintage-border"
          style={{ background: 'var(--parchment)' }}
        >
          <div
            className="w-20 h-20 rounded-sm flex items-center justify-center text-4xl font-fell"
            style={{ background: 'var(--sepia-dark)', color: 'var(--ink)' }}
          >
            {currentUser.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <p className="font-fell text-2xl text-ink">{currentUser}</p>
            <p className="font-cormorant text-ink-faded text-sm italic mt-1">
              Зарегистрирован {created}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="shield-badge">IP СКРЫТ</span>
            <span className="shield-badge">E2E АКТИВЕН</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-sm p-4 text-center"
            style={{ background: 'var(--sepia-mid)', border: '1px solid var(--sepia-dark)' }}
          >
            <p className="font-fell text-3xl text-ink">{chats.length}</p>
            <p className="font-cormorant text-ink-faded text-xs tracking-wide uppercase mt-1">Активных бесед</p>
          </div>
          <div
            className="rounded-sm p-4 text-center"
            style={{ background: 'var(--sepia-mid)', border: '1px solid var(--sepia-dark)' }}
          >
            <p className="font-fell text-3xl text-ink">24ч</p>
            <p className="font-cormorant text-ink-faded text-xs tracking-wide uppercase mt-1">Срок хранения</p>
          </div>
        </div>

        {/* Privacy info */}
        <div
          className="rounded-sm p-4 flex flex-col gap-3"
          style={{ background: 'var(--parchment)', border: '1px solid var(--sepia-dark)' }}
        >
          <p className="font-fell text-sm text-ink-light tracking-wide">Защита приватности</p>
          {[
            { icon: 'EyeOff', text: 'IP-адрес скрыт от собеседников' },
            { icon: 'Wifi', text: 'Активность скрыта от оператора' },
            { icon: 'Lock', text: 'Сообщения зашифрованы E2E' },
            { icon: 'Clock', text: 'Чаты удаляются через 24 часа' },
          ].map(item => (
            <div key={item.icon} className="flex items-center gap-3">
              <Icon name={item.icon} size={14} className="text-aged-green shrink-0" />
              <p className="font-cormorant text-ink-faded text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ border: '1px solid var(--sepia-dark)' }}
        >
          <button
            onClick={() => navigate('settings')}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-sepia-mid transition-colors text-left"
            style={{ background: 'var(--parchment)', borderBottom: '1px solid var(--sepia-mid)' }}
          >
            <Icon name="Settings" size={16} className="text-ink-faded" />
            <span className="font-cormorant text-ink-light">Настройки</span>
            <Icon name="ChevronRight" size={14} className="text-ink-faded ml-auto" />
          </button>
          <button
            onClick={() => navigate('security')}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-sepia-mid transition-colors text-left"
            style={{ background: 'var(--parchment)', borderBottom: '1px solid var(--sepia-mid)' }}
          >
            <Icon name="Shield" size={16} className="text-ink-faded" />
            <span className="font-cormorant text-ink-light">Безопасность</span>
            <Icon name="ChevronRight" size={14} className="text-ink-faded ml-auto" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-4 flex items-center gap-3 hover:bg-sepia-mid transition-colors text-left"
            style={{ background: 'var(--parchment)' }}
          >
            <Icon name="LogOut" size={16} className="text-aged-red" />
            <span className="font-cormorant text-aged-red">Выйти из аккаунта</span>
          </button>
        </div>
      </div>

      <BottomNav active="profile" navigate={navigate} />
    </div>
  );
}