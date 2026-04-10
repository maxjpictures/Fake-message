const chat=document.getElementById('chatArea');
const form=document.getElementById('composerForm');
const input=document.getElementById('messageInput');

form.addEventListener('submit',e=>{
e.preventDefault();
if(!input.value) return;

const msg=document.createElement('div');
msg.className='message outgoing';
msg.textContent=input.value;
chat.appendChild(msg);

setTimeout(()=>{
const reply=document.createElement('div');
reply.className='message incoming';
reply.textContent='Ответ';
chat.appendChild(reply);
},800);

input.value='';
});
