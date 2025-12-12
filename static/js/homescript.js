document.addEventListener('DOMContentLoaded', () => {
    // NAV HAMBURGER
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            if (mobileNav) {
                const isOpen = mobileNav.style.display === 'flex';
                mobileNav.style.display = isOpen ? 'none' : 'flex';
            }
        });
    }

    const chatWindow = document.getElementById('chat-window');
    const textInput = document.getElementById('text-input');
    const sendBtn = document.getElementById('send-btn');
    const newSessionBtn = document.querySelector('.nav-cta');
    const loggedIn = typeof window.LOGGED_IN !== 'undefined' ? window.LOGGED_IN === true : false;

    let currentSessionId = null;

    async function createSession() {
        try {
            const res = await fetch('/session', { method: 'POST' });
            const data = await res.json();
            currentSessionId = data.session_id;
            if (chatWindow) chatWindow.innerHTML = '';
            appendSystemNotice(`Started new session: ${currentSessionId}`);
        } catch (e) {
            console.error('Failed to create session', e);
            currentSessionId = null;
            appendSystemNotice('Failed to start session, continuing without session tracking.');
        }
    }

    function appendSystemNotice(text) {
        if (!chatWindow) return;
        const notice = document.createElement('div');
        notice.className = 'message assistant';
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;
        notice.appendChild(avatar);
        notice.appendChild(content);
        chatWindow.appendChild(notice);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    if (chatWindow) {
        if (loggedIn) {
            createSession();
        } else {
            appendSystemNotice('Login to create a session and save your history.');
        }
    }

    if (newSessionBtn) {
        newSessionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!loggedIn) {
                window.location.href = '/login';
                return;
            }
            if (!chatWindow) {
                window.location.href = '/';
                return;
            }
            createSession();
        });
    }

    // Offensive filtering
    const offensiveWords = [
        "tang ina mo", "fuck you", "putanginamo", "tangina mo", "shet", "motherfucker",
        "tanginamo", "putang ina mo", "putangina mo", "putang ina", "putangina", "tangina",
        "shit", "fuck", "damn", "asshole", "bastard", "dickhead", "piss off", "nigga", "nigger"
    ];

    // TTS state
    let availableVoices = [];
    let selectedVoiceName = null;

    function appendMessage(role, text, withTTS = false) {
        const wrapper = document.createElement('div');
        wrapper.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = role === 'user' ? 'You' : 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;

        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        if (withTTS) {
            const toolbar = document.createElement('div');
            toolbar.className = 'tts-toolbar';

            const playBtn = document.createElement('button');
            playBtn.textContent = '▶ Play';

            const stopBtn = document.createElement('button');
            stopBtn.textContent = '■ Stop';

            const voiceSelect = document.createElement('select');

            toolbar.appendChild(playBtn);
            toolbar.appendChild(stopBtn);
            toolbar.appendChild(voiceSelect);
            content.appendChild(toolbar);

            setupVoiceSelect(voiceSelect);
            hookTTSButtons(playBtn, stopBtn, () => text, voiceSelect);
        }

        chatWindow.appendChild(wrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function handleSend() {
        const raw = textInput.value;
        const value = raw.trim();
        if (!value) return;

        const lower = value.toLowerCase();
        if (offensiveWords.some(w => lower.includes(w))) {
            appendMessage('assistant', 'Offensive language detected. Please enter appropriate text.');
            textInput.value = '';
            return;
        }

        appendMessage('user', value);
        textInput.value = '';

        const thinkingText = 'Summarizing your text...';
        appendMessage('assistant', thinkingText);
        const placeholderNode = chatWindow.lastChild.querySelector('.message-content');

        try {
            const response = await fetch('/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: value, session_id: currentSessionId })
            });
            const data = await response.json();

            const summary = data.summary || data.error || 'No response received.';
            placeholderNode.textContent = summary;

            const toolbar = document.createElement('div');
            toolbar.className = 'tts-toolbar';

            const playBtn = document.createElement('button');
            playBtn.textContent = '▶ Play';

            const stopBtn = document.createElement('button');
            stopBtn.textContent = '■ Stop';

            const quizBtn = document.createElement('button');
            quizBtn.textContent = '📝 Quiz';
            quizBtn.title = 'Generate quiz from this answer';

            const voiceSelect = document.createElement('select');

            toolbar.appendChild(playBtn);
            toolbar.appendChild(stopBtn);
            toolbar.appendChild(quizBtn);
            toolbar.appendChild(voiceSelect);
            placeholderNode.appendChild(toolbar);

            setupVoiceSelect(voiceSelect);
            hookTTSButtons(playBtn, stopBtn, () => summary, voiceSelect);

            quizBtn.addEventListener('click', () => {
                if (!currentSessionId) {
                    alert('Session ID missing; start a new session first.');
                    return;
                }
                window.location.href = '/quiz?session_id=' + encodeURIComponent(currentSessionId);
            });
        } catch (err) {
            placeholderNode.textContent = 'Error summarizing text.';
            console.error(err);
        } finally {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    }

    if (sendBtn) sendBtn.addEventListener('click', handleSend);

    if (textInput) {
        textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }


    function loadVoices() {
        availableVoices = speechSynthesis.getVoices();
        if (!selectedVoiceName && availableVoices.length) {
            const preferred = availableVoices.find(v => v.lang.toLowerCase().startsWith('en')) || availableVoices[0];
            selectedVoiceName = preferred.name;
        }
    }

    function setupVoiceSelect(selectEl) {
        selectEl.innerHTML = '';
        if (!availableVoices.length) loadVoices();

        availableVoices.forEach(voice => {
            const opt = document.createElement('option');
            opt.value = voice.name;
            opt.textContent = `${voice.name} (${voice.lang})${voice.name === selectedVoiceName ? ' [default]' : ''}`;
            if (voice.name === selectedVoiceName) {
                opt.selected = true;
            }
            selectEl.appendChild(opt);
        });

        selectEl.addEventListener('change', () => {
            selectedVoiceName = selectEl.value;
        });
    }

    function hookTTSButtons(playBtn, stopBtn, getText, selectEl) {
        playBtn.addEventListener('click', () => {
            const text = getText();
            if (!text.trim()) return;
            const utterance = new SpeechSynthesisUtterance(text);

            const chosenName = selectEl.value || selectedVoiceName;
            const chosenVoice = availableVoices.find(v => v.name === chosenName);
            if (chosenVoice) {
                utterance.voice = chosenVoice;
                utterance.lang = chosenVoice.lang;
            }

            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
        });

        stopBtn.addEventListener('click', () => {
            speechSynthesis.cancel();
        });
    }

    if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.onvoiceschanged = () => {
            loadVoices();
        };
        loadVoices();
    }
});












