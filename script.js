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
  'Буду в 19:00!'
];

const initialMessages = [
  { type: 'incoming', text: 'Как ты после вчерашнего малышка? Сегодня все в силе?' }
];

let replyIndex = 0;
let typingTimer = null;
let finalMessageTimer = null;

let scale = 1;
let startScale = 1;
let translateX = 0;
let translateY = 0;
let startTranslateX = 0;
let startTranslateY = 0;
let startX = 0;
let startY = 0;
let pinchStartDistance = 0;
let isDragging = false;
let isPinching = false;

function renderTimestamp() {
  if (document.querySelector('.time-stamp')) return;

  const stamp = document.createElement('div');
  stamp.className = 'time-stamp';
  stamp.textContent = 'Сегодня';
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
  sendBtn.disabled = !messageInput.value.trim();
}

function showTyping(show) {
  typingRow.classList.toggle('hidden', !show);
  statusText.textContent = show ? 'печатает…' : 'в сети';
  scrollToBottom();
}

function getReplyForMessage(userText) {
  const normalized = userText.toLowerCase();

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
  clearTimeout(finalMessageTimer);

  const reply = getReplyForMessage(text);
  const delay = 900 + Math.min(text.length * 18, 1200);

  typingTimer = setTimeout(() => {
    showTyping(false);
    addMessage('incoming', reply);

    finalMessageTimer = setTimeout(() => {
      showTyping(true);

      setTimeout(() => {
        showTyping(false);
        addMessage('incoming', 'Малышка, я у подъезда!');
      }, 1200);
    }, 6000);

  }, delay);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyTransform() {
  zoomImage.style.transform =
    `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
}

function getDistance(touches) {
  const [a, b] = touches;
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

function getImageBounds() {
  const stageRect = zoomStage.getBoundingClientRect();
  const imgRect = zoomImage.getBoundingClientRect();

  const fittedWidth = imgRect.width / scale;
  const fittedHeight = imgRect.height / scale;

  const scaledWidth = fittedWidth * scale;
  const scaledHeight = fittedHeight * scale;

  const maxX = Math.max(0, (scaledWidth - stageRect.width) / 2);
  const maxY = Math.max(0, (scaledHeight - stageRect.height) / 2);

  return { maxX, maxY };
}

function clampTranslate() {
  const { maxX, maxY } = getImageBounds();
  translateX = clamp(translateX, -maxX, maxX);
  translateY = clamp(translateY, -maxY, maxY);
}

function resetZoom() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  applyTransform();
}

function openAvatarModal() {
  avatarModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  resetZoom();
}

function closeAvatarModal() {
  avatarModal.classList.add('hidden');
  document.body.style.overflow = '';
}

zoomStage.addEventListener('touchstart', (event) => {
  if (event.touches.length === 2) {
    isPinching = true;
    pinchStartDistance = getDistance(event.touches);
    startScale = scale;
  } else if (event.touches.length === 1) {
    isDragging = true;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    startTranslateX = translateX;
    startTranslateY = translateY;
  }
}, { passive: false });

zoomStage.addEventListener('touchmove', (event) => {
  event.preventDefault();

  if (event.touches.length === 2 && isPinching) {
    const distance = getDistance(event.touches);
    scale = clamp(startScale * (distance / pinchStartDistance), 1, 4);
    clampTranslate();
    applyTransform();
  }

  if (event.touches.length === 1 && isDragging) {
    translateX = startTranslateX + (event.touches[0].clientX - startX);
    translateY = startTranslateY + (event.touches[0].clientY - startY);
    clampTranslate();
    applyTransform();
  }
}, { passive: false });

zoomStage.addEventListener('touchend', () => {
  isDragging = false;
  isPinching = false;
});

openAvatar.addEventListener('click', openAvatarModal);
closeAvatar.addEventListener('click', closeAvatarModal);
composerForm.addEventListener('submit', handleSubmit);
messageInput.addEventListener('input', setComposerState);

renderTimestamp();
setComposerState();

// первое сообщение через 1.5 сек
setTimeout(() => {
  addMessage(initialMessages[0].type, initialMessages[0].text);
}, 1500);
