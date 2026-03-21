// Extend window type for SpeechRecognition (not in all TS lib versions)
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

type RecognitionState = 'idle' | 'recording' | 'done';

export function initVoiceInput(
  button: HTMLButtonElement,
  textarea: HTMLTextAreaElement,
  langToggle?: HTMLButtonElement | null,
): void {
  const SpeechRecognitionAPI =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    button.style.display = 'none';
    return;
  }

  let recognition: InstanceType<typeof SpeechRecognition> | null = null;
  let state: RecognitionState = 'idle';
  // Track the last confirmed final transcript length so we can append properly
  let confirmedLength = 0;

  function setState(next: RecognitionState): void {
    state = next;

    button.classList.remove('voice-btn--idle', 'voice-btn--recording', 'voice-btn--done');
    button.classList.add(`voice-btn--${next}`);

    if (next === 'recording') {
      button.setAttribute('aria-label', 'Stop voice recording');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.setAttribute('aria-label', 'Start voice recording');
      button.setAttribute('aria-pressed', 'false');
    }
  }

  function stopRecognition(): void {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    setState('idle');
  }

  function startRecognition(): void {
    recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Use language from toggle button if available, otherwise default to pt-BR
    const selectedLang = langToggle?.dataset.lang || 'pt-BR';
    recognition.lang = selectedLang;

    // Save where the textarea content ends before we start appending
    confirmedLength = textarea.value.length;
    // If there's already content, ensure a space separator
    const needsSeparator = confirmedLength > 0 && !textarea.value.endsWith(' ') && !textarea.value.endsWith('\n');
    if (needsSeparator) {
      textarea.value += ' ';
      confirmedLength = textarea.value.length;
    }

    recognition.onstart = () => {
      setState('recording');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Rebuild from the confirmed base every result event so interim results
      // don't stack on top of each other.
      const base = textarea.value.slice(0, confirmedLength);
      let interim = '';
      let newConfirmed = base;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          newConfirmed += transcript;
        } else {
          interim += transcript;
        }
      }

      // Commit finals
      if (newConfirmed !== base) {
        textarea.value = newConfirmed + interim;
        confirmedLength = newConfirmed.length;
      } else {
        textarea.value = base + interim;
      }

      // Trigger input event so any dependent listeners (e.g. auto-resize) fire
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    };

    recognition.onerror = () => {
      stopRecognition();
    };

    recognition.onend = () => {
      // onend fires after stop() too — only reset if we're still in recording state
      if (state === 'recording') {
        setState('done');
        // Brief "done" flash, then return to idle
        setTimeout(() => setState('idle'), 800);
      }
      recognition = null;
    };

    recognition.start();
  }

  // Wire up language toggle if present
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const current = langToggle.dataset.lang || 'pt-BR';
      if (current === 'pt-BR') {
        langToggle.dataset.lang = 'en-US';
        langToggle.textContent = 'en';
      } else {
        langToggle.dataset.lang = 'pt-BR';
        langToggle.textContent = 'pt';
      }
      // If currently recording, restart with new language
      if (state === 'recording') {
        stopRecognition();
        startRecognition();
      }
    });
  }

  // Initial state
  setState('idle');
  button.setAttribute('aria-pressed', 'false');

  button.addEventListener('click', () => {
    if (state === 'recording') {
      stopRecognition();
    } else {
      startRecognition();
    }
  });
}

// Self-initialize: wire up every .voice-btn[data-target] on the page
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLButtonElement>('.voice-btn[data-target]').forEach((btn) => {
    const target = document.getElementById(btn.dataset.target!);
    if (target instanceof HTMLTextAreaElement) {
      initVoiceInput(btn, target);
    }
  });
});
