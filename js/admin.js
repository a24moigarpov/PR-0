// Gestió de nom d'usuari amb localStorage
// Clau de localStorage
const NAME_KEY = 'usuariNom';

function renderUserUI() {
  const form = document.getElementById('userForm');
  const nameInput = document.getElementById('userName');
  const greetArea = document.getElementById('greetArea');
  const greeting = document.getElementById('greeting');

  if (!form || !greetArea || !greeting) return;

  const savedName = localStorage.getItem(NAME_KEY);
  if (savedName && savedName.trim() !== '') {
    // Mostra salutació
    if (greeting) greeting.textContent = `Hola, ${savedName}!`;
    greetArea.style.display = '';
    form.style.display = 'none';
  } else {
    // Mostra formulari
    greetArea.style.display = 'none';
    form.style.display = '';
    if (nameInput) nameInput.value = '';
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
