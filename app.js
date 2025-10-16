class QuestionBank {
  constructor() {
    this.questions = [];
  }
  async loadQuestions() {
    try {
      const response = await fetch('questions.json');
      const data = await response.json();
      this.questions = data;
      assignUnitToQuestions(this.questions);
      console.log(`Loaded ${this.questions.length} questions.`);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  }
}

const units_keywords = {
  'Security & Access': ['Security', 'Salesforce Security'],
  'Data Management': ['Data Management', 'Salesforce Data Management', 'Salesforce Basics', 'Salesforce Data Model'],
  'Salesforce Automation': ['Automation', 'Salesforce Automation', 'Flows'],
  'Reporting & Dashboards': ['Reporting', 'Salesforce Reporting', 'Reports & Dashboards', 'Dashboards'],
  'User Setup & Licensing': ['Users', 'User Setup', 'Licensing', 'Salesforce User Interface', 'Salesforce Mobile'],
  'Salesforce Platform & Lightning': ['Salesforce Platform', 'Lightning'],
  'Business Processes & Scenarios': [
    'Business Scenario', 'Business Processes', 'Validations', 'Record Types', 'AppExchange', 'Audit', 'Cases', 'Mobile'
  ]
};

function assignUnitToQuestions(questions) {
  questions.forEach(q => {
    let assigned = false;
    for (const [unit, keywords] of Object.entries(units_keywords)) {
      if (keywords.includes(q.module)) {
        q.unit = unit;
        assigned = true;
        break;
      }
    }
    if (!assigned) q.unit = 'Miscellaneous';
  });
}

const questionBank = new QuestionBank();
let currentIndex = 0;
let currentQuestions = [];
let currentUnit = null;
let examMode = false;
let examUserAnswers = [];
let endedEarly = false;

window.addEventListener('DOMContentLoaded', async () => {
  await questionBank.loadQuestions();
  showMainMenu();
});

function showMainMenu() {
  examMode = false;
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';
  const title = document.createElement('h1');
  title.textContent = 'Salesforce Admin Practice';
  appDiv.appendChild(title);

  const btnUnits = document.createElement('button');
  btnUnits.textContent = 'Study by Units';
  btnUnits.onclick = () => showUnitsMenu();
  appDiv.appendChild(btnUnits);

  const btnExam = document.createElement('button');
  btnExam.textContent = 'Exam Mode';
  btnExam.onclick = () => startExamMode();
  appDiv.appendChild(btnExam);
}

function showUnitsMenu() {
  examMode = false;
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back to Main Menu';
  backBtn.onclick = () => showMainMenu();
  appDiv.appendChild(backBtn);

  const header = document.createElement('h2');
  header.textContent = 'Choose a Unit';
  appDiv.appendChild(header);

  const units = [...new Set(questionBank.questions.map(q => q.unit))];
  units.forEach(unit => {
    const btn = document.createElement('button');
    btn.textContent = `${unit} (${questionBank.questions.filter(q => q.unit === unit).length} questions)`;
    btn.onclick = () => startUnitQuiz(unit);
    appDiv.appendChild(btn);
  });
}

function startUnitQuiz(unit) {
  examMode = false;
  currentUnit = unit;
  currentQuestions = questionBank.questions.filter(q => q.unit === unit);
  currentIndex = 0;
  showQuestion(currentQuestions[currentIndex]);
}

function startExamMode() {
  examMode = true;
  endedEarly = false;
  currentUnit = 'Exam Mode';
  currentQuestions = getRandomQuestions(questionBank.questions, 60);
  currentIndex = 0;
  examUserAnswers = [];
  showExamQuestion(currentQuestions[currentIndex]);
}

function getRandomQuestions(allQuestions, n) {
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function showQuestion(question) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back to Units';
  backBtn.onclick = () => showUnitsMenu();
  appDiv.appendChild(backBtn);

  const info = document.createElement('p');
  info.textContent = `Unit: ${currentUnit} (Question ${currentIndex + 1} of ${currentQuestions.length})`;
  appDiv.appendChild(info);

  const questionEl = document.createElement('h2');
  questionEl.textContent = question.question;
  appDiv.appendChild(questionEl);

  if (question.correctAnswers.length > 1) {
    const multiAns = document.createElement('div');
    multiAns.classList.add('multi-answer-msg');
    multiAns.textContent = 'Select ALL that apply.';
    appDiv.appendChild(multiAns);
  }

  // Respuestas
  question.options.forEach((opt, idx) => {
    const label = document.createElement('label');
    const inputType = question.correctAnswers.length > 1 ? 'checkbox' : 'radio';
    const input = document.createElement('input');
    input.type = inputType;
    input.name = 'option';
    input.value = idx;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + opt));
    appDiv.appendChild(label);
  });

  const btn = document.createElement('button');
  btn.textContent = 'Submit';
  btn.onclick = function () {
    // BLOQUEAR el botón
    btn.disabled = true;
    // BLOQUEAR las opciones
    const inputs = document.querySelectorAll('input[name="option"]');
    inputs.forEach(i => i.disabled = true);
    validateAnswer(question);
  };
  appDiv.appendChild(btn);
}

function validateAnswer(question) {
  const inputs = document.querySelectorAll('input[name="option"]');
  const selected = Array.from(inputs).filter(i => i.checked).map(i => parseInt(i.value));
  const correct =
    selected.length === question.correctAnswers.length &&
    selected.every(v => question.correctAnswers.includes(v));
  const appDiv = document.getElementById('app');

  const result = document.createElement('p');
  result.textContent = correct ? 'Correct!' : 'Incorrect!';
  result.style.fontWeight = 'bold';
  result.style.color = correct ? 'green' : 'red';
  appDiv.appendChild(result);

  const explanation = document.createElement('p');
  explanation.textContent = 'Explanation: ' + question.explanation;
  appDiv.appendChild(explanation);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = currentIndex < currentQuestions.length - 1 ? 'Next Question' : 'Finish';
  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < currentQuestions.length) showQuestion(currentQuestions[currentIndex]);
    else showEndScreen();
  };
  appDiv.appendChild(nextBtn);
}

function showExamQuestion(question) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.textContent = 'Exit Exam';
  backBtn.onclick = () => showMainMenu();
  appDiv.appendChild(backBtn);

  const info = document.createElement('p');
  info.textContent = `(Exam Mode) Question ${currentIndex + 1} of ${currentQuestions.length}`;
  appDiv.appendChild(info);

  const questionEl = document.createElement('h2');
  questionEl.textContent = question.question;
  appDiv.appendChild(questionEl);

  if (question.correctAnswers.length > 1) {
    const multiAns = document.createElement('div');
    multiAns.classList.add('multi-answer-msg');
    multiAns.textContent = 'Select ALL that apply.';
    appDiv.appendChild(multiAns);
  }

  question.options.forEach((opt, idx) => {
    const label = document.createElement('label');
    const inputType = question.correctAnswers.length > 1 ? 'checkbox' : 'radio';
    const input = document.createElement('input');
    input.type = inputType;
    input.name = 'option';
    input.value = idx;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + opt));
    appDiv.appendChild(label);
  });

  // WRAPPER para los botones de exam
  const btnsWrapper = document.createElement('div');
  btnsWrapper.className = 'exam-btns-wrapper';

  const nextBtn = document.createElement('button');
  nextBtn.textContent = currentIndex < currentQuestions.length - 1 ? 'Next' : 'Finish Exam';
  nextBtn.onclick = () => {
    captureExamAnswer(question);
    currentIndex++;
    if (currentIndex < currentQuestions.length) showExamQuestion(currentQuestions[currentIndex]);
    else showExamResult();
  };
  btnsWrapper.appendChild(nextBtn);

  const earlyFinishBtn = document.createElement('button');
  earlyFinishBtn.textContent = 'Finish Exam Early';
  earlyFinishBtn.classList.add('finish-early-btn');
  earlyFinishBtn.onclick = () => {
    captureExamAnswer(question);
    endedEarly = true;
    showExamResult();
  };
  btnsWrapper.appendChild(earlyFinishBtn);

  appDiv.appendChild(btnsWrapper);

  // --- BLOQUEAR Submit múltiples en modo examen ---
  // Solo permitir contestar una vez
  const inputs = document.querySelectorAll('input[name="option"]');
  inputs.forEach((i) => {
    i.addEventListener('change', () => {
      // Si ya se ha respondido guardamos respuesta y bloqueamos
      if (![...inputs].some(x => x.checked)) return;
      // Deshabilitar tras seleccionar
      setTimeout(() => {
        inputs.forEach(x => x.disabled = true);
      }, 100);
    });
  });
}

function captureExamAnswer(question) {
  const selected = Array.from(document.querySelectorAll('input[name="option"]:checked')).map(i =>
    parseInt(i.value)
  );
  examUserAnswers.push({ question, selected });
}

function showExamResult() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  let correctCount = 0;
  const failList = [];
  examUserAnswers.forEach(ans => {
    const ok =
      ans.selected.length === ans.question.correctAnswers.length &&
      ans.selected.every(v => ans.question.correctAnswers.includes(v));
    if (ok) correctCount++;
    else failList.push(ans);
  });

  const total = examUserAnswers.length;
  const minToPass = Math.ceil(total * 0.65);
  const passed = correctCount >= minToPass;

  const header = document.createElement('h2');
  header.textContent = endedEarly ? 'Exam Ended Early' : 'Exam Finished!';
  appDiv.appendChild(header);

  const stats = document.createElement('p');
  stats.textContent = `Answered: ${total} / ${currentQuestions.length} | Correct: ${correctCount} | Needed to Pass: ${minToPass}`;
  appDiv.appendChild(stats);

  const status = document.createElement('p');
  status.textContent = passed ? 'PASS' : 'FAIL';
  status.style.fontWeight = 'bold';
  status.style.color = passed ? 'green' : 'red';
  appDiv.appendChild(status);

  if (failList.length > 0) {
    const title = document.createElement('h3');
    title.textContent = 'Incorrect Answers Review';
    appDiv.appendChild(title);

    failList.forEach(item => {
      const qDiv = document.createElement('div');
      qDiv.className = 'incorrect-review-block';
      qDiv.innerHTML = `
        <span class="rev-label question">QUESTION:</span>
        <div>${item.question.question}</div>
        <span class="rev-label your">Your Answer:</span>
        <div>${item.selected.map(i => item.question.options[i]).join(', ') || '<em>None</em>'}</div>
        <span class="rev-label correct">Correct Answers:</span>
        <div>${item.question.correctAnswers.map(i => item.question.options[i]).join(', ')}</div>
        <span class="rev-label explanation">Explanation:</span>
        <div>${item.question.explanation}</div>
      `;
      appDiv.appendChild(qDiv);
    });
  }

  const btn = document.createElement('button');
  btn.textContent = 'Back to Main Menu';
  btn.onclick = () => showMainMenu();
  appDiv.appendChild(btn);
}

function showEndScreen() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  const msg = document.createElement('h2');
  msg.textContent = examMode ? 'Exam Finished!' : `Unit "${currentUnit}" Completed!`;
  appDiv.appendChild(msg);

  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back to Main Menu';
  backBtn.onclick = () => showMainMenu();
  appDiv.appendChild(backBtn);
}
