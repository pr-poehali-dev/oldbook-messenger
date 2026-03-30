import { useState } from 'react';
import PinInput from '@/components/PinInput';
import { hashPin } from '@/lib/store';
import { apiLogin } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface LoginPageProps {
  onLogin: (login: string) => void;
  onRegister: () => void;
}

type Step = 'login' | 'pin';

export default function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [step, setStep] = useState<Step>('login');
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = () => {
    const trimmed = login.trim();
    if (!trimmed) {
      setError('Введите имя пользователя');
      return;
    }
    setError('');
    setStep('pin');
  };

  const handlePin = async (pin: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiLogin(login.trim(), hashPin(pin));
      if (data.textColor) {
        localStorage.setItem(`folio_color_${data.login}`, data.textColor);
      }
      onLogin(data.login);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('404') || msg.toLowerCase().includes('не найден') || msg.toLowerCase().includes('not found')) {
        setError('Пользователь не найден');
        setStep('login');
      } else {
        setError('Неверный пин-код');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen parchment-bg flex flex-col">
      {/* Header */}
      <div className="header-bar px-6 pt-12 pb-8 text-center">
        <div className="animate-flicker mb-2 text-3xl">📜</div>
        <h1 className="font-uncial text-2xl text-sepia-light tracking-wider">Фолиант</h1>
        <p className="text-ink-faded text-xs tracking-[0.2em] uppercase mt-1 font-cormorant">
          Тайный мессенджер
        </p>
        <div className="mt-3 flex justify-center">
          <span className="shield-badge">E2E ЗАЩИТА · IP СКРЫТ</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 animate-fade-in">

        {step === 'login' && (
          <div className="w-full max-w-xs flex flex-col gap-5">
            <div className="ornament-line font-fell text-sm">Вход</div>

            <div className="flex flex-col gap-2">
              <label className="text-ink-faded text-xs tracking-widest uppercase font-cormorant">
                Имя пользователя
              </label>
              <input
                className="vintage-input w-full px-3 py-3 rounded-sm"
                placeholder="Введите логин..."
                value={login}
                onChange={e => { setLogin(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                autoComplete="off"
                autoCapitalize="off"
              />
            </div>

            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}

            <button
              className="ink-btn w-full py-3 rounded-sm mt-2"
              onClick={handleLoginSubmit}
              disabled={loading}
            >
              Открыть книгу
            </button>

            <div className="ornament-line text-xs text-ink-faded">или</div>

            <button
              className="ghost-btn w-full py-3 rounded-sm"
              onClick={onRegister}
              disabled={loading}
            >
              Создать новую запись
            </button>
          </div>
        )}

        {step === 'pin' && (
          <div className="w-full flex flex-col items-center gap-4">
            <button
              onClick={() => { setStep('login'); setError(''); }}
              className="self-start flex items-center gap-2 text-ink-faded text-sm font-cormorant hover:text-ink transition-colors"
              disabled={loading}
            >
              <Icon name="ChevronLeft" size={16} />
              Назад
            </button>

            <div className="ornament-line w-full font-fell text-sm">Пин-код</div>

            <p className="font-cormorant text-ink-light italic text-center">
              Добро пожаловать,{' '}
              <span className="font-medium text-ink">{login}</span>
            </p>

            {loading && (
              <p className="text-ink-faded text-sm font-cormorant italic animate-fade-in">
                Проверяем ключ...
              </p>
            )}

            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}

            {!loading && (
              <PinInput
                label="Введите ваш пин-код"
                onComplete={handlePin}
              />
            )}
          </div>
        )}
      </div>

      <div className="pb-8 text-center">
        <p className="text-ink-faded text-xs font-cormorant italic">
          Ваши данные защищены · Активность скрыта
        </p>
      </div>
    </div>
  );
}
