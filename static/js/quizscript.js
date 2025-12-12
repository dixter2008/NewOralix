document.addEventListener('DOMContentLoaded', () => {
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

  const quizContainer = document.getElementById('quiz-container');
  const quizStatus = document.getElementById('quiz-status');
  const submitBtn = document.getElementById('submit-quiz');
  const retryBtn = document.getElementById('retry-quiz');


  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  let storedQuiz = null;
  let storedQuizId = null;

  async function fetchQuiz(regen=false){
    if(!sessionId){
      quizStatus.textContent = 'Missing session id. Return to chat and generate quiz again.';
      return;
    }
    quizStatus.textContent = regen ? 'Regenerating quiz...' : 'Loading quiz...';
    try{
      const res = await fetch('/generate_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const data = await res.json();
      if(data.error){
        quizStatus.textContent = 'Error: ' + data.error + (data.raw ? ' Raw: ' + data.raw : '');
        return;
      }
      storedQuiz = data.quiz;
      storedQuizId = data.quiz_id || null;
      renderQuiz(storedQuiz);
    }catch(e){
      quizStatus.textContent = 'Failed to load quiz.';
      console.error(e);
    }
  }

  function renderQuiz(quiz){
    if(!quiz || !Array.isArray(quiz.questions)){
      quizStatus.textContent = 'Invalid quiz format.';
      return;
    }
    quizContainer.innerHTML = '';
    const summaryBlock = document.createElement('div');
    summaryBlock.className = 'message assistant';
    const sumAvatar = document.createElement('div');
    sumAvatar.className = 'message-avatar';
    sumAvatar.textContent = 'AI';
    const sumContent = document.createElement('div');
    sumContent.className = 'message-content';
    sumContent.textContent = `Quiz loaded: ${quiz.questions.length} advanced university-level questions.`;
    summaryBlock.appendChild(sumAvatar); summaryBlock.appendChild(sumContent);
    quizContainer.appendChild(summaryBlock);
    quiz.questions.forEach((q, idx) => {
      const block = document.createElement('div');
      block.className = 'message assistant';
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = 'Q' + (idx+1);
      const content = document.createElement('div');
      content.className = 'message-content';
      const title = document.createElement('p');
      title.textContent = q.question;
      content.appendChild(title);
      const list = document.createElement('ul');
      list.style.listStyle = 'none';
      list.style.padding = '0';
      q.choices.forEach((choice, cIdx) => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        const label = document.createElement('label');
        label.style.cursor = 'pointer';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'quiz_q_' + idx;
        radio.value = cIdx;
        label.appendChild(radio);
        const span = document.createElement('span');
        span.textContent = ' ' + choice;
        label.appendChild(span);
        li.appendChild(label);
        list.appendChild(li);
      });
      content.appendChild(list);
      block.appendChild(avatar);
      block.appendChild(content);
      quizContainer.appendChild(block);
    });
    const infoBlock = document.createElement('div');
    infoBlock.className = 'message assistant';
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'AI';
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = 'Select answers and submit to see results.';
    infoBlock.appendChild(avatar);
    infoBlock.appendChild(content);
    quizContainer.appendChild(infoBlock);
    submitBtn.style.display = 'inline-block';
    retryBtn.style.display = 'inline-block';
    document.getElementById('quiz-actions').style.display = 'flex';
  }

  submitBtn.addEventListener('click', () => {
    if(!storedQuiz){
      alert('Quiz not loaded yet.');
      return;
    }
    const questions = quizContainer.querySelectorAll("[name^='quiz_q_']");
    const groups = {};
    questions.forEach(r => { groups[r.name] = groups[r.name] || []; groups[r.name].push(r); });
    let answered = 0;
    Object.values(groups).forEach(arr => { if(arr.some(r => r.checked)) answered++; });
    if(answered < Object.keys(groups).length){
      alert('Please answer all questions before submitting.');
      return;
    }
    let score = 0;
    const chosenAnswers = [];
    storedQuiz.questions.forEach((q, idx) => {
      const selected = quizContainer.querySelector(`input[name='quiz_q_${idx}']:checked`);
      const blocks = quizContainer.querySelectorAll('.message.assistant');
      // +1 offset because summaryBlock is first
      const block = blocks[idx + 1];
      const explanation = document.createElement('div');
      explanation.style.marginTop = '8px';
      explanation.style.fontSize = '0.75rem';
      explanation.style.opacity = '0.85';
      const selectedIdx = parseInt(selected.value,10);
      const correctIdx = q.answer_index;
      const selectedText = q.choices[selectedIdx];
      const correctText = q.choices[correctIdx];

      if(selectedIdx === correctIdx){
        score++;
        explanation.textContent = 'Correct! ' + (q.explanation || '');
        explanation.style.color = '#4caf50';
      } else {
        explanation.textContent = 'Incorrect.' + (q.explanation ? ' ' + q.explanation : '');
        explanation.style.color = '#f44336';
      }
      const contentEl = block.querySelector('.message-content');
      contentEl.appendChild(explanation);

      // Show user's answer and the correct answer explicitly
      const answersWrap = document.createElement('div');
      answersWrap.style.marginTop = '6px';
      const yourAns = document.createElement('div');
      yourAns.style.fontSize = '0.8rem';
      yourAns.style.opacity = '0.9';
      yourAns.innerHTML = `<strong>Your answer:</strong> ${selectedText}`;
      const corrAns = document.createElement('div');
      corrAns.style.fontSize = '0.8rem';
      corrAns.style.opacity = '0.9';
      corrAns.innerHTML = `<strong>Correct answer:</strong> ${correctText}`;
      answersWrap.appendChild(yourAns);
      answersWrap.appendChild(corrAns);
      contentEl.appendChild(answersWrap);
      chosenAnswers.push(parseInt(selected.value,10));
    });
    const result = document.createElement('div');
    result.className = 'message assistant';
    const av = document.createElement('div');
    av.className = 'message-avatar';
    av.textContent = 'AI';
    const ct = document.createElement('div');
    ct.className = 'message-content';
    ct.textContent = `Score: ${score} / ${storedQuiz.questions.length}`;
    result.appendChild(av); result.appendChild(ct);
    quizContainer.appendChild(result);
    submitBtn.disabled = true;

    if(storedQuizId){
      fetch('/quiz_attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: storedQuizId, score, total: storedQuiz.questions.length, answers: chosenAnswers })
      }).catch(err => console.warn('Quiz attempt store failed', err));
    }
  });

  retryBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitBtn.disabled = false;
    storedQuiz = null;
    fetchQuiz(true);
  });

  fetchQuiz(false);
});
