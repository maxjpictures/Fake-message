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
  'Можно заменить мой аватар на любое твое фото.',
  'На GitHub Pages это будет работать как обычный сайт.',
  'Если хочешь, можно потом добавить еще ветки диалога.'
];

const initialMessages = [
  { type: 'incoming', text: 'Как ты после вчерашнего малышка? Сегодня все в силе?' },
  { type: 'incoming', text: 'Малышка, я у подъезда!' }
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
  bubble.className = `message ${type} pop-in`;
  bubble.textContent = text;

  row.appendChild(bubble);
  chatArea.appendChild(row);
  scrollToBottom();

  bubble.addEventListener('animationend', () => {
    bubble.classList.remove('pop-in');
    bubble.style.opacity = '1';
  }, { once: true });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

function setComposerState() {
  if (sendBtn) {
    sendBtn.disabled = !messageInput.value.trim();
  }
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
    setTimeout(() => addMessage('incoming', reply), 120);
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

function zoomBy(step) {
  scale = clampScale(scale + step);
  applyTransform();
}

function openAvatarModal() {
  if (openAvatar) openAvatar.classList.add('fly-origin');
  avatarModal.classList.remove('hidden');
  avatarModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    avatarModal.style.opacity = '1';
  });

  resetZoom();
  setTimeout(() => {
    if (openAvatar) openAvatar.classList.remove('fly-origin');
  }, 220);
}

function closeAvatarModal() {
  avatarModal.style.opacity = '0';
  setTimeout(() => {
    avatarModal.classList.add('hidden');
    avatarModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    avatarModal.style.opacity = '';
  }, 220);
}

function getDistance(touches) {
  const [a, b] = touches;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

if (zoomStage) {
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
    if (!event.touches.length) isDragging = false;

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
    zoomBy(delta);
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
}

if (openAvatar) openAvatar.addEventListener('click', openAvatarModal);
if (closeAvatar) closeAvatar.addEventListener('click', closeAvatarModal);
if (composerForm) composerForm.addEventListener('submit', handleSubmit);
if (messageInput) messageInput.addEventListener('input', setComposerState);

window.addEventListener('keydown', (event) => {
  if (avatarModal && event.key === 'Escape' && !avatarModal.classList.contains('hidden')) {
    closeAvatarModal();
  }
});

renderTimestamp();
initialMessages.forEach((item) => addMessage(item.type, item.text));
setComposerState();
