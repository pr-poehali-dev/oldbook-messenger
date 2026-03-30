import { useState } from 'react';
import PinInput from '@/components/PinInput';
import { hashPin } from '@/lib/store';
import { apiLogin, apiLogout, apiUpdatePin, apiDeleteAccount, clearSession } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Screen } from './Index';
import Icon from '@/components/ui/icon';

interface SecurityPageProps {
  currentUser: string;
  navigate: (s: Screen) => void;
  onLogout: () => void;
  onDeleted: () => void;
}

type Action = 'none' | 'changePin' | 'changePin2' | 'logout' | 'delete';

export default function SecurityPage({ currentUser, navigate, onLogout, onDeleted }: SecurityPageProps) {
  const [action, setAction] = useState<Action>('none');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setAction('none');
    setError('');
    setSuccess('');
    setLoading(false);
  };

  // === Смена пин-кода: шаг 1 — верифицировать текущий ===
  const handleChangePinVerify = async (pin: string) => {
    setLoading(true);
    setError('');
    try {
      await apiLogin(currentUser, hashPin(pin));
      setError('');
      setAction('changePin2');
    } catch {
      setError('Неверный текущий пин-код');
    } finally {
      setLoading(false);
    }
  };

  // === Смена пин-кода: шаг 2 — задать новый ===
  const handleNewPin = async (pin: string) => {
    setLoading(true);
    setError('');
    try {
      await apiUpdatePin(hashPin(pin));
      setSuccess('Пин-код успешно изменён');
      setAction('none');
    } catch {
      setError('Не удалось изменить пин-код');
    } finally {
      setLoading(false);
    }
  };

  // === Выход из аккаунта ===
  const handleLogoutPin = async (pin: string) => {
    setLoading(true);
    setError('');
    try {
      await apiLogin(currentUser, hashPin(pin));
      await apiLogout();
      clearSession();
      onLogout();
    } catch {
      setError('Неверный пин-код');
      setLoading(false);
    }
  };

  // === Удаление аккаунта ===
  const handleDeletePin = async (pin: string) => {
    setLoading(true);
    setError('');
    try {
      await apiLogin(currentUser, hashPin(pin));
      await apiDeleteAccount();
      onDeleted();
    } catch {
      setError('Неверный пин-код');
      setLoading(false);
    }
  };

  const menuItems = [
    {
      icon: 'KeyRound',
      label: 'Изменить пин-код',
      desc: 'Установить новый 6-значный ключ',
      color: 'var(--aged-blue)',
      action: () => { reset(); setAction('changePin'); },
    },
    {
      icon: 'LogOut',
      label: 'Выйти из аккаунта',
      desc: 'Требует подтверждение пин-кодом',
      color: 'var(--ink-light)',
      action: () => { reset(); setAction('logout'); },
    },
    {
      icon: 'Trash2',
      label: 'Удалить аккаунт',
      desc: 'Полное удаление всех данных',
      color: 'var(--aged-red)',
      action: () => { reset(); setAction('delete'); },
    },
  ];

  const renderPinOverlay = (
    title: string,
    subtitle: string,
    onComplete: (pin: string) => void,
    dangerColor?: string
  ) => (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--parchment)', maxWidth: 430, margin: '0 auto' }}
    >
      <div className="header-bar px-5 pt-12 pb-5">
        <button
          onClick={reset}
          className="flex items-center gap-2 text-ink-faded hover:text-sepia-light transition-colors"
          disabled={loading}
        >
          <Icon name="ChevronLeft" size={18} />
          <span className="font-cormorant text-sm">Назад</span>
        </button>
        <h2 className="font-fell text-xl mt-3" style={{ color: dangerColor || 'var(--sepia-light)' }}>
          {title}
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <p className="font-cormorant text-ink-faded italic text-center">{subtitle}</p>

        {loading ? (
          <div className="flex items-center gap-2">
            <Icon name="Loader" size={18} className="text-ink-faded animate-spin" />
            <span className="font-cormorant text-ink-faded italic text-sm">Выполняем запрос...</span>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}
            <PinInput
              label="Введите пин-код для подтверждения"
              onComplete={(pin) => { setError(''); onComplete(pin); }}
            />
          </>
        )}
      </div>
    </div>
  );

  const renderNewPinOverlay = (
    title: string,
    subtitle: string,
    onComplete: (pin: string) => void
  ) => (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--parchment)', maxWidth: 430, margin: '0 auto' }}
    >
      <div className="header-bar px-5 pt-12 pb-5">
        <button
          onClick={reset}
          className="flex items-center gap-2 text-ink-faded hover:text-sepia-light transition-colors"
          disabled={loading}
        >
          <Icon name="ChevronLeft" size={18} />
          <span className="font-cormorant text-sm">Назад</span>
        </button>
        <h2 className="font-fell text-xl mt-3 text-sepia-light">{title}</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        <p className="font-cormorant text-ink-faded italic text-center">{subtitle}</p>

        {loading ? (
          <div className="flex items-center gap-2">
            <Icon name="Loader" size={18} className="text-ink-faded animate-spin" />
            <span className="font-cormorant text-ink-faded italic text-sm">Сохраняем...</span>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}
            <PinInput label="Новый пин-код" onComplete={onComplete} />
          </>
        )}
      </div>
    </div>
  );

  if (action === 'changePin') {
    return renderPinOverlay(
      'Смена пин-кода',
      'Введите текущий пин-код для подтверждения',
      handleChangePinVerify,
      'var(--aged-blue)'
    );
  }

  if (action === 'changePin2') {
    return renderNewPinOverlay(
      'Новый пин-код',
      'Введите новый 6-значный пин-код',
      handleNewPin
    );
  }

  if (action === 'logout') {
    return renderPinOverlay(
      'Выход из аккаунта',
      'Введите пин-код для подтверждения выхода',
      handleLogoutPin
    );
  }

  if (action === 'delete') {
    return renderPinOverlay(
      'Удаление аккаунта',
      'Это действие необратимо. Введите пин-код для подтверждения удаления аккаунта и всех данных.',
      handleDeletePin,
      'var(--aged-red)'
    );
  }

  return (
    <div className="screen" style={{ background: 'var(--sepia-light)' }}>
      <div className="header-bar px-5 pt-12 pb-5">
        <h1 className="font-uncial text-xl text-sepia-light tracking-wider">Безопасность</h1>
        <p className="text-ink-faded text-xs font-cormorant italic mt-0.5">
          Защита и управление аккаунтом
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-5 py-5 flex flex-col gap-5 animate-fade-in">

        {success && (
          <div
            className="rounded-sm px-4 py-3 flex items-center gap-3 animate-fade-in"
            style={{ background: '#1e4a2e', border: '1px solid #2e5c3e' }}
          >
            <Icon name="Check" size={16} style={{ color: '#a8d5b5' }} />
            <p className="font-cormorant text-sm" style={{ color: '#a8d5b5' }}>{success}</p>
          </div>
        )}

        {/* Security status */}
        <div
          className="rounded-sm p-4"
          style={{ background: 'var(--parchment)', border: '1px solid var(--sepia-dark)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon name="ShieldCheck" size={16} className="text-aged-green" />
            <p className="font-fell text-sm text-ink-light tracking-wide">Статус защиты</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              'Пин-код установлен',
              'Контрольный вопрос задан',
              'E2E шифрование активно',
            ].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--aged-green)' }}
                />
                <p className="font-cormorant text-ink-faded text-sm">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ border: '1px solid var(--sepia-dark)' }}
        >
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full px-4 py-4 flex items-center gap-4 hover:opacity-90 transition-opacity text-left active:scale-[0.99]"
              style={{
                background: 'var(--parchment)',
                borderBottom: i < menuItems.length - 1 ? '1px solid var(--sepia-mid)' : 'none',
              }}
            >
              <div
                className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                style={{ background: 'var(--sepia-mid)', border: '1px solid var(--sepia-dark)' }}
              >
                <Icon name={item.icon} size={16} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cormorant font-semibold text-ink text-sm">{item.label}</p>
                <p className="font-cormorant text-ink-faded text-xs italic mt-0.5">{item.desc}</p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-ink-faded shrink-0" />
            </button>
          ))}
        </div>

        {/* Info */}
        <div
          className="rounded-sm p-4"
          style={{ background: 'var(--sepia-mid)', border: '1px solid var(--sepia-dark)' }}
        >
          <div className="flex items-start gap-2">
            <Icon name="Info" size={14} className="text-ink-faded mt-0.5 shrink-0" />
            <p className="font-cormorant text-ink-faded text-xs italic leading-relaxed">
              Все операции требуют подтверждения пин-кодом.
              Пин-код хранится в хэшированном виде и не может быть восстановлен.
            </p>
          </div>
        </div>
      </div>

      <BottomNav active="security" navigate={navigate} />
    </div>
  );
}
