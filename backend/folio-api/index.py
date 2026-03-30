"""
API мессенджера Фолиант — action-based роутинг через ?action=...
Действия: register, login, logout, user_get, user_color, user_pin, user_delete,
           chats_list, chats_create, chat_clear, messages_get, messages_send, unread_get
"""
import json
import os
import random
import string
import time
import psycopg2

SCHEMA = 't_p79363555_oldbook_messenger'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, X-User-Login',
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(data, status=200):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False)
    }


def err(msg, status=400):
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps({'error': msg}, ensure_ascii=False)
    }


def gen_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=64))


def auth_user(conn, login, token):
    if not login or not token:
        return False
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT login FROM {SCHEMA}.users WHERE login=%s AND session_token=%s",
            (login, token)
        )
        return cur.fetchone() is not None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    qs = event.get('queryStringParameters', {}) or {}
    headers = event.get('headers', {}) or {}
    action = qs.get('action', '')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            return err('Некорректный JSON')

    login_h = headers.get('X-User-Login', '')
    token_h = headers.get('X-Session-Token', '')

    conn = get_db()
    try:
        # ── REGISTER ──────────────────────────────────────────────────────────
        if action == 'register':
            login = (body.get('login') or '').strip()
            pin_hash = body.get('pinHash', '')
            question = body.get('securityQuestion', '')
            answer = (body.get('securityAnswer') or '').strip().lower()
            text_color = body.get('textColor', '#2c1f0e')

            if not login or not pin_hash:
                return err('Логин и пин-код обязательны')
            if len(login) < 3 or len(login) > 50:
                return err('Логин от 3 до 50 символов')

            with conn.cursor() as cur:
                cur.execute(f"SELECT login FROM {SCHEMA}.users WHERE login=%s", (login,))
                if cur.fetchone():
                    return err('Логин уже занят')
                token = gen_token()
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (login, pin_hash, security_question, security_answer, text_color, session_token) VALUES (%s,%s,%s,%s,%s,%s)",
                    (login, pin_hash, question, answer, text_color, token)
                )
                conn.commit()
            return ok({'token': token, 'login': login})

        # ── LOGIN ─────────────────────────────────────────────────────────────
        if action == 'login':
            login = (body.get('login') or '').strip()
            pin_hash = body.get('pinHash', '')
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT login, pin_hash, security_question, text_color FROM {SCHEMA}.users WHERE login=%s",
                    (login,)
                )
                row = cur.fetchone()
                if not row:
                    return err('Пользователь не найден', 404)
                if row[1] != pin_hash:
                    return err('Неверный пин-код', 401)
                token = gen_token()
                cur.execute(f"UPDATE {SCHEMA}.users SET session_token=%s WHERE login=%s", (token, login))
                conn.commit()
            return ok({'token': token, 'login': login, 'securityQuestion': row[2], 'textColor': row[3]})

        # ── LOGOUT ────────────────────────────────────────────────────────────
        if action == 'logout':
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET session_token=NULL WHERE login=%s AND session_token=%s",
                    (login_h, token_h)
                )
                conn.commit()
            return ok({'ok': True})

        # ── GET USER ──────────────────────────────────────────────────────────
        if action == 'user_get':
            target = qs.get('login', login_h)
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT login, security_question, text_color, created_at FROM {SCHEMA}.users WHERE login=%s",
                    (target,)
                )
                row = cur.fetchone()
                if not row:
                    return err('Не найден', 404)
            return ok({'login': row[0], 'securityQuestion': row[1], 'textColor': row[2], 'createdAt': row[3]})

        # ── UPDATE COLOR ──────────────────────────────────────────────────────
        if action == 'user_color':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            color = body.get('textColor', '#2c1f0e')
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.users SET text_color=%s WHERE login=%s", (color, login_h))
                conn.commit()
            return ok({'ok': True})

        # ── CHANGE PIN ────────────────────────────────────────────────────────
        if action == 'user_pin':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            new_hash = body.get('newPinHash', '')
            if not new_hash:
                return err('Новый пин-код обязателен')
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.users SET pin_hash=%s WHERE login=%s", (new_hash, login_h))
                conn.commit()
            return ok({'ok': True})

        # ── DELETE ACCOUNT ────────────────────────────────────────────────────
        if action == 'user_delete':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET session_token=NULL, pin_hash='DELETED', security_answer='DELETED' WHERE login=%s",
                    (login_h,)
                )
                conn.commit()
            return ok({'ok': True})

        # ── LIST CHATS ────────────────────────────────────────────────────────
        if action == 'chats_list':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            now_ms = int(time.time() * 1000)
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT c.id, c.name, c.creator_login, c.created_at, c.expires_at,
                               c.last_message, c.last_message_time,
                               COALESCE(u.count, 0) as unread
                        FROM {SCHEMA}.chats c
                        LEFT JOIN {SCHEMA}.unread u ON u.chat_id=c.id AND u.user_login=%s
                        WHERE c.expires_at > %s
                        ORDER BY COALESCE(c.last_message_time, c.created_at) DESC""",
                    (login_h, now_ms)
                )
                rows = cur.fetchall()
            return ok({'chats': [{
                'id': r[0], 'name': r[1], 'creatorLogin': r[2],
                'createdAt': r[3], 'expiresAt': r[4],
                'lastMessage': r[5], 'lastMessageTime': r[6],
                'unread': r[7]
            } for r in rows]})

        # ── CREATE CHAT ───────────────────────────────────────────────────────
        if action == 'chats_create':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            name = (body.get('name') or '').strip()
            if not name:
                return err('Название обязательно')
            now = int(time.time() * 1000)
            chat_id = f"chat_{now}_{gen_token()[:8]}"
            expires_at = now + 24 * 60 * 60 * 1000
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.chats (id, name, creator_login, created_at, expires_at) VALUES (%s,%s,%s,%s,%s)",
                    (chat_id, name, login_h, now, expires_at)
                )
                conn.commit()
            return ok({'id': chat_id, 'name': name, 'creatorLogin': login_h,
                       'createdAt': now, 'expiresAt': expires_at, 'unread': 0})

        # ── CLEAR CHAT MESSAGES ───────────────────────────────────────────────
        if action == 'chat_clear':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            chat_id = body.get('chatId', '')
            if not chat_id:
                return err('chatId обязателен')
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.messages SET text='[сообщение удалено]', encrypted=FALSE WHERE chat_id=%s",
                    (chat_id,)
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.chats SET last_message='Сообщения удалены', last_message_time=%s WHERE id=%s",
                    (int(time.time() * 1000), chat_id)
                )
                conn.commit()
            return ok({'ok': True})

        # ── GET MESSAGES ──────────────────────────────────────────────────────
        if action == 'messages_get':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            chat_id = qs.get('chatId', '')
            since = int(qs.get('since', '0'))
            if not chat_id:
                return err('chatId обязателен')
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, chat_id, sender_login, text, color, encrypted, created_at FROM {SCHEMA}.messages WHERE chat_id=%s AND created_at>%s ORDER BY created_at ASC LIMIT 200",
                    (chat_id, since)
                )
                rows = cur.fetchall()
                # Сбрасываем счётчик непрочитанных
                cur.execute(
                    f"INSERT INTO {SCHEMA}.unread (user_login, chat_id, count) VALUES (%s,%s,0) ON CONFLICT (user_login,chat_id) DO UPDATE SET count=0",
                    (login_h, chat_id)
                )
                conn.commit()
            return ok({'messages': [{
                'id': r[0], 'chatId': r[1], 'senderId': r[2],
                'text': r[3], 'color': r[4], 'encrypted': r[5], 'timestamp': r[6]
            } for r in rows]})

        # ── SEND MESSAGE ──────────────────────────────────────────────────────
        if action == 'messages_send':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            chat_id = body.get('chatId', '')
            text = body.get('text', '')
            color = body.get('color', '#2c1f0e')
            encrypted = body.get('encrypted', True)
            if not chat_id or not text:
                return err('chatId и text обязательны')
            now = int(time.time() * 1000)
            msg_id = f"msg_{now}_{gen_token()[:8]}"
            preview = '🔒 Зашифровано' if encrypted else text[:60]
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.messages (id, chat_id, sender_login, text, color, encrypted, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (msg_id, chat_id, login_h, text, color, encrypted, now)
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.chats SET last_message=%s, last_message_time=%s WHERE id=%s",
                    (preview, now, chat_id)
                )
                # Увеличиваем счётчик у всех пользователей кроме отправителя
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.unread (user_login, chat_id, count)
                        SELECT u.login, %s, 1 FROM {SCHEMA}.users u
                        WHERE u.login != %s AND u.session_token IS NOT NULL
                        ON CONFLICT (user_login, chat_id) DO UPDATE SET count = {SCHEMA}.unread.count + 1""",
                    (chat_id, login_h)
                )
                conn.commit()
            return ok({'id': msg_id, 'chatId': chat_id, 'senderId': login_h,
                       'text': text, 'color': color, 'encrypted': encrypted, 'timestamp': now})

        # ── UNREAD ────────────────────────────────────────────────────────────
        if action == 'unread_get':
            if not auth_user(conn, login_h, token_h):
                return err('Не авторизован', 401)
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT chat_id, count FROM {SCHEMA}.unread WHERE user_login=%s AND count>0",
                    (login_h,)
                )
                rows = cur.fetchall()
            data = {r[0]: r[1] for r in rows}
            return ok({'unread': data, 'total': sum(data.values())})

        return err('Неизвестное действие', 404)

    finally:
        conn.close()
