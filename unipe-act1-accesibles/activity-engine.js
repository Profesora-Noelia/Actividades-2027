let currentQuestionIdx = 0;
let activityFinished = false;
let selectedOptionIdx = null;
let currentScore = 0;
let answeredQuestions = {};

document.addEventListener('DOMContentLoaded', () => {
    // Diálogo de orientación
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        document.getElementById('btn-open-help').addEventListener('click', () => helpModal.showModal());
        document.getElementById('btn-close-help').addEventListener('click', () => helpModal.close());
        document.getElementById('btn-close-help-cross').addEventListener('click', () => helpModal.close());

        // PESTAÑAS DEL MODAL: WAI-ARIA TABS PATTERN + ROVING TABINDEX
        const helpTabNav = document.querySelector('.help-tabs-nav');
        const helpTabBtns = Array.from(document.querySelectorAll('.help-tab-btn'));
        const helpTabPanels = Array.from(document.querySelectorAll('.help-tab-panel'));

        function activateHelpTab(index, shouldFocus = true) {
            helpTabBtns.forEach((btn, idx) => {
                const isTarget = (idx === index);
                btn.classList.toggle('active', isTarget);
                btn.setAttribute('aria-selected', String(isTarget));
                btn.setAttribute('tabindex', isTarget ? '0' : '-1');
                if (helpTabPanels[idx]) {
                    helpTabPanels[idx].classList.toggle('active', isTarget);
                }
                if (isTarget && shouldFocus) {
                    btn.focus();
                }
            });
        }

        helpTabBtns.forEach((btn, idx) => {
            btn.addEventListener('click', () => activateHelpTab(idx, false));
        });

        if (helpTabNav) {
            helpTabNav.addEventListener('keydown', (e) => {
                let activeIdx = helpTabBtns.findIndex(b => b.getAttribute('aria-selected') === 'true');
                if (activeIdx === -1) activeIdx = 0;

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIdx = (activeIdx + 1) % helpTabBtns.length;
                    activateHelpTab(nextIdx, true);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIdx = (activeIdx - 1 + helpTabBtns.length) % helpTabBtns.length;
                    activateHelpTab(prevIdx, true);
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    activateHelpTab(0, true);
                } else if (e.key === 'End') {
                    e.preventDefault();
                    activateHelpTab(helpTabBtns.length - 1, true);
                }
            });
        }
    }

    // Diálogo de reinicio
    const resetModal = document.getElementById('reset-confirm-modal');
    document.getElementById('btn-reset').addEventListener('click', () => resetModal.showModal());
    document.getElementById('btn-confirm-reset-no').addEventListener('click', () => resetModal.close());
    document.getElementById('btn-confirm-reset-yes').addEventListener('click', () => {
        resetModal.close();
        executeResetActivity();
    });

    // Diálogo de salida
    const exitModal = document.getElementById('exit-confirm-modal');
    document.getElementById('btn-open-exit').addEventListener('click', () => exitModal.showModal());
    document.getElementById('btn-confirm-exit-no').addEventListener('click', () => exitModal.close());
    document.getElementById('btn-confirm-exit-yes').addEventListener('click', () => {
        exitModal.close();
        executeExitActivity();
    });

    // Paginación
    document.getElementById('nav-prev').addEventListener('click', () => navigateQuestion(currentQuestionIdx - 1));
    document.getElementById('nav-next').addEventListener('click', () => navigateQuestion(currentQuestionIdx + 1));

    renderCurrentQuestion();
    renderPaginationBar();
});

function buildAccessibleSpeechText() {
    const data = window.activityConfig;
    const item = data.questions[currentQuestionIdx];
    const letters = ['A', 'B', 'C', 'D'];
    const total = data.questions.length;

    let speech = `Pregunta ${currentQuestionIdx + 1} de${total}. `;
    if (item.fase) speech += `${item.fase}. `;
    speech += `Consigna: ${item.q}. `;
    speech += `Opciones disponibles: `;

    item.options.forEach((opt, idx) => {
        speech += `Opción ${letters[idx]}:${opt}. `;
    });

    const openPills = document.querySelectorAll('.support-pill[open]');
    if (openPills.length > 0) {
        speech += `Información desplegada: `;
        openPills.forEach(pill => {
            const title = pill.querySelector('summary').innerText.trim();
            const content = pill.querySelector('.support-content').innerText.trim();
            speech += `${title}:${content}. `;
        });
    }

    speech += `Podés marcar tu respuesta con teclado, ratón o dictando la opción con el botón micrófono.`;
    return speech;
}

function renderCurrentQuestion() {
    if (typeof stopSpeaking === 'function') stopSpeaking();

    const data = window.activityConfig;
    const panel = document.getElementById('activity-mount-point');
    const total = data.questions.length;
    selectedOptionIdx = null;

    if (activityFinished) {
        panel.innerHTML = `
            <div class="completed-state-card">
                <h3><span class="material-symbols-rounded icon" aria-hidden="true" style="color: var(--exito-medio);">check_circle</span> ¡Actividad completada!</h3>
                <p>Completaste la resolución de las ${total} consignas de práctica y transferencia, consolidando el manejo conceptual de las unidades de almacenamiento.</p>
                <button class="btn btn-secondary" onclick="executeResetActivity()">
                    <span class="material-symbols-rounded icon" aria-hidden="true">refresh</span> Volver a realizar la actividad
                </button>
            </div>
        `;
        updateProgressBar(total, total);
        return;
    }

    const item = data.questions[currentQuestionIdx];
    const letters = ['A', 'B', 'C', 'D'];

    panel.innerHTML = `
        <div class="activity-header">
            <h2 class="activity-title">
                <span class="material-symbols-rounded icon" aria-hidden="true">${data.icon}</span>${data.title}
            </h2>
            <span class="stage-badge">Pregunta ${currentQuestionIdx + 1} de${total}</span>
        </div>

        <div class="supports-grid" role="region" aria-label="Apoyos didácticos desplegables">
            <details class="support-pill">
                <summary><span class="material-symbols-rounded icon" aria-hidden="true" style="font-size: 20px;">touch_app</span> Instrucciones de interacción</summary>
                <div class="support-content"><p>${item.instrucciones}</p></div>
            </details>
            <details class="support-pill">
                <summary><span class="material-symbols-rounded icon" aria-hidden="true" style="font-size: 20px;">lightbulb</span> Ver pista cognitiva</summary>
                <div class="support-content"><p>${item.pista}</p></div>
            </details>
            <details class="support-pill">
                <summary><span class="material-symbols-rounded icon" aria-hidden="true" style="font-size: 20px;">menu_book</span> Ver ejemplo modelador</summary>
                <div class="support-content"><p>${item.ejemplo}</p></div>
            </details>
        </div>

        <div class="content-work-grid">
            <!-- SECTOR IZQUIERDO: ESTÍMULO Y CONSIGNAS -->
            <div class="stimulus-card">
                <div class="stimulus-meta-top">
                    <span class="phase-pill-badge">${item.fase}</span>
                </div>
                
                <h3 class="stimulus-context-title">${data.contextTitle}</h3>
                
                <div class="consigna-box">
                    <span class="consigna-tag">
                        <span class="material-symbols-rounded" aria-hidden="true" style="font-size: 18px;">quiz</span> Consigna
                    </span>
                    <p class="consigna-text" id="consigna-text">${item.q}</p>
                </div>
            </div>

            <!-- SECTOR DERECHO: ÁREA DE INTERACCIÓN Y VALIDACIÓN -->
            <div class="interaction-card">
                <div class="interaction-header-bar">
                    <span class="interaction-heading">Opciones de respuesta</span>
                    <button class="btn-voice-command" id="voice-cmd-btn" onclick="startVoiceSelection()" title="Decir 'Opción A', 'B', 'C' o 'Comprobar'">
                        <span class="material-symbols-rounded icon" aria-hidden="true" style="font-size: 18px;">mic</span> Dictar por voz
                    </button>
                </div>

                <div id="selection-status" class="selection-status-badge" aria-live="polite">
                    Ninguna opción seleccionada
                </div>

                <div class="options-list" id="options-container" role="radiogroup" aria-labelledby="consigna-text">
                    ${item.options.map((opt, idx) => `
                        <button class="option-button" id="opt-btn-${idx}" 
                                role="radio" 
                                aria-checked="false"
                                aria-label="Opción ${letters[idx]}: ${opt}"
                                onclick="selectOption(${idx})">
                            <span class="option-letter-badge" aria-hidden="true">${letters[idx]}</span>
                            <span>${opt}</span>
                        </button>
                    `).join('')}
                </div>

                <button class="btn btn-primary" id="btn-submit-answer" onclick="submitCurrentAnswer()" style="width: 100%; opacity: 0.5; pointer-events: none;">
                    <span class="material-symbols-rounded icon" aria-hidden="true">check_circle</span> Comprobar respuesta
                </button>
            </div>
        </div>
    `;

    updateProgressBar(currentQuestionIdx, total);
    renderPaginationBar();
    if (window.applyGrammarHighlights) applyGrammarHighlights();

    if (document.getElementById('a11y-line-focus-toggle') && document.getElementById('a11y-line-focus-toggle').checked) {
        if (typeof window.updateLineFocusPosition === 'function') window.updateLineFocusPosition();
    }
}

function selectOption(idx) {
    selectedOptionIdx = idx;
    const letters = ['A', 'B', 'C', 'D'];
    const item = window.activityConfig.questions[currentQuestionIdx];

    document.querySelectorAll('.option-button').forEach((b, i) => {
        const isSelected = (i === idx);
        b.classList.toggle('selected', isSelected);
        b.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });

    const statusBadge = document.getElementById('selection-status');
    statusBadge.className = 'selection-status-badge selected';
    statusBadge.innerHTML = `Opción marcada: <strong>${letters[idx]}</strong> (${item.options[idx]})`;

    const submitBtn = document.getElementById('btn-submit-answer');
    submitBtn.style.opacity = '1';
    submitBtn.style.pointerEvents = 'auto';
    submitBtn.focus();
}

function startVoiceSelection() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('voice-cmd-btn');
    const statusBadge = document.getElementById('selection-status');

    if (!SpeechRec) { 
        alert("El reconocimiento por voz requiere Google Chrome o Microsoft Edge."); 
        return; 
    }

    if (window.location.protocol === 'file:') {
        statusBadge.className = 'selection-status-badge';
        statusBadge.innerHTML = `<span style="color:#DC2626; font-weight:700;">Atención:</span> La API de voz requiere ejecutarse desde servidor local (ej. Live Server) o HTTPS, no doble clic de archivo local.`;
        return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
        btn.classList.add('listening');
        btn.innerHTML = `<span class="material-symbols-rounded icon" aria-hidden="true" style="font-size: 18px;">mic</span> Escuchando...`;
        statusBadge.innerHTML = `<em>Decí "A", "B", "C" o "Comprobar"...</em>`;
    };

    recognition.onresult = (e) => {
        let detectedCommand = null;
        let detectedIdx = -1;
        let spokenWord = '';

        const currentQuestion = window.activityConfig.questions[currentQuestionIdx];

        for (let i = 0; i < e.results[0].length; i++) {
            const raw = e.results[0][i].transcript.toLowerCase();
            const clean = raw.replace(/[.,/#!$%^&*;:{}=\-_`~()¿?¡!]/g, "").trim();
            spokenWord = clean;

            if (/(^|\b)(comprobar|verificar|validar|enviar|revisar|confirmar|listo)(\b|$)/i.test(clean)) {
                detectedCommand = 'submit';
                break;
            }

            if (/(^|\b)(a|ah|ha|opcion a|opción a|letra a|la a|primera|1|uno)(\b|$)/i.test(clean) ||
                clean.includes(currentQuestion.options[0].toLowerCase())) {
                detectedIdx = 0; 
                break;
            }
            if (/(^|\b)(b|be|ve|bê|opcion b|opción b|letra b|la b|segunda|2|dos)(\b|$)/i.test(clean) ||
                clean.includes(currentQuestion.options[1].toLowerCase())) {
                detectedIdx = 1; 
                break;
            }
            if (/(^|\b)(c|ce|se|sé|opcion c|opción c|letra c|la c|tercera|3|tres)(\b|$)/i.test(clean) ||
                clean.includes(currentQuestion.options[2].toLowerCase())) {
                detectedIdx = 2; 
                break;
            }
        }

        if (detectedCommand === 'submit') {
            if (selectedOptionIdx !== null) {
                statusBadge.innerHTML = `Comando reconocido: <strong>Comprobar respuesta</strong>`;
                submitCurrentAnswer();
            } else {
                statusBadge.innerHTML = `Primero elegí una opción para poder comprobar.`;
            }
        } else if (detectedIdx !== -1) {
            selectOption(detectedIdx);
            statusBadge.innerHTML = `Marcada opción <strong>${['A', 'B', 'C'][detectedIdx]}</strong>. Podés decir <strong>"Comprobar"</strong>.`;
        } else {
            statusBadge.className = 'selection-status-badge';
            statusBadge.innerHTML = `Escuché: <strong>"${spokenWord}"</strong>. Decí A, B, C o Comprobar.`;
        }
    };

    recognition.onerror = (e) => {
        btn.classList.remove('listening');
        btn.innerHTML = `<span class="material-symbols-rounded icon" aria-hidden="true" style="font-size: 18px;">mic</span> Dictar por voz`;
        
        const errors = {
            'not-allowed': 'Micrófono denegado en el navegador.',
            'network': 'Error de conexión de red para el motor de voz.',
            'no-speech': 'No se detectó audio.'
        };
        statusBadge.innerHTML = `<span style="color:#DC2626;">${errors[e.error] || `Error: ${e.error}`}</span>`;
    };

    recognition.onend = () => {
        btn.classList.remove('listening');
        btn.innerHTML = `<span class="material-symbols-rounded icon" aria-hidden="true" style="font-size: 18px;">mic</span> Dictar por voz`;
    };

    recognition.start();
}

function submitCurrentAnswer() {
    if (selectedOptionIdx === null) return;

    const item = window.activityConfig.questions[currentQuestionIdx];
    const total = window.activityConfig.questions.length;

    if (selectedOptionIdx === item.correct) {
        if (!answeredQuestions[currentQuestionIdx]) {
            currentScore += 10;
            answeredQuestions[currentQuestionIdx] = true;
            updateResolvedCounter();
        }

        openFeedbackModal({
            isSuccess: true,
            title: "Comprensión conceptual lograda",
            desc: item.retroAcierto,
            primaryBtnText: "Continuar a la siguiente",
            onPrimary: () => {
                if (currentQuestionIdx < total - 1) {
                    currentQuestionIdx++;
                    renderCurrentQuestion();
                } else {
                    activityFinished = true;
                    renderCurrentQuestion();
                    if (typeof ScormProcess !== 'undefined') {
                        ScormProcess.complete(Math.round((currentScore / (total * 10)) * 100));
                    }
                }
            }
        });
    } else {
        openFeedbackModal({
            isSuccess: false,
            title: "Orientación formativa",
            desc: item.retroDesacierto,
            primaryBtnText: "Revisar y volver a intentar",
            onPrimary: () => {},
            secondaryBtnText: "Continuar a la siguiente",
            onSecondary: () => {
                if (currentQuestionIdx < total - 1) {
                    currentQuestionIdx++;
                    renderCurrentQuestion();
                } else {
                    activityFinished = true;
                    renderCurrentQuestion();
                }
            }
        });
    }
}

function updateResolvedCounter() {
    const total = window.activityConfig.questions.length;
    const resolvedCount = Object.keys(answeredQuestions).length;
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.textContent = `${resolvedCount} de ${total}`;
    }
}

function openFeedbackModal({ isSuccess, title, desc, primaryBtnText, onPrimary, secondaryBtnText, onSecondary }) {
    const dialog = document.getElementById('feedback-modal');
    document.getElementById('feedback-badge').className = `modal-icon-badge ${isSuccess ? 'modal-badge-success' : 'modal-badge-info'}`;
    document.getElementById('feedback-icon').textContent = isSuccess ? 'check_circle' : 'psychology';
    document.getElementById('feedback-title').textContent = title;
    document.getElementById('feedback-desc').textContent = desc;

    const actionsContainer = document.getElementById('feedback-actions-container');
    actionsContainer.innerHTML = '';

    const primaryBtn = document.createElement('button');
    primaryBtn.className = 'btn btn-primary';
    primaryBtn.textContent = primaryBtnText;
    primaryBtn.onclick = () => {
        dialog.close();
        if (onPrimary) onPrimary();
    };
    actionsContainer.appendChild(primaryBtn);

    if (secondaryBtnText && onSecondary) {
        const secondaryBtn = document.createElement('button');
        secondaryBtn.className = 'btn btn-secondary';
        secondaryBtn.textContent = secondaryBtnText;
        secondaryBtn.onclick = () => {
            dialog.close();
            onSecondary();
        };
        actionsContainer.appendChild(secondaryBtn);
    }

    dialog.showModal();
}

function updateProgressBar(current, total) {
    const resolvedCount = Object.keys(answeredQuestions).length;
    const pct = Math.round((resolvedCount / total) * 100);
    const fill = document.getElementById('progress-fill');
    const label = document.getElementById('progress-text');
    const barWidget = document.getElementById('progress-bar-widget');

    if (fill) fill.style.width = `${pct}%`;
    if (label) label.textContent = `Progreso de la actividad: ${resolvedCount} de ${total} preguntas resueltas (${pct}%)`;

    if (barWidget) {
        barWidget.setAttribute('aria-valuenow', resolvedCount);
        barWidget.setAttribute('aria-valuemax', total);
    }
    updateResolvedCounter();
}

function renderPaginationBar() {
    const total = window.activityConfig.questions.length;
    const paginationList = document.getElementById('pagination-list');
    const prevBtn = document.getElementById('nav-prev');
    const nextBtn = document.getElementById('nav-next');

    paginationList.querySelectorAll('li.numeric-page-item').forEach(el => el.remove());
    const nextLi = nextBtn.closest('li');

    for (let i = 0; i < total; i++) {
        const li = document.createElement('li');
        li.className = 'numeric-page-item';

        const btn = document.createElement('button');
        btn.className = `page-link ${i === currentQuestionIdx ? 'active' : ''}`;
        btn.textContent = i + 1;
        btn.setAttribute('aria-label', `Ir a la pregunta ${i + 1}`);
        if (i === currentQuestionIdx) btn.setAttribute('aria-current', 'step');
        btn.onclick = () => navigateQuestion(i);

        li.appendChild(btn);
        paginationList.insertBefore(li, nextLi);
    }

    prevBtn.disabled = (currentQuestionIdx === 0);
    nextBtn.disabled = (currentQuestionIdx === total - 1);
}

function navigateQuestion(idx) {
    const total = window.activityConfig.questions.length;
    if (idx >= 0 && idx < total) {
        currentQuestionIdx = idx;
        renderCurrentQuestion();
    }
}

function executeResetActivity() {
    currentQuestionIdx = 0;
    currentScore = 0;
    answeredQuestions = {};
    activityFinished = false;
    updateResolvedCounter();
    renderCurrentQuestion();
}

function executeExitActivity() {
    const total = window.activityConfig.questions.length;
    const scorePct = Math.round((currentScore / (total * 10)) * 100);

    if (typeof ScormProcess !== 'undefined' && ScormProcess.api) {
        ScormProcess.exit(scorePct);
    }

    if (window.parent && window.parent !== window) {
        window.parent.history.back();
    } else {
        window.close();
        document.body.innerHTML = `
            <div style="text-align:center; padding:60px 20px; font-family:'Plus Jakarta Sans',sans-serif;">
                <h2 style="color:#2D0B24;">Sesión finalizada</h2>
                <p>Tu avance formativo ha sido guardado. Podés cerrar esta ventana.</p>
            </div>
        `;
    }
}