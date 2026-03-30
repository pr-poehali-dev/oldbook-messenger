import { useState } from 'react';
import { getUser, saveUser, TEXT_COLORS } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import { Screen } from './Index';
import Icon from '@/components/ui/icon';

interface SettingsPageProps {
  currentUser: string;
  navigate: (s: Screen) => void;
}

export default function SettingsPage({ currentUser, navigate }: SettingsPageProps) {
  const user = getUser(currentUser);
  const [selectedColor, setSelectedColor] = useState(user?.textColor || '#2c1f0e');
  const [saved, setSaved] = useState(false);
  const [previewText, setPreviewText] = useState('Пример текста в беседе...');

  if (!user) return null;

  const handleSaveColor = () => {
    saveUser({ ...user, textColor: selectedColor });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="screen" style={{ background: 'var(--sepia-light)' }}>
      <div className="header-bar px-5 pt-12 pb-5">
        <h1 className="font-uncial text-xl text-sepia-light tracking-wider">Настройки</h1>
        <p className="text-ink-faded text-xs font-cormorant italic mt-0.5">Убор книги</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-5 py-5 flex flex-col gap-5 animate-fade-in">

        {/* Text color section */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ background: 'var(--parchment)', border: '1px solid var(--sepia-dark)' }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--sepia-mid)', background: 'var(--sepia-mid)' }}
          >
            <Icon name="Palette" size={14} className="text-ink-faded" />
            <p className="font-fell text-sm text-ink-light tracking-wide">Цвет чернил</p>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Color grid */}
            <div className="grid grid-cols-4 gap-3">
              {TEXT_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setSelectedColor(c.value)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`color-swatch ${selectedColor === c.value ? 'selected' : ''}`}
                    style={{
                      background: c.value,
                      borderColor: selectedColor === c.value ? 'var(--ink)' : 'var(--sepia-dark)',
                    }}
                  />
                  <span className="text-[10px] font-cormorant text-ink-faded text-center leading-tight">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom color */}
            <div className="flex items-center gap-3">
              <label className="font-cormorant text-ink-faded text-sm italic">Свой цвет:</label>
              <input
                type="color"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                className="w-10 h-10 rounded-sm cursor-pointer border-0"
                style={{ background: 'transparent' }}
              />
              <div
                className="flex-1 h-0.5 rounded-full"
                style={{ background: selectedColor }}
              />
            </div>

            {/* Preview */}
            <div
              className="rounded-sm p-3"
              style={{ background: 'var(--sepia-mid)', border: '1px solid var(--sepia-dark)' }}
            >
              <p className="text-xs font-cormorant text-ink-faded mb-2 uppercase tracking-widest">Предпросмотр</p>
              <div className="message-bubble-out inline-block px-4 py-2.5 max-w-full">
                <p className="font-cormorant text-base" style={{ color: 'var(--parchment)' }}>
                  Ваш текст в беседе
                </p>
              </div>
              <div className="mt-2 message-bubble-in inline-block px-4 py-2.5">
                <input
                  className="font-cormorant text-base bg-transparent outline-none w-full"
                  style={{ color: selectedColor }}
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                  placeholder="Введите текст..."
                />
              </div>
            </div>

            <button
              onClick={handleSaveColor}
              className={`ink-btn w-full py-3 rounded-sm transition-all ${saved ? 'opacity-80' : ''}`}
            >
              {saved ? '✓ Сохранено' : 'Сохранить цвет чернил'}
            </button>
          </div>
        </div>

        {/* Privacy settings */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ background: 'var(--parchment)', border: '1px solid var(--sepia-dark)' }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--sepia-mid)', background: 'var(--sepia-mid)' }}
          >
            <Icon name="EyeOff" size={14} className="text-ink-faded" />
            <p className="font-fell text-sm text-ink-light tracking-wide">Приватность</p>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {[
              { label: 'Скрытие IP-адреса', desc: 'IP не передаётся собеседникам', active: true },
              { label: 'Скрытие от оператора', desc: 'Трафик выглядит как обычный HTTPS', active: true },
              { label: 'E2E шифрование', desc: 'Все сообщения зашифрованы', active: true },
              { label: 'Авто-удаление чатов', desc: 'Беседы исчезают через 24 часа', active: true },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--sepia-mid)' }}
              >
                <div>
                  <p className="font-cormorant text-ink text-sm">{item.label}</p>
                  <p className="font-cormorant text-ink-faded text-xs italic">{item.desc}</p>
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-sm"
                  style={{ background: '#1e4a2e', border: '1px solid #2e5c3e' }}
                >
                  <Icon name="Check" size={10} style={{ color: '#a8d5b5' }} />
                  <span className="text-[10px] font-cormorant" style={{ color: '#a8d5b5' }}>Вкл</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* App info */}
        <div
          className="rounded-sm p-4 text-center"
          style={{ background: 'var(--sepia-mid)', border: '1px solid var(--sepia-dark)' }}
        >
          <p className="font-uncial text-ink text-base tracking-wider">Фолиант</p>
          <p className="font-cormorant text-ink-faded text-xs italic mt-1">
            Тайный мессенджер · Версия 1.0
          </p>
          <p className="font-cormorant text-ink-faded text-xs mt-2">
            Все данные хранятся на вашем устройстве
          </p>
        </div>
      </div>

      <BottomNav active="settings" navigate={navigate} />
    </div>
  );
}
