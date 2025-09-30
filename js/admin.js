// Gestió de nom d'usuari amb localStorage
// Clau de localStorage
const NAME_KEY = 'usuariNom';

function renderUserUI() {
  const form = document.getElementById('userForm');
  const nameInput = document.getElementById('userName');
  const greetArea = document.getElementById('greetArea');
  const greeting = document.getElementById('greeting');
  const quizSection = document.getElementById('quizSection');
  const buttons = document.querySelectorAll('button:not(#clearNameBtn):not([type="submit"])');

  if (!form || !greetArea || !greeting) return;

  const savedName = localStorage.getItem(NAME_KEY);
  if (savedName && savedName.trim() !== '') {
    // Mostrar saludo y habilitar botones
    if (greeting) greeting.textContent = `Hola, ${savedName}!`;
    greetArea.style.display = '';
    form.style.display = 'none';
    
    // Habilitar todos los botones del quiz
    buttons.forEach(button => {
      button.disabled = false;
    });
    
    // Habilitar la sección del quiz si existe
    if (quizSection) {
      quizSection.classList.remove('disabled-section');
    }
  } else {
    // Mostrar formulario y deshabilitar botones
    greetArea.style.display = 'none';
    form.style.display = '';
    
    // Deshabilitar todos los botones del quiz
    buttons.forEach(button => {
      button.disabled = true;
    });
    
    // Deshabilitar la sección del quiz si existe
    if (quizSection) {
      quizSection.classList.add('disabled-section');
    }
    
    if (nameInput) {
      nameInput.value = '';
      nameInput.focus();
    }
  }
}

function setupUserHandlers() {
  const form = document.getElementById('userForm');
  const nameInput = document.getElementById('userName');
  const clearBtn = document.getElementById('clearNameBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (nameInput?.value || '').trim();
      if (name.length > 0) {
        localStorage.setItem(NAME_KEY, name);
        renderUserUI();
      } else {
        // Opcional: feedback senzill
        alert('Si us plau, introdueix un nom vàlid.');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem(NAME_KEY);
      renderUserUI();
      // Reinicia la partida cuando se borra el nombre
      if (typeof window.resetQuiz === 'function') {
        window.resetQuiz();
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setupUserHandlers();
  renderUserUI();
});
