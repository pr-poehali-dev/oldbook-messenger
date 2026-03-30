import Icon from '@/components/ui/icon';
import { Screen } from '@/pages/Index';

interface BottomNavProps {
  active: Screen;
  navigate: (s: Screen) => void;
}

const items = [
  { screen: 'chats' as Screen, icon: 'MessageCircle', label: 'Беседы' },
  { screen: 'profile' as Screen, icon: 'User', label: 'Профиль' },
  { screen: 'settings' as Screen, icon: 'Settings', label: 'Убор' },
  { screen: 'security' as Screen, icon: 'Shield', label: 'Защита' },
];

export default function BottomNav({ active, navigate }: BottomNavProps) {
  return (
    <nav className="nav-bar fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="flex items-center justify-around py-2 pb-safe">
        {items.map(item => (
          <button
            key={item.screen}
            onClick={() => navigate(item.screen)}
            className={`nav-item flex flex-col items-center gap-1 px-4 py-1 ${active === item.screen ? 'active' : ''}`}
          >
            <Icon
              name={item.icon}
              size={20}
              className={active === item.screen ? 'text-sepia-light' : 'text-ink-faded'}
            />
            <span className="text-[10px] tracking-widest uppercase">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
