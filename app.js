class QuestionBank {
  constructor() {
    this.questions = [];
  }

  // Carga el banco general (questions.json) para Units y Random
  async loadGeneralQuestions() {
    try {
      const response = await fetch('questions.json');
      const data = await response.json();
      this.questions = data;
      this.assignUnits(this.questions);
      console.log(`Cargadas ${this.questions.length} preguntas generales.`);
    } catch (error) {
      console.error('Error cargando questions.json:', error);
    }
  }

  // Carga un examen oficial específico (Official-Exams/X.json)
  async loadOfficialExam(number) {
    try {
      // Asegúrate de que la carpeta en tu proyecto se llama exactamente "Official-Exams"
      const response = await fetch(`Official-Exams/${number}.json`);
      if (!response.ok) throw new Error('Archivo no encontrado');
      const data = await response.json();
      return data;
    } catch (error) {
      alert(`No se pudo cargar el examen ${number}. Asegúrate de que el archivo Official-Exams/${number}.json exista.`);
      return null;
    }
  }

  assignUnits(questions) {
    // Mapeo de palabras clave a unidades (puedes ajustarlo si cambian los módulos)
    const units_keywords = {
      'Configuration and Setup': 'Configuration and Setup',
      'Object Manager': 'Object Manager and Lightning App Builder',
      'Sales and Marketing': 'Sales and Marketing Applications',
      'Service and Support': 'Service and Support Applications',
      'Productivity': 'Productivity and Collaboration',
      'Data': 'Data and Analytics Management',
      'Workflow': 'Workflow/Process Automation',
      'Automation': 'Workflow/Process Automation'
    };

    questions.forEach(q => {
      let assigned = false;
      for (const key in units_keywords) {
        if (q.module && q.module.includes(key)) {
          q.unit = units_keywords[key];
          assigned = true;
          break;
        }
      }
      if (!assigned) q.unit = q.module || 'Miscellaneous';
    });
  }
}

const app = new QuestionBank();
let currentQuestions = [];
let currentIndex = 0;
let userAnswers = []; // Para guardar respuestas en modos con puntuación

// Inicialización
window.addEventListener('DOMContentLoaded', async () => {
  await app.loadGeneralQuestions();
  showMainMenu();
});

// --- VISTAS DEL MENÚ ---

function showMainMenu() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  const title = document.createElement('h1');
  title.textContent = 'Práctica Salesforce Admin';
  appDiv.appendChild(title);

  // Botón 1: UNITS
  createButton(appDiv, 'UNITS', () => showUnitsMenu());

  // Botón 2: EXAM MODE (Random del general)
  createButton(appDiv, 'MODO EXAMEN (Aleatorio)', () => startGeneralExamMode());

  // Botón 3: EXÁMENES OFICIALES
  createButton(appDiv, 'EXÁMENES OFICIALES', () => showOfficialExamsMenu());
}

function showUnitsMenu() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';
  createBackButton(appDiv, showMainMenu);

  const title = document.createElement('h2');
  title.textContent = 'Estudiar por Unidad';
  appDiv.appendChild(title);

  // Obtener unidades únicas
  const units = [...new Set(app.questions.map(q => q.unit))].sort();

  units.forEach(unit => {
    const count = app.questions.filter(q => q.unit === unit).length;
    createButton(appDiv, `${unit} (${count})`, () => startUnitQuiz(unit));
  });
}

function showOfficialExamsMenu() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';
  createBackButton(appDiv, showMainMenu);

  const title = document.createElement('h2');
  title.textContent = 'Selecciona un Examen Oficial';
  appDiv.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'exam-grid';
  appDiv.appendChild(grid);

  // Generar botones del 1 al 11
  for (let i = 1; i <= 11; i++) {
    const btn = document.createElement('button');
    btn.textContent = `Examen ${i}`;
    btn.onclick = () => selectOfficialModeType(i);
    grid.appendChild(btn);
  }
}

function selectOfficialModeType(examNumber) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';
  createBackButton(appDiv, showOfficialExamsMenu);

  const title = document.createElement('h2');
  title.textContent = `Examen Oficial ${examNumber}`;
  appDiv.appendChild(title);

  const subtitle = document.createElement('h3');
  subtitle.textContent = 'Elige el modo de realización:';
  appDiv.appendChild(subtitle);

  // Opción A: Modo Examen (Sin feedback hasta el final)
  createButton(appDiv, 'Modo Examen (Nota al final)', async () => {
    let questions = await app.loadOfficialExam(examNumber);
    if (questions) {
        // MEZCLAR PREGUNTAS ANTES DE EMPEZAR
        questions = mezclarArray(questions);
        startClassicExam(questions, `Oficial ${examNumber}`);
    }
  });

  // Opción B: Modo Estudio (Bloqueante)
  createButton(appDiv, 'Modo Estudio (Corregir al momento)', async () => {
    let questions = await app.loadOfficialExam(examNumber);
    if (questions) {
        // MEZCLAR PREGUNTAS ANTES DE EMPEZAR
        questions = mezclarArray(questions);
        startBlockingStudyMode(questions, `Oficial ${examNumber}`);
    }
  });
}

// --- LÓGICA DE MODOS DE JUEGO ---

// 1. MODO UNITS (Feedback inmediato, no bloqueante, explicación visible)
function startUnitQuiz(unit) {
  currentQuestions = app.questions.filter(q => q.unit === unit);
  currentIndex = 0;
  renderQuestionWithFeedback(currentQuestions[currentIndex], unit, false);
}

// 2. MODO EXAMEN GENERAL (Aleatorio 60 preguntas, nota al final)
function startGeneralExamMode() {
  // Mezclar y coger 60
  const shuffled = [...app.questions].sort(() => 0.5 - Math.random());
  currentQuestions = shuffled.slice(0, 60);
  currentIndex = 0;
  userAnswers = [];
  renderClassicExamQuestion(currentQuestions[currentIndex], 'Examen Aleatorio');
}

// 3. MODO EXAMEN OFICIAL CLÁSICO (Nota al final)
function startClassicExam(questions, title) {
  currentQuestions = questions;
  currentIndex = 0;
  userAnswers = [];
  renderClassicExamQuestion(currentQuestions[currentIndex], title);
}

// 4. MODO ESTUDIO OFICIAL (Bloqueante, sin explicación, solo Correcto/Incorrecto)
function startBlockingStudyMode(questions, title) {
  currentQuestions = questions;
  currentIndex = 0;
  renderBlockingQuestion(currentQuestions[currentIndex], title);
}

// --- RENDERS DE PREGUNTAS ---

// Renderizador A: Para Units (Muestra explicación)
function renderQuestionWithFeedback(question, titleContext, isBlocking) {
  // Este lo usamos para UNITS (comportamiento original)
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';
  createBackButton(appDiv, showMainMenu);

  const info = document.createElement('p');
  info.textContent = `${titleContext}: Pregunta ${currentIndex + 1} de ${currentQuestions.length}`;
  appDiv.appendChild(info);

  renderQuestionTextAndOptions(appDiv, question);

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Comprobar';
  submitBtn.onclick = () => {
    const selected = getSelectedOptions();
    if (selected.length === 0) return;

    submitBtn.disabled = true;
    disableOptions();

    const isCorrect = validateAnswer(question, selected);
    showFeedbackMessage(appDiv, isCorrect, question.explanation || "Sin explicación adicional."); // Mostrar explicación en Units
    
    createNextButton(appDiv, () => {
        currentIndex++;
        if (currentIndex < currentQuestions.length) {
            renderQuestionWithFeedback(currentQuestions[currentIndex], titleContext, isBlocking);
        } else {
            showEndScreen(titleContext, false);
        }
    });
  };
  appDiv.appendChild(submitBtn);
}

// Renderizador B: Para Exámenes (Clásico - Guarda respuesta y pasa)
function renderClassicExamQuestion(question, titleContext) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';
  
  const topBar = document.createElement('div');
  topBar.style.display = 'flex';
  topBar.style.justifyContent = 'space-between';
  
  const exitBtn = document.createElement('button');
  exitBtn.textContent = 'Salir';
  exitBtn.style.backgroundColor = '#666';
  exitBtn.style.padding = '5px 10px';
  exitBtn.onclick = showMainMenu;
  topBar.appendChild(exitBtn);

  appDiv.appendChild(topBar);

  const info = document.createElement('p');
  info.textContent = `${titleContext}: Pregunta ${currentIndex + 1} de ${currentQuestions.length}`;
  appDiv.appendChild(info);

  renderQuestionTextAndOptions(appDiv, question);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = (currentIndex < currentQuestions.length - 1) ? 'Siguiente' : 'Finalizar Examen';
  nextBtn.onclick = () => {
    const selected = getSelectedOptions();
    // En examen permitimos dejar en blanco? Asumiremos que sí o cuenta como mal.
    userAnswers.push({ question, selected });
    
    currentIndex++;
    if (currentIndex < currentQuestions.length) {
      renderClassicExamQuestion(currentQuestions[currentIndex], titleContext);
    } else {
      showExamResults(titleContext);
    }
  };
  appDiv.appendChild(nextBtn);
}

// Renderizador C: Para Modo Estudio Oficial (Bloqueante)
function renderBlockingQuestion(question, titleContext) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';
  createBackButton(appDiv, () => selectOfficialModeType(parseInt(titleContext.replace('Oficial ', ''))));

  const info = document.createElement('p');
  info.textContent = `${titleContext} (Estudio): Pregunta ${currentIndex + 1} de ${currentQuestions.length}`;
  appDiv.appendChild(info);

  renderQuestionTextAndOptions(appDiv, question);

  const feedbackDiv = document.createElement('div');
  feedbackDiv.id = 'blocking-feedback';
  appDiv.appendChild(feedbackDiv);

  const actionBtn = document.createElement('button');
  actionBtn.textContent = 'Comprobar';
  appDiv.appendChild(actionBtn);

  actionBtn.onclick = () => {
    // Si el botón dice "Siguiente", avanzamos
    if (actionBtn.textContent === 'Siguiente') {
        currentIndex++;
        if (currentIndex < currentQuestions.length) {
            renderBlockingQuestion(currentQuestions[currentIndex], titleContext);
        } else {
            showEndScreen(titleContext, false);
        }
        return;
    }

    // Lógica de Comprobar
    const selected = getSelectedOptions();
    if (selected.length === 0) return;

    const isCorrect = validateAnswer(question, selected);

    if (isCorrect) {
        // Correcto: Bloquear, mostrar verde y cambiar botón
        disableOptions();
        feedbackDiv.className = 'feedback-msg feedback-correct';
        feedbackDiv.textContent = '¡Correcto!';
        actionBtn.textContent = 'Siguiente';
    } else {
        // Incorrecto: Solo mensaje rojo, NO bloquear, permitir reintentar
        feedbackDiv.className = 'feedback-msg feedback-incorrect';
        feedbackDiv.textContent = 'Incorrecto. Inténtalo de nuevo.';
        // No cambiamos el botón, el usuario debe cambiar su selección y darle a Comprobar otra vez
    }
  };
}

// --- FUNCIONES AUXILIARES ---

// FUNCIÓN DE MEZCLA (Fisher-Yates Shuffle)
function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createButton(parent, text, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.onclick = onClick;
  parent.appendChild(btn);
  return btn;
}

function createBackButton(parent, onClick) {
  const btn = document.createElement('button');
  btn.textContent = '← Volver';
  btn.style.marginBottom = '10px';
  btn.style.backgroundColor = '#6c757d';
  btn.onclick = onClick;
  parent.appendChild(btn);
}

function renderQuestionTextAndOptions(parent, question) {
  const qTitle = document.createElement('h2');
  qTitle.textContent = question.question;
  parent.appendChild(qTitle);

  if (question.correctAnswers && question.correctAnswers.length > 1) {
    const hint = document.createElement('p');
    hint.textContent = '(Selecciona todas las correctas)';
    hint.style.color = '#666';
    hint.style.fontSize = '0.9rem';
    parent.appendChild(hint);
  }

  question.options.forEach((opt, idx) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    // Determinar si es radio o checkbox
    input.type = (question.correctAnswers && question.correctAnswers.length > 1) ? 'checkbox' : 'radio';
    input.name = 'option';
    input.value = idx;
    
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + opt));
    parent.appendChild(label);
  });
}

function getSelectedOptions() {
  const inputs = document.querySelectorAll('input[name="option"]:checked');
  return Array.from(inputs).map(i => parseInt(i.value));
}

function disableOptions() {
  const inputs = document.querySelectorAll('input[name="option"]');
  inputs.forEach(i => i.disabled = true);
}

function validateAnswer(question, selected) {
  // Compara arrays de índices
  if (!question.correctAnswers) return false;
  if (selected.length !== question.correctAnswers.length) return false;
  const sortedSelected = selected.sort().toString();
  const sortedCorrect = [...question.correctAnswers].sort().toString();
  return sortedSelected === sortedCorrect;
}

function showFeedbackMessage(parent, isCorrect, explanation) {
  const div = document.createElement('div');
  div.className = isCorrect ? 'feedback-msg feedback-correct' : 'feedback-msg feedback-incorrect';
  div.innerHTML = `<strong>${isCorrect ? '¡Correcto!' : 'Incorrecto'}</strong><br/>${explanation}`;
  parent.appendChild(div);
}

function createNextButton(parent, onClick) {
  const btn = document.createElement('button');
  btn.textContent = 'Siguiente Pregunta';
  btn.style.marginTop = '10px';
  btn.onclick = onClick;
  parent.appendChild(btn);
}

// PANTALLAS FINALES

function showEndScreen(title, showScore) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.textContent = `¡${title} Completado!`;
  appDiv.appendChild(h2);

  createButton(appDiv, 'Volver al Menú Principal', showMainMenu);
}

function showExamResults(title) {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = '';

  let correct = 0;
  userAnswers.forEach(ans => {
    if (validateAnswer(ans.question, ans.selected)) correct++;
  });

  const score = Math.round((correct / userAnswers.length) * 100) || 0;
  const passed = score >= 65; // Criterio Salesforce estándar

  const h2 = document.createElement('h2');
  h2.textContent = 'Resultados del Examen';
  appDiv.appendChild(h2);

  const pScore = document.createElement('p');
  pScore.style.fontSize = '1.5rem';
  pScore.innerHTML = `Puntuación: <strong>${score}%</strong> (${correct}/${userAnswers.length})`;
  pScore.style.color = passed ? 'green' : 'red';
  appDiv.appendChild(pScore);

  const pStatus = document.createElement('p');
  pStatus.textContent = passed ? '¡APROBADO!' : 'SUSPENSO';
  pStatus.style.fontWeight = 'bold';
  appDiv.appendChild(pStatus);

  // Revisión de fallos
  const failed = userAnswers.filter(ans => !validateAnswer(ans.question, ans.selected));
  if (failed.length > 0) {
    const h3 = document.createElement('h3');
    h3.textContent = 'Revisión de Fallos';
    h3.style.marginTop = '30px';
    appDiv.appendChild(h3);

    failed.forEach((item, i) => {
       const block = document.createElement('div');
       block.className = 'incorrect-review-block'; // Clase existente en tu CSS
       block.innerHTML = `
         <p><strong>Pregunta:</strong> ${item.question.question}</p>
         <p style="color:red">Tu respuesta: ${item.selected.map(idx => item.question.options[idx]).join(', ') || 'Ninguna'}</p>
         <p style="color:green">Correcta: ${item.question.correctAnswers.map(idx => item.question.options[idx]).join(', ')}</p>
         <p><em>${item.question.explanation || ''}</em></p>
       `;
       appDiv.appendChild(block);
    });
  }

  createButton(appDiv, 'Volver al Menú Principal', showMainMenu);
}