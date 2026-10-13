document.addEventListener('DOMContentLoaded', () => {
    const offcanvas = document.getElementById('a11y-offcanvas');
    const openBtn = document.getElementById('btn-open-a11y');
    const closeBtn = document.getElementById('btn-close-a11y');

    // Elementos del fondo a aislar con inert al abrir el panel lateral
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
            // Desactiva el foco de línea al pulsar Escape
            const lineFocusToggle = document.getElementById('a11y-line-focus-toggle');
            if (lineFocusToggle && lineFocusToggle.checked) {
                lineFocusToggle.checked = false;
                lineFocusToggle.dispatchEvent(new Event('change'));
            }
            if (offcanvas.classList.contains('open')) closeOffcanvas();
            if (isSpeaking) stopSpeaking();
        }
    });

    // Pestañas del panel de accesibilidad (WAI-ARIA Roving Tabindex)
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
    });

    document.getElementById('a11y-spacing-toggle').addEventListener('change', (e) => {
        document.body.classList.toggle('a11y-spacing-active', e.target.checked);
    });

    document.querySelectorAll('input[name="a11y-font"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'default') document.body.removeAttribute('data-font');
            else document.body.setAttribute('data-font', e.target.value);
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

    // Foco de línea estático centrado (3 y 5 líneas)
    const lineFocusToggle = document.getElementById('a11y-line-focus-toggle');
    const overlay = document.getElementById('line-focus-overlay');
    const lineWindow = document.getElementById('line-focus-window');
    const lineControls = document.getElementById('line-focus-controls');
    
    let currentLines = 3;

    window.updateStaticWindowHeight = function() {
        const windowHeight = currentLines === 3 ? 96 : 160;
        lineWindow.style.height = `${windowHeight}px`;
    };

    lineFocusToggle.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        overlay.className = isActive ? 'line-focus-active' : 'line-focus-hidden';
        overlay.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        lineControls.style.display = isActive ? 'block' : 'none';
        if (isActive) {
            updateStaticWindowHeight();
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
            updateStaticWindowHeight();
        });
    });

    setupIntegratedAudio();
});

// Diccionario de partes de la oración para resaltado gramatical
const wordDb = {
    // Sustantivos
    'bit': { type: 'noun', label: 's' },
    'bits': { type: 'noun', label: 's' },
    'byte': { type: 'noun', label: 's' },
    'bytes': { type: 'noun', label: 's' },
    'kilobyte': { type: 'noun', label: 's' },
    'kilobytes': { type: 'noun', label: 's' },
    'megabyte': { type: 'noun', label: 's' },
    'megabytes': { type: 'noun', label: 's' },
    'gigabyte': { type: 'noun', label: 's' },
    'gigabytes': { type: 'noun', label: 's' },
    'terabyte': { type: 'noun', label: 's' },
    'terabytes': { type: 'noun', label: 's' },
    'petabyte': { type: 'noun', label: 's' },
    'petabytes': { type: 'noun', label: 's' },
    'memoria': { type: 'noun', label: 's' },
    'memorias': { type: 'noun', label: 's' },
    'computadora': { type: 'noun', label: 's' },
    'computadoras': { type: 'noun', label: 's' },
    'pendrive': { type: 'noun', label: 's' },
    'archivo': { type: 'noun', label: 's' },
    'archivos': { type: 'noun', label: 's' },
    'disco': { type: 'noun', label: 's' },
    'discos': { type: 'noun', label: 's' },
    'información': { type: 'noun', label: 's' },
    'almacenamiento': { type: 'noun', label: 's' },
    'unidad': { type: 'noun', label: 's' },
    'unidades': { type: 'noun', label: 's' },
    'capacidad': { type: 'noun', label: 's' },
    'capacidades': { type: 'noun', label: 's' },
    'sistema': { type: 'noun', label: 's' },
    
    // Adjetivos
    'exacta': { type: 'adj', label: 'adj' },
    'mínima': { type: 'adj', label: 'adj' },
    'solicitada': { type: 'adj', label: 'adj' },
    'libre': { type: 'adj', label: 'adj' },
    'básica': { type: 'adj', label: 'adj' },
    'fundamental': { type: 'adj', label: 'adj' },
    
    // Verbos
    'seleccioná': { type: 'verb', label: 'v' },
    'equivale': { type: 'verb', label: 'v' },
    'medir': { type: 'verb', label: 'v' },
    'crear': { type: 'verb', label: 'v' },
    'forma': { type: 'verb', label: 'v' },
    'agrupar': { type: 'verb', label: 'v' },
    'calcular': { type: 'verb', label: 'v' },
    'guardar': { type: 'verb', label: 'v' },
    'reconocer': { type: 'verb', label: 'v' },
    'necesita': { type: 'verb', label: 'v' }
};

// Algoritmo fonético para silabeo en español con preservación de mayúsculas y excepciones técnicas
function silabear(palabra) {
    const excepciones = {
        'bit': 'bit', 'bits': 'bits',
        'byte': 'byte', 'bytes': 'bytes',
        'kilobyte': 'ki·lo·byte', 'kilobytes': 'ki·lo·bytes',
        'megabyte': 'me·ga·byte', 'megabytes': 'me·ga·bytes',
        'gigabyte': 'gi·ga·byte', 'gigabytes': 'gi·ga·bytes',
        'terabyte': 'te·ra·byte', 'terabytes': 'te·ra·bytes',
        'petabyte': 'pe·ta·byte', 'petabytes': 'pe·ta·bytes',
        'pendrive': 'pen·drive'
    };

    const lower = palabra.toLowerCase();
    if (excepciones[lower]) {
        let template = excepciones[lower].split('');
        let original = palabra.split('');
        let result = '';
        let j = 0;
        for (let i = 0; i < template.length; i++) {
            if (template[i] === '·') {
                result += '·';
            } else {
                result += original[j] || '';
                j++;
            }
        }
        return result;
    }

    let p = palabra;
    const voc = "aeiouáéíóúüAEIOUÁÉÍÓÚÜ"; 
    
    // Hiatos
    p = p.replace(/([aeoáéíóúAEOÁÉÍÓÚ])([aeoáéíóúAEOÁÉÍÓÚ])/g, "$1·$2");
    p = p.replace(/([aeoáéíóúAEOÁÉÍÓÚ])([aeoáéíóúAEOÁÉÍÓÚ])/g, "$1·$2");
    
    // Vocal + Consonante + Vocal
    p = p.replace(new RegExp(`([${voc}])([^${voc}·])([${voc}])`, 'g'), "$1·$2$3");
    p = p.replace(new RegExp(`([${voc}])([^${voc}·])([${voc}])`, 'g'), "$1·$2$3");

    // Vocal + 2 Consonantes + Vocal (Grupos inseparables)
    const ins = ['br', 'bl', 'cr', 'cl', 'dr', 'fr', 'fl', 'gr', 'gl', 'pr', 'pl', 'tr', 'ch', 'll', 'rr'];
    p = p.replace(new RegExp(`([${voc}])([^${voc}·]{2})([${voc}])`, 'g'), (match, v1, cc, v2) => {
        if (ins.includes(cc.toLowerCase())) return `${v1}·${cc}${v2}`;
        return `${v1}${cc[0]}·${cc[1]}${v2}`;
    });
    p = p.replace(new RegExp(`([${voc}])([^${voc}·]{2})([${voc}])`, 'g'), (match, v1, cc, v2) => {
        if (ins.includes(cc.toLowerCase())) return `${v1}·${cc}${v2}`;
        return `${v1}${cc[0]}·${cc[1]}${v2}`;
    });

    // Vocal + 3 Consonantes + Vocal
    p = p.replace(new RegExp(`([${voc}])([^${voc}·]{3})([${voc}])`, 'g'), (match, v1, ccc, v2) => {
        const ultimas = ccc.substring(1).toLowerCase();
        if (ins.includes(ultimas)) return `${v1}${ccc[0]}·${ccc.substring(1)}${v2}`;
        return `${v1}${ccc.substring(0, 2)}·${ccc[2]}${v2}`;
    });
    
    // Vocal + 4 Consonantes + Vocal
    p = p.replace(new RegExp(`([${voc}])([^${voc}·]{4})([${voc}])`, 'g'), "$1$2·$3$4");

    return p;
}

window.applyGrammarHighlights = function() {
    const showSyllables = document.getElementById('a11y-syllables-toggle')?.checked || false;
    const showNouns = document.getElementById('a11y-pos-nouns')?.checked || false;
    const showVerbs = document.getElementById('a11y-pos-verbs')?.checked || false;
    const showAdj = document.getElementById('a11y-pos-adj')?.checked || false;
    const showAdv = document.getElementById('a11y-pos-adv')?.checked || false;
    const showLabels = document.getElementById('a11y-labels-toggle')?.checked || false;

    // Aplica sobre todos los elementos de texto legibles
    document.querySelectorAll('p, h1, h2, h3, h4, .consigna-text, .option-button, .support-content').forEach(container => {
        if (!container.hasAttribute('data-original-text')) {
            container.setAttribute('data-original-text', container.innerHTML);
        }
        
        const originalText = container.getAttribute('data-original-text');

        if (!showSyllables && !showNouns && !showVerbs && !showAdj && !showAdv) {
            container.innerHTML = originalText;
            return;
        }

        container.innerHTML = originalText.replace(/(<[^>]+>)|([a-záéíóúñü]+)/gi, (match, htmlTag, word) => {
            if (htmlTag) return htmlTag;
            
            const clean = word.toLowerCase();
            const entry = wordDb[clean];
            
            let displayCore = showSyllables ? silabear(word) : word;
            let cssClass = '';
            let labelTag = '';

            if (entry) {
                if (entry.type === 'noun' && showNouns) cssClass = 'highlight-noun';
                if (entry.type === 'verb' && showVerbs) cssClass = 'highlight-verb';
                if (entry.type === 'adj' && showAdj) cssClass = 'highlight-adj';
                if (entry.type === 'adv' && showAdv) cssClass = 'highlight-adv';

                if (cssClass && showLabels) {
                    labelTag = `<span class="pos-label-tag" aria-hidden="true">${entry.label}</span>`;
                }
            }

            if (cssClass || showSyllables) {
                return `<span class="${cssClass}">${displayCore}${labelTag}</span>`;
            }

            return word;
        });
    });
};

// Motor de síntesis de voz (TTS)
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

    // Control de velocidad con reinicio seguro del buffer
    speedSlider.addEventListener('change', (e) => {
        const rate = parseFloat(e.target.value).toFixed(1);
        speedVal.textContent = `${rate}x`;
        if (isSpeaking) {
            stopSpeaking();
            setTimeout(() => playBtn.click(), 300); 
        }
    });

    document.querySelectorAll('input[name="a11y-voice-gender"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (isSpeaking) {
                stopSpeaking();
                setTimeout(() => playBtn.click(), 300);
            }
        });
    });

    playBtn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) { 
            alert("Tu navegador no soporta síntesis de voz."); 
            return; 
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