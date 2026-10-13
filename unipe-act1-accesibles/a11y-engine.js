document.addEventListener('DOMContentLoaded', () => {
    const offcanvas = document.getElementById('a11y-offcanvas');
    const openBtn = document.getElementById('btn-open-a11y');
    const closeBtn = document.getElementById('btn-close-a11y');

    // ELEMENTOS DEL FONDO A AISLAR CON INERT
    const backgroundSelectors = ['header', '.wide-container', '.project-footer', '.skip-link'];

    function openOffcanvas() {
        offcanvas.classList.add('open');
        offcanvas.setAttribute('aria-hidden', 'false');
        openBtn.setAttribute('aria-expanded', 'true');

        backgroundSelectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.setAttribute('inert', '');
        });

        closeBtn.focus();
    }

    function closeOffcanvas() {
        offcanvas.classList.remove('open');
        offcanvas.setAttribute('aria-hidden', 'true');
        openBtn.setAttribute('aria-expanded', 'false');

        backgroundSelectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.removeAttribute('inert');
        });

        openBtn.focus();
    }

    openBtn.addEventListener('click', openOffcanvas);
    closeBtn.addEventListener('click', closeOffcanvas);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (offcanvas.classList.contains('open')) closeOffcanvas();
            if (isSpeaking) stopSpeaking();
        }
    });

    // PESTAÑAS DEL OFFCANVAS
    const a11yTabNav = document.querySelector('.a11y-tabs-nav');
    const a11yTabBtns = Array.from(document.querySelectorAll('.a11y-tab-btn'));
    const a11yPanels = Array.from(document.querySelectorAll('.a11y-tab-panel'));

    function activateA11yTab(index, shouldFocus = true) {
        a11yTabBtns.forEach((btn, idx) => {
            const isTarget = (idx === index);
            btn.classList.toggle('active', isTarget);
            btn.setAttribute('aria-selected', String(isTarget));
            btn.setAttribute('tabindex', isTarget ? '0' : '-1');
            if (a11yPanels[idx]) {
                a11yPanels[idx].classList.toggle('active', isTarget);
            }
            if (isTarget && shouldFocus) {
                btn.focus();
            }
        });
    }

    a11yTabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => activateA11yTab(idx, false));
    });

    if (a11yTabNav) {
        a11yTabNav.addEventListener('keydown', (e) => {
            let activeIdx = a11yTabBtns.findIndex(b => b.getAttribute('aria-selected') === 'true');
            if (activeIdx === -1) activeIdx = 0;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIdx = (activeIdx + 1) % a11yTabBtns.length;
                activateA11yTab(nextIdx, true);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIdx = (activeIdx - 1 + a11yTabBtns.length) % a11yTabBtns.length;
                activateA11yTab(prevIdx, true);
            } else if (e.key === 'Home') {
                e.preventDefault();
                activateA11yTab(0, true);
            } else if (e.key === 'End') {
                e.preventDefault();
                activateA11yTab(a11yTabBtns.length - 1, true);
            }
        });
    }

    // Tamaño de texto escalable
    const sizeSlider = document.getElementById('a11y-text-size');
    const sizeValLabel = document.getElementById('label-text-size-val');
    sizeSlider.addEventListener('input', (e) => {
        const factor = parseFloat(e.target.value);
        document.documentElement.style.fontSize = `${16 * factor}px`;
        const pct = Math.round(factor * 100);
        sizeValLabel.textContent = `${pct}%`;
        sizeSlider.setAttribute('aria-valuenow', pct);
        
        if (document.getElementById('a11y-line-focus-toggle').checked) updateLineFocusPosition();
    });

    document.getElementById('a11y-spacing-toggle').addEventListener('change', (e) => {
        document.body.classList.toggle('a11y-spacing-active', e.target.checked);
        if (document.getElementById('a11y-line-focus-toggle').checked) updateLineFocusPosition();
    });

    document.querySelectorAll('input[name="a11y-font"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'default') document.body.removeAttribute('data-font');
            else document.body.setAttribute('data-font', e.target.value);
            if (document.getElementById('a11y-line-focus-toggle').checked) updateLineFocusPosition();
        });
    });

    document.querySelectorAll('.theme-box').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-box').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            const theme = btn.getAttribute('data-theme');
            if (theme === 'default') document.body.removeAttribute('data-theme');
            else document.body.setAttribute('data-theme', theme);
        });
    });

    ['a11y-syllables-toggle', 'a11y-pos-nouns', 'a11y-pos-verbs', 'a11y-pos-adj', 'a11y-pos-adv', 'a11y-labels-toggle'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => applyGrammarHighlights());
    });

    // FOCO DE LÍNEA CORREGIDO
    const lineFocusToggle = document.getElementById('a11y-line-focus-toggle');
    const overlay = document.getElementById('line-focus-overlay');
    const lineWindow = document.getElementById('line-focus-window');
    const lineControls = document.getElementById('line-focus-controls');
    
    let currentLines = 1;
    let currentTargetIndex = 0;

    window.getReadingTargets = function() {
        return Array.from(document.querySelectorAll('.stimulus-card, .consigna-text, .option-button'));
    };

    window.updateLineFocusPosition = function() {
        const targets = getReadingTargets();
        if (!targets.length) return;

        if (currentTargetIndex >= targets.length) currentTargetIndex = 0;
        if (currentTargetIndex < 0) currentTargetIndex = targets.length - 1;

        const el = targets[currentTargetIndex];
        const rect = el.getBoundingClientRect();
        
        const computedStyle = window.getComputedStyle(el);
        const computedLineHeight = parseFloat(computedStyle.lineHeight) || 32;
        const heightMultiplier = currentLines === 1 ? 1.6 : currentLines === 3 ? 3.2 : 5;
        const windowHeight = computedLineHeight * heightMultiplier;

        lineWindow.style.height = `${windowHeight}px`;
        let topPos = rect.top + (rect.height / 2) - (windowHeight / 2);
        if (topPos < 0) topPos = rect.top;
        lineWindow.style.top = `${topPos}px`;
    };

    lineFocusToggle.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        overlay.className = isActive ? 'line-focus-active' : 'line-focus-hidden';
        overlay.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        lineControls.style.display = isActive ? 'block' : 'none';
        if (isActive) {
            currentTargetIndex = 0;
            updateLineFocusPosition();
        }
    });

    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.line-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            currentLines = parseInt(btn.getAttribute('data-lines'), 10);
            updateLineFocusPosition();
        });
    });

    document.getElementById('btn-focus-prev').addEventListener('click', () => { currentTargetIndex--; updateLineFocusPosition(); });
    document.getElementById('btn-focus-next').addEventListener('click', () => { currentTargetIndex++; updateLineFocusPosition(); });
    window.addEventListener('resize', () => { if (lineFocusToggle.checked) updateLineFocusPosition(); });
    window.addEventListener('scroll', () => { if (lineFocusToggle.checked) updateLineFocusPosition(); }, { passive: true });

    // DICCIONARIO PICTOGRÁFICO
    document.addEventListener('click', (e) => {
        const dictToggle = document.getElementById('a11y-pic-dict-toggle');
        const popup = document.getElementById('picture-dict-popup');
        if (!dictToggle || !dictToggle.checked) {
            popup.className = 'dict-popup-hidden';
            return;
        }

        const targetWord = e.target.closest('.dict-word');
        if (targetWord) {
            const word = targetWord.getAttribute('data-word');
            const icon = targetWord.getAttribute('data-icon') || 'memory';
            document.getElementById('dict-word-text').textContent = word;
            document.getElementById('dict-icon-container').textContent = icon;
            document.getElementById('dict-speak-btn').onclick = () => speakText(word);

            const rect = targetWord.getBoundingClientRect();
            popup.style.top = `${rect.bottom + 8}px`;
            popup.style.left = `${Math.max(10, rect.left)}px`;
            popup.className = 'dict-popup-visible';
        } else if (!e.target.closest('#picture-dict-popup')) {
            popup.className = 'dict-popup-hidden';
        }
    });

    setupIntegratedAudio();
});

// BASE DE VOCABULARIO EXTENDIDA (Incluye plurales, adjetivos y verbos del entorno didáctico)
const wordDb = {
    // Sustantivos
    'bit': { type: 'noun', syl: 'bit', label: 's', icon: 'memory' },
    'bits': { type: 'noun', syl: 'bits', label: 's', icon: 'memory' },
    'byte': { type: 'noun', syl: 'byte', label: 's', icon: 'data_object' },
    'bytes': { type: 'noun', syl: 'bytes', label: 's', icon: 'data_object' },
    'kilobyte': { type: 'noun', syl: 'ki·lo·byte', label: 's', icon: 'storage' },
    'kilobytes': { type: 'noun', syl: 'ki·lo·bytes', label: 's', icon: 'storage' },
    'megabyte': { type: 'noun', syl: 'me·ga·byte', label: 's', icon: 'hard_drive' },
    'megabytes': { type: 'noun', syl: 'me·ga·bytes', label: 's', icon: 'hard_drive' },
    'gigabyte': { type: 'noun', syl: 'gi·ga·byte', label: 's', icon: 'database' },
    'gigabytes': { type: 'noun', syl: 'gi·ga·bytes', label: 's', icon: 'database' },
    'terabyte': { type: 'noun', syl: 'te·ra·byte', label: 's', icon: 'cloud' },
    'terabytes': { type: 'noun', syl: 'te·ra·bytes', label: 's', icon: 'cloud' },
    'petabyte': { type: 'noun', syl: 'pe·ta·byte', label: 's', icon: 'server' },
    'petabytes': { type: 'noun', syl: 'pe·ta·bytes', label: 's', icon: 'server' },
    'memoria': { type: 'noun', syl: 'me·mo·ria', label: 's', icon: 'memory' },
    'memorias': { type: 'noun', syl: 'me·mo·rias', label: 's', icon: 'memory' },
    'computadora': { type: 'noun', syl: 'com·pu·ta·do·ra', label: 's', icon: 'computer' },
    'computadoras': { type: 'noun', syl: 'com·pu·ta·do·ras', label: 's', icon: 'computer' },
    'pendrive': { type: 'noun', syl: 'pen·drive', label: 's', icon: 'usb' },
    'archivo': { type: 'noun', syl: 'ar·chi·vo', label: 's', icon: 'description' },
    'archivos': { type: 'noun', syl: 'ar·chi·vos', label: 's', icon: 'folder' },
    'disco': { type: 'noun', syl: 'dis·co', label: 's', icon: 'album' },
    'discos': { type: 'noun', syl: 'dis·cos', label: 's', icon: 'album' },
    'información': { type: 'noun', syl: 'in·for·ma·ción', label: 's', icon: 'info' },
    'almacenamiento': { type: 'noun', syl: 'al·ma·ce·na·mien·to', label: 's', icon: 'folder' },
    'unidad': { type: 'noun', syl: 'u·ni·dad', label: 's', icon: 'square' },
    'unidades': { type: 'noun', syl: 'u·ni·da·des', label: 's', icon: 'square' },
    'capacidad': { type: 'noun', syl: 'ca·pa·ci·dad', label: 's', icon: 'storage' },
    'capacidades': { type: 'noun', syl: 'ca·pa·ci·da·des', label: 's', icon: 'storage' },
    'sistema': { type: 'noun', syl: 'sis·te·ma', label: 's', icon: 'settings' },
    
    // Adjetivos
    'exacta': { type: 'adj', syl: 'e·xac·ta', label: 'adj' },
    'mínima': { type: 'adj', syl: 'mí·ni·ma', label: 'adj' },
    'solicitada': { type: 'adj', syl: 'so·li·ci·ta·da', label: 'adj' },
    'libre': { type: 'adj', syl: 'li·bre', label: 'adj' },
    'básica': { type: 'adj', syl: 'bá·si·ca', label: 'adj' },
    'fundamental': { type: 'adj', syl: 'fun·da·men·tal', label: 'adj' },
    
    // Verbos
    'seleccioná': { type: 'verb', syl: 'se·lec·cio·ná', label: 'v' },
    'equivale': { type: 'verb', syl: 'e·qui·va·le', label: 'v' },
    'medir': { type: 'verb', syl: 'me·dir', label: 'v' },
    'crear': { type: 'verb', syl: 'cre·ar', label: 'v' },
    'forma': { type: 'verb', syl: 'for·ma', label: 'v' },
    'agrupar': { type: 'verb', syl: 'a·gru·par', label: 'v' },
    'calcular': { type: 'verb', syl: 'cal·cu·lar', label: 'v' },
    'guardar': { type: 'verb', syl: 'guar·dar', label: 'v' },
    'reconocer': { type: 'verb', syl: 're·co·no·cer', label: 'v' },
    'necesita': { type: 'verb', syl: 'ne·ce·si·ta', label: 'v' }
};

function applyGrammarHighlights() {
    const showSyllables = document.getElementById('a11y-syllables-toggle')?.checked || false;
    const showNouns = document.getElementById('a11y-pos-nouns')?.checked || false;
    const showVerbs = document.getElementById('a11y-pos-verbs')?.checked || false;
    const showAdj = document.getElementById('a11y-pos-adj')?.checked || false;
    const showAdv = document.getElementById('a11y-pos-adv')?.checked || false;
    const showLabels = document.getElementById('a11y-labels-toggle')?.checked || false;

    // SELECTORES CORREGIDOS: Aísla el texto de puntuaciones sin romper el DOM
    document.querySelectorAll('.stimulus-context-title, .consigna-text, .phase-pill-badge').forEach(container => {
        if (!container.hasAttribute('data-original-text')) {
            container.setAttribute('data-original-text', container.innerText);
        }
        const text = container.getAttribute('data-original-text');
        
        // Separa el texto respetando los espacios
        const words = text.split(/(\s+)/);

        container.innerHTML = words.map(chunk => {
            if (!chunk.trim()) return chunk; // Es solo espacio

            // Expresión regular que separa signos de puntuación iniciales/finales de la palabra pura
            const match = chunk.match(/^([^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]*)([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]+)([^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]*)$/);
            
            if (!match) return chunk;

            const prePunct = match[1];
            const coreWord = match[2];
            const postPunct = match[3];

            const clean = coreWord.toLowerCase();
            const entry = wordDb[clean];
            
            if (!entry) return chunk;

            let displayCore = showSyllables && entry.syl ? entry.syl : coreWord;
            let cssClass = '';
            let labelTag = '';

            if (entry.type === 'noun' && showNouns) cssClass = 'highlight-noun';
            if (entry.type === 'verb' && showVerbs) cssClass = 'highlight-verb';
            if (entry.type === 'adj' && showAdj) cssClass = 'highlight-adj';
            if (entry.type === 'adv' && showAdv) cssClass = 'highlight-adv';

            if (cssClass && showLabels) {
                labelTag = `<span class="pos-label-tag" aria-hidden="true">${entry.label}</span>`;
            }

            // Si hay clase o sílaba, inyectamos el HTML aislando los signos de puntuación (ej: ¿computadora?)
            if (cssClass || showSyllables) {
                return `${prePunct}<span class="${cssClass} dict-word" data-word="${clean}" data-icon="${entry.icon || 'help'}">${displayCore}${labelTag}</span>${postPunct}`;
            }

            return chunk;
        }).join('');
    });
}

// MOTOR DE TTS CORREGIDO
let isSpeaking = false;
let voicesList = [];

function loadVoices() {
    if ('speechSynthesis' in window) {
        voicesList = speechSynthesis.getVoices();
    }
}

if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
}

function getBestVoice(gender = 'female') {
    if (!voicesList.length) loadVoices();
    
    const esVoices = voicesList.filter(v => v.lang.toLowerCase().startsWith('es'));
    if (!esVoices.length) return null;

    const malePatterns = ['male', 'pablo', 'raul', 'raúl', 'jorge', 'gonzalo', 'mateo', 'alonso', 'carlos', 'enrique', 'diego'];
    const femalePatterns = ['female', 'helena', 'laura', 'sabina', 'paulina', 'lucia', 'lucía', 'elena', 'monica', 'mónica', 'soledad', 'dalia'];

    const targetPatterns = gender === 'male' ? malePatterns : femalePatterns;
    
    let matched = esVoices.find(v => targetPatterns.some(pat => v.name.toLowerCase().includes(pat)));
    
    if (!matched) {
        if (gender === 'female') {
            matched = esVoices.find(v => !malePatterns.some(pat => v.name.toLowerCase().includes(pat)));
        } else {
            matched = esVoices.find(v => !femalePatterns.some(pat => v.name.toLowerCase().includes(pat)));
        }
    }

    return matched || esVoices[0];
}

function stopSpeaking() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
    isSpeaking = false;
    const playIcon = document.getElementById('a11y-tts-icon');
    const playLabel = document.getElementById('a11y-tts-label');
    const playBtn = document.getElementById('a11y-tts-play-btn');
    if (playIcon) playIcon.textContent = 'play_arrow';
    if (playLabel) playLabel.textContent = 'Iniciar lectura en voz alta';
    if (playBtn) playBtn.classList.remove('listening');
}

function setupIntegratedAudio() {
    const playBtn = document.getElementById('a11y-tts-play-btn');
    const playIcon = document.getElementById('a11y-tts-icon');
    const playLabel = document.getElementById('a11y-tts-label');
    const speedSlider = document.getElementById('a11y-speed-slider');
    const speedVal = document.getElementById('a11y-speed-val');

    speedSlider.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value).toFixed(1);
        speedVal.textContent = `${rate}x`;
        if (isSpeaking) {
            stopSpeaking();
            setTimeout(() => playBtn.click(), 100); 
        }
    });

    document.querySelectorAll('input[name="a11y-voice-gender"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (isSpeaking) {
                stopSpeaking();
                setTimeout(() => playBtn.click(), 100);
            }
        });
    });

    playBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) { 
            alert("Tu navegador no soporta síntesis de voz."); return; 
        }

        if (isSpeaking) {
            stopSpeaking();
        } else {
            speechSynthesis.cancel();

            const textToRead = typeof buildAccessibleSpeechText === 'function' 
                ? buildAccessibleSpeechText() 
                : document.querySelector('.activity-card').innerText;

            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'es-AR';
            utterance.rate = parseFloat(speedSlider.value) || 1.0;

            const selectedGender = document.querySelector('input[name="a11y-voice-gender"]:checked')?.value || 'female';
            const voice = getBestVoice(selectedGender);
            if (voice) utterance.voice = voice;

            utterance.onend = () => stopSpeaking();
            utterance.onerror = () => stopSpeaking();

            speechSynthesis.speak(utterance);
            isSpeaking = true;
            playIcon.textContent = 'stop';
            playLabel.textContent = 'Detener lectura en voz alta';
            playBtn.classList.add('listening');
        }
    });
}

function speakText(txt) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'es-AR';
        speechSynthesis.speak(u);
    }
}
