const chatArea = document.getElementById('chatArea');
const composerForm = document.getElementById('composerForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingRow = document.getElementById('typingRow');
const statusText = document.getElementById('statusText');

const openAvatar = document.getElementById('openAvatar');
const avatarModal = document.getElementById('avatarModal');
const closeAvatar = document.getElementById('closeAvatar');
const zoomImage = document.getElementById('zoomImage');
const zoomStage = document.getElementById('zoomStage');

const scriptedReplies = [
  'Привет. Я уже здесь ✨',
  'Да, выглядит очень похоже на настоящий чат.',
  'Можно заменить мой аватар на любое твоё фото.',
  'На GitHub Pages это работает как обычный сайт.',
  'Если хочешь, потом можно добавить несколько веток диалога.'
];

const initialMessages = [
  { type: 'incoming', text: 'Привет! Это демо-чат в стиле iPhone.' },
  { type: 'incoming', text: 'Напиши сообщение — я отвечу заранее подготовленной фразой.' }
];

let replyIndex = 0;
let typingTimer = null;
let scale = 1;
let translateX = 0;
let translateY = 0;
let lastTap = 0;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let dragStartX = 0;
let dragStartY = 0;
let originX = 0;
let originY = 0;
let isDragging = false;

function formatTime() {
  return '12:47';
}

function renderTimestamp(label = 'Сегодня ' + formatTime()) {
  const stamp = document.createElement('div');
  stamp.className = 'time-stamp';
  stamp.textContent = label;
  chatArea.appendChild(stamp);
}

function addMessage(type, text) {
  const row = document.createElement('div');
  row.className = `message-row ${type}`;

  const bubble = document.createElement('div');
  bubble.className = `message ${type}`;
  bubble.textContent = text;

  row.appendChild(bubble);
  chatArea.appendChild(row);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

function setComposerState() {
  sendBtn.disabled = !messageInput.value.trim();
}

function showTyping(show) {
  typingRow.classList.toggle('hidden', !show);
  typingRow.setAttribute('aria-hidden', show ? 'false' : 'true');
  statusText.textContent = show ? 'печатает…' : 'в сети';
  scrollToBottom();
}

function getReplyForMessage(userText) {
  const normalized = userText.toLowerCase();

  if (normalized.includes('фото') || normalized.includes('аватар')) {
    return 'Нажми на мою аватарку сверху — она откроется во весь экран.';
  }
  if (normalized.includes('github') || normalized.includes('git')) {
    return 'Да, этот проект готов для загрузки в репозиторий и публикации через GitHub Pages.';
  }
  if (normalized.includes('привет')) {
    return 'Привет-привет 👋';
  }

  const reply = scriptedReplies[replyIndex % scriptedReplies.length];
  replyIndex += 1;
  return reply;
}

function handleSubmit(event) {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  addMessage('outgoing', text);
  messageInput.value = '';
  setComposerState();
  showTyping(true);

  clearTimeout(typingTimer);
  const reply = getReplyForMessage(text);
  const delay = 900 + Math.min(text.length * 18, 1200);

  typingTimer = setTimeout(() => {
    showTyping(false);
    addMessage('incoming', reply);
  }, delay);
}

function applyTransform() {
  zoomImage.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
}

function clampScale(value) {
  return Math.min(4, Math.max(1, value));
}

function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  applyTransform();
}

function openAvatarModal() {
  avatarModal.classList.remove('hidden');
  avatarModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  resetZoom();
}

function closeAvatarModal() {
  avatarModal.classList.add('hidden');
  avatarModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function getDistance(touches) {
  const [a, b] = touches;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

zoomStage.addEventListener('touchstart', (event) => {
  if (event.touches.length === 2) {
    pinchStartDistance = getDistance(event.touches);
    pinchStartScale = scale;
  } else if (event.touches.length === 1) {
    isDragging = true;
    dragStartX = event.touches[0].clientX;
    dragStartY = event.touches[0].clientY;
    originX = translateX;
    originY = translateY;
  }
}, { passive: false });

zoomStage.addEventListener('touchmove', (event) => {
  event.preventDefault();
  if (event.touches.length === 2) {
    const distance = getDistance(event.touches);
    const nextScale = pinchStartScale * (distance / pinchStartDistance);
    scale = clampScale(nextScale);
    applyTransform();
  } else if (event.touches.length === 1 && isDragging && scale > 1) {
    translateX = originX + (event.touches[0].clientX - dragStartX);
    translateY = originY + (event.touches[0].clientY - dragStartY);
    applyTransform();
  }
}, { passive: false });

zoomStage.addEventListener('touchend', (event) => {
  if (!event.touches.length) {
    isDragging = false;
  }

  const now = Date.now();
  if (event.changedTouches.length === 1 && now - lastTap < 280) {
    scale = scale > 1 ? 1 : 2;
    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }
    applyTransform();
  }
  lastTap = now;
});

zoomStage.addEventListener('wheel', (event) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.12 : 0.12;
  scale = clampScale(scale + delta);
  applyTransform();
}, { passive: false });

zoomStage.addEventListener('pointerdown', (event) => {
  if (scale <= 1) return;
  isDragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  originX = translateX;
  originY = translateY;
  zoomStage.setPointerCapture(event.pointerId);
});

zoomStage.addEventListener('pointermove', (event) => {
  if (!isDragging || scale <= 1) return;
  translateX = originX + (event.clientX - dragStartX);
  translateY = originY + (event.clientY - dragStartY);
  applyTransform();
});

zoomStage.addEventListener('pointerup', () => {
  isDragging = false;
});

openAvatar.addEventListener('click', openAvatarModal);
closeAvatar.addEventListener('click', closeAvatarModal);
composerForm.addEventListener('submit', handleSubmit);
messageInput.addEventListener('input', setComposerState);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !avatarModal.classList.contains('hidden')) {
    closeAvatarModal();
  }
});
.message-row {
  display: flex;
  margin: 6px 0;
}

.message-row.incoming {
  justify-content: flex-start;
}

.message-row.outgoing {
  justify-content: flex-end;
}

.message {
  max-width: min(80%, 300px);
  padding: 12px 15px;
  border-radius: 22px;
  font-size: 18px;
  line-height: 1.32;
  word-wrap: break-word;
  box-shadow: 0 8px 24px rgba(34, 29, 76, 0.08);
  opacity: 0;
  transform: translateY(10px) scale(0.96);
  animation: messageIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.message.incoming {
  background: var(--incoming);
  color: var(--text);
  border-top-left-radius: 8px;
  transform-origin: left bottom;
}

.message.outgoing {
  background: var(--outgoing);
  color: white;
  border-top-right-radius: 8px;
  transform-origin: right bottom;
}

@keyframes messageIn {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.96);
  }
  60% {
    opacity: 1;
    transform: translateY(-1px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

renderTimestamp();
initialMessages.forEach((item) => addMessage(item.type, item.text));
setComposerState();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
