import { useState, useEffect } from 'react';
import LoginPage from './Login';
import RegisterPage from './Register';
import ChatsPage from './Chats';
import ChatRoomPage from './ChatRoom';
import ProfilePage from './Profile';
import SettingsPage from './Settings';
import SecurityPage from './Security';
import { getCurrentUser } from '@/lib/store';

export type Screen =
  | 'login'
  | 'register'
  | 'chats'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'security';

export default function Index() {
  const [screen, setScreen] = useState<Screen>('login');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setScreen('chats');
    }
  }, []);

  const navigate = (s: Screen, chatId?: string) => {
    if (chatId) setActiveChatId(chatId);
    setScreen(s);
  };

  const onLogin = (login: string) => {
    setCurrentUser(login);
    setScreen('chats');
  };

  const onLogout = () => {
    setCurrentUser(null);
    setScreen('login');
  };

  if (screen === 'login') {
    return <LoginPage onLogin={onLogin} onRegister={() => setScreen('register')} />;
  }
  if (screen === 'register') {
    return <RegisterPage onRegistered={onLogin} onBack={() => setScreen('login')} />;
  }
  if (screen === 'chat' && activeChatId) {
    return (
      <ChatRoomPage
        chatId={activeChatId}
        currentUser={currentUser!}
        onBack={() => setScreen('chats')}
      />
    );
  }
  if (screen === 'profile') {
    return (
      <ProfilePage
        currentUser={currentUser!}
        navigate={navigate}
        onLogout={onLogout}
      />
    );
  }
  if (screen === 'settings') {
    return (
      <SettingsPage
        currentUser={currentUser!}
        navigate={navigate}
      />
    );
  }
  if (screen === 'security') {
    return (
      <SecurityPage
        currentUser={currentUser!}
        navigate={navigate}
        onLogout={onLogout}
        onDeleted={onLogout}
      />
    );
  }

  return (
    <ChatsPage
      currentUser={currentUser!}
      navigate={navigate}
    />
  );
}
