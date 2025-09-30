document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const questionForm = document.getElementById('questionForm');
    const questionText = document.getElementById('questionText');
    const answer1 = document.getElementById('answer1');
    const answer2 = document.getElementById('answer2');
    const answer3 = document.getElementById('answer3');
    const answer4 = document.getElementById('answer4');
    const correctAnswer = document.getElementById('correctAnswer');
    const imageUrl = document.getElementById('imageUrl');
    const saveButton = document.getElementById('saveQuestion');
    const cancelButton = document.getElementById('cancelEdit');
    const questionsList = document.getElementById('questionsList');
    const logoutButton = document.getElementById('logoutBtn');
    const formTitle = document.getElementById('formTitle');
    const editId = document.getElementById('editId');

    // Cargar preguntas al iniciar
    loadQuestions();

    // Manejar el envío del formulario
    saveButton.addEventListener('click', saveQuestion);
    
    // Manejar cancelar edición
    cancelButton.addEventListener('click', cancelEdit);
    
    // Manejar cierre de sesión
    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('isAdmin');
        window.location.href = 'index.html';
    });

    // Cargar preguntas desde el servidor
    function loadQuestions() {
        const url = './php/getPreguntes.php?action=admin';
        console.log('Cargando preguntas desde:', url);
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Datos recibidos:', data);
                if (data && data.success) {
                    displayQuestions(data.questions || []);
                } else {
                    showError(data?.error || 'Error al cargar las preguntas');
                }
            })
            .catch(error => {
                console.error('Error en la petición:', error);
                showError(`Error de conexión: ${error.message}`);
            });
    }

    // Mostrar preguntas en la lista
    function displayQuestions(questions) {
        console.log('Questions data received:', questions);
        if (questions.length === 0) {
            questionsList.innerHTML = '<p>No hay preguntas disponibles.</p>';
            return;
        }

        let html = '<div class="questions-grid">';
        questions.forEach(question => {
            console.log('Processing question:', question.id, 'Image URL:', question.imatge);
            const hasImage = question.imatge && question.imatge.trim() !== '';
            console.log('Has image?', hasImage);
            html += `
                <div class="question-item" data-id="${question.id}">
                    <h3>${escapeHtml(question.pregunta)}</h3>
                    ${hasImage ? `<div class="question-image-preview"><img src="${escapeHtml(question.imatge)}" alt="Imagen de la pregunta" style="max-width: 100%; max-height: 200px; margin: 10px 0; border-radius: 4px;"></div>` : ''}
                    <p><strong>Respostes:</strong></p>
                    <ol>
                        <li class="${question.resposta_correcta === 0 ? 'correct-answer' : ''}">${escapeHtml(question.resposta_1)}</li>
                        <li class="${question.resposta_correcta === 1 ? 'correct-answer' : ''}">${escapeHtml(question.resposta_2)}</li>
                        <li class="${question.resposta_correcta === 2 ? 'correct-answer' : ''}">${escapeHtml(question.resposta_3 || '')}</li>
                        <li class="${question.resposta_correcta === 3 ? 'correct-answer' : ''}">${escapeHtml(question.resposta_4 || '')}</li>
                    </ol>
                    <div class="question-actions">
                        <button class="btn btn-edit" onclick="editQuestion(${question.id})">Editar</button>
                        <button class="btn btn-delete" onclick="deleteQuestion(${question.id})">Eliminar</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        questionsList.innerHTML = html;
    }

    // Escapar HTML para prevenir XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Guardar una nueva pregunta o actualizar una existente
    function saveQuestion() {
        const questionData = {
            question: questionText.value.trim(),
            answer1: answer1.value.trim(),
            answer2: answer2.value.trim(),
            answer3: answer3.value.trim(),
            answer4: answer4.value.trim(),
            correctIndex: parseInt(correctAnswer.value),
            imageUrl: imageUrl.value.trim()
        };

        // Validar campos obligatorios
        if (!questionData.question || !questionData.answer1 || !questionData.answer2 || !questionData.answer3 || !questionData.answer4) {
            showError('La pregunta y las cuatro respuestas son obligatorias');
            return;
        }

        const isEdit = editId.value !== '';
        const url = './php/getPreguntes.php';
        
        const payload = {
            action: isEdit ? 'update' : 'create',
            question: questionData.question,
            answer1: questionData.answer1,
            answer2: questionData.answer2,
            answer3: questionData.answer3,
            answer4: questionData.answer4,
            correctIndex: questionData.correctIndex,
            imageUrl: questionData.imageUrl
        };

        if (isEdit) {
            payload.id = editId.value;
        }

        console.log('Enviando payload:', payload); // DEBUG
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            console.log('Response status:', response.status); // DEBUG
            return response.json().then(data => ({status: response.status, data: data}));
        })
        .then(({status, data}) => {
            console.log('Response data:', data); // DEBUG
            if (data.success) {
                resetForm();
                loadQuestions();
                showSuccess(isEdit ? 'Pregunta actualizada correctamente' : 'Pregunta creada correctamente');
            } else {
                showError(data.error || 'Error al guardar la pregunta');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Error de conexión con el servidor');
        });
    }

    // Editar una pregunta existente
    window.editQuestion = function(id) {
        fetch(`./php/getPreguntes.php?id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.question) {
                    const q = data.question;
                    editId.value = q.id;
                    questionText.value = q.pregunta;
                    answer1.value = q.resposta_1;
                    answer2.value = q.resposta_2;
                    answer3.value = q.resposta_3 || '';
                    answer4.value = q.resposta_4 || '';
                    correctAnswer.value = q.resposta_correcta;
                    imageUrl.value = q.imatge || '';
                    
                    formTitle.textContent = 'Editar Pregunta';
                    saveButton.textContent = 'Actualitzar Pregunta';
                    cancelButton.style.display = 'inline-block';
                    
                    // Desplazarse al formulario
                    questionForm.scrollIntoView({ behavior: 'smooth' });
                } else {
                    showError('No se pudo cargar la pregunta para editar');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error al cargar la pregunta');
            });
    };

    // Eliminar una pregunta
    window.deleteQuestion = function(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
            return;
        }

        fetch('./php/getPreguntes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete',
                id: id
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadQuestions();
                showSuccess('Pregunta eliminada correctamente');
            } else {
                showError(data.error || 'Error al eliminar la pregunta');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Error de conexión con el servidor');
        });
    };

    // Cancelar edición
    function cancelEdit() {
        resetForm();
    }

    // Reiniciar el formulario
    function resetForm() {
        questionText.value = '';
        answer1.value = '';
        answer2.value = '';
        answer3.value = '';
        answer4.value = '';
        imageUrl.value = '';
        editId.value = '';
        correctAnswer.value = '0';
        formTitle.textContent = 'Afegir Nova Pregunta';
        saveButton.textContent = 'Desar Pregunta';
        cancelButton.style.display = 'none';
    }

    // Mostrar mensaje de éxito
    function showSuccess(message) {
        alert(message);
    }

    
    // Mostrar mensaje de error
    function showError(message) {
        alert('Error: ' + message);
    }

    // Verificar autenticación al cargar la página
    if (!localStorage.getItem('isAdmin')) {
        window.location.href = 'index.html';
    }
});