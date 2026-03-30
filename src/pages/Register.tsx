import { useState } from 'react';
import PinInput from '@/components/PinInput';
import { hashPin } from '@/lib/store';
import { apiRegister } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface RegisterPageProps {
  onRegistered: (login: string) => void;
  onBack: () => void;
}

type Step = 'login' | 'pin' | 'confirm' | 'question';

const SECURITY_QUESTIONS = [
  'Имя вашего первого питомца?',
  'Город, где вы родились?',
  'Девичья фамилия матери?',
  'Любимый литературный персонаж?',
  'Название первой школы?',
];

export default function RegisterPage({ onRegistered, onBack }: RegisterPageProps) {
  const [step, setStep] = useState<Step>('login');
  const [login, setLogin] = useState('');
  const [pin, setPin] = useState('');
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginNext = () => {
    const trimmed = login.trim();
    if (trimmed.length < 3) { setError('Минимум 3 символа'); return; }
    if (trimmed.length > 20) { setError('Максимум 20 символов'); return; }
    setError('');
    setStep('pin');
  };

  const handlePinSet = (p: string) => {
    setPin(p);
    setStep('confirm');
  };

  const handlePinConfirm = (p: string) => {
    if (p !== pin) {
      setError('Пин-коды не совпадают');
      setStep('pin');
      return;
    }
    setError('');
    setStep('question');
  };

  const handleFinish = async () => {
    if (!answer.trim()) { setError('Введите ответ на вопрос'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await apiRegister({
        login: login.trim(),
        pinHash: hashPin(pin),
        securityQuestion: question,
        securityAnswer: answer.trim().toLowerCase(),
        textColor: '#2c1f0e',
      });
      localStorage.setItem(`folio_color_${data.login}`, '#2c1f0e');
      onRegistered(data.login);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes('занят') ||
        msg.toLowerCase().includes('exists') ||
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('409')
      ) {
        setError('Логин уже занят');
        setStep('login');
      } else {
        setError('Ошибка регистрации: ' + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = ['login', 'pin', 'confirm', 'question'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="screen parchment-bg flex flex-col">
      <div className="header-bar px-6 pt-12 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-ink-faded hover:text-sepia-light transition-colors"
          disabled={loading}
        >
          <Icon name="ChevronLeft" size={18} />
          <span className="font-cormorant text-sm">Назад</span>
        </button>
        <h1 className="font-uncial text-xl text-sepia-light tracking-wider mt-3">
          Новая Запись
        </h1>

        {/* Step progress */}
        <div className="flex gap-2 mt-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full transition-all duration-300"
              style={{ background: i <= stepIdx ? 'var(--sepia-dark)' : 'rgba(196,168,130,0.3)' }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 animate-fade-in">

        {step === 'login' && (
          <div className="w-full max-w-xs flex flex-col gap-5">
            <div className="ornament-line font-fell text-sm">Имя пользователя</div>
            <p className="text-ink-faded text-sm font-cormorant italic text-center">
              Это ваше тайное имя в книге
            </p>
            <input
              className="vintage-input w-full px-3 py-3 rounded-sm"
              placeholder="Выберите логин..."
              value={login}
              onChange={e => { setLogin(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLoginNext()}
              autoComplete="off"
              autoCapitalize="off"
              maxLength={20}
            />
            <p className="text-ink-faded text-xs font-cormorant">{login.length}/20 символов</p>
            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}
            <button
              className="ink-btn w-full py-3 rounded-sm"
              onClick={handleLoginNext}
              disabled={loading}
            >
              Далее
            </button>
          </div>
        )}

        {step === 'pin' && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="ornament-line w-full font-fell text-sm">Создайте пин-код</div>
            <p className="text-ink-faded text-sm font-cormorant italic text-center">
              6 цифр — ваш ключ к книге
            </p>
            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}
            <PinInput
              label="Введите 6-значный пин-код"
              onComplete={handlePinSet}
            />
          </div>
        )}

        {step === 'confirm' && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="ornament-line w-full font-fell text-sm">Подтвердите пин-код</div>
            <p className="text-ink-faded text-sm font-cormorant italic text-center">
              Повторите для надёжности
            </p>
            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}
            <PinInput
              label="Повторите пин-код"
              onComplete={handlePinConfirm}
            />
          </div>
        )}

        {step === 'question' && (
          <div className="w-full max-w-xs flex flex-col gap-5">
            <div className="ornament-line font-fell text-sm">Контрольный вопрос</div>
            <p className="text-ink-faded text-sm font-cormorant italic text-center">
              Для восстановления доступа
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-ink-faded text-xs tracking-widest uppercase font-cormorant">
                Вопрос
              </label>
              <select
                className="vintage-input w-full px-3 py-3 rounded-sm appearance-none cursor-pointer"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={loading}
              >
                {SECURITY_QUESTIONS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-ink-faded text-xs tracking-widest uppercase font-cormorant">
                Ответ
              </label>
              <input
                className="vintage-input w-full px-3 py-3 rounded-sm"
                placeholder="Ваш ответ..."
                value={answer}
                onChange={e => { setAnswer(e.target.value); setError(''); }}
                autoComplete="off"
                autoCapitalize="off"
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && handleFinish()}
              />
            </div>

            {error && (
              <p className="text-aged-red text-sm italic font-cormorant animate-fade-in">{error}</p>
            )}

            <div className="sepia-card p-3 rounded-sm">
              <p className="text-xs font-cormorant text-ink-faded italic flex items-start gap-2">
                <Icon name="Shield" size={14} className="text-aged-green mt-0.5 shrink-0" />
                Ваш пин-код и ответ хранятся в зашифрованном виде. Мы не имеем к ним доступа.
              </p>
            </div>

            {loading ? (
              <div className="w-full py-3 flex items-center justify-center gap-2">
                <Icon name="Loader" size={16} className="text-ink-faded animate-spin" />
                <span className="font-cormorant text-ink-faded italic text-sm">Создаём запись...</span>
              </div>
            ) : (
              <button
                className="ink-btn w-full py-3 rounded-sm"
                onClick={handleFinish}
                disabled={loading}
              >
                Открыть Фолиант
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
