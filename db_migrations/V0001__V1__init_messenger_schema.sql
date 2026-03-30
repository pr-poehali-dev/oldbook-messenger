
CREATE TABLE IF NOT EXISTS t_p79363555_oldbook_messenger.users (
  login VARCHAR(50) PRIMARY KEY,
  pin_hash VARCHAR(255) NOT NULL,
  security_question TEXT NOT NULL,
  security_answer VARCHAR(255) NOT NULL,
  text_color VARCHAR(20) DEFAULT '#2c1f0e',
  session_token VARCHAR(128),
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

CREATE TABLE IF NOT EXISTS t_p79363555_oldbook_messenger.chats (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  creator_login VARCHAR(50) NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  last_message TEXT,
  last_message_time BIGINT
);

CREATE TABLE IF NOT EXISTS t_p79363555_oldbook_messenger.messages (
  id VARCHAR(128) PRIMARY KEY,
  chat_id VARCHAR(128) NOT NULL,
  sender_login VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  color VARCHAR(20) DEFAULT '#2c1f0e',
  encrypted BOOLEAN DEFAULT TRUE,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS t_p79363555_oldbook_messenger.unread (
  user_login VARCHAR(50) NOT NULL,
  chat_id VARCHAR(128) NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_login, chat_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON t_p79363555_oldbook_messenger.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chats_expires ON t_p79363555_oldbook_messenger.chats(expires_at);
CREATE INDEX IF NOT EXISTS idx_unread_user ON t_p79363555_oldbook_messenger.unread(user_login);
