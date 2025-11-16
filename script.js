let questionIdCounter = 0;
let formData = {
  title: '',
  description: '',
  questions: []
};

const landingPage = document.getElementById('landing-page');
const formBuilder = document.getElementById('form-builder');
const blankFormBtn = document.getElementById('blank-form-btn');
const backBtn = document.getElementById('back-btn');
const saveBtn = document.getElementById('save-btn');
const previewBtn = document.getElementById('preview-btn');
const addQuestionBtn = document.getElementById('add-question-btn');
const questionsContainer = document.getElementById('questions-container');
const formTitle = document.getElementById('form-title');
const formDescription = document.getElementById('form-description');
const previewModal = document.getElementById('preview-modal');
const closePreviewBtn = document.getElementById('close-preview-btn');
const previewContent = document.getElementById('preview-content');
const toast = document.getElementById('toast');

blankFormBtn.addEventListener('click', () => {
  landingPage.classList.add('hidden');
  formBuilder.classList.remove('hidden');
  loadDraft();
  if (formData.questions.length === 0) {
    createSampleQuestions();
  }
});

backBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to go back? Unsaved changes will be lost.')) {
    formBuilder.classList.add('hidden');
    landingPage.classList.remove('hidden');
  }
});

document.querySelectorAll('.question-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    addQuestion(type);
  });
});

addQuestionBtn.addEventListener('click', () => {
  addQuestion('short-text');
});

saveBtn.addEventListener('click', () => {
  saveDraft();
  showToast('Form draft saved successfully!');
});

previewBtn.addEventListener('click', () => {
  showPreview();
});

closePreviewBtn.addEventListener('click', () => {
  previewModal.classList.add('hidden');
});

previewModal.addEventListener('click', (e) => {
  if (e.target === previewModal) {
    previewModal.classList.add('hidden');
  }
});

formTitle.addEventListener('input', (e) => {
  formData.title = e.target.value;
});

formDescription.addEventListener('input', (e) => {
  formData.description = e.target.value;
});

function addQuestion(type, questionData = null) {
  const questionId = questionData?.id || ++questionIdCounter;
  const question = questionData || {
    id: questionId,
    type: type,
    title: '',
    required: false,
    options: type === 'short-text' || type === 'long-text' ? [] : ['Option 1']
  };

  if (!questionData) {
    formData.questions.push(question);
  }

  const questionCard = createQuestionCard(question);
  questionsContainer.appendChild(questionCard);

  questionCard.querySelector('.question-input').focus();
}

function createQuestionCard(question) {
  const card = document.createElement('div');
  card.className = 'question-card';
  card.dataset.questionId = question.id;
  card.draggable = true;

  card.innerHTML = `
    <div class="question-header">
      <div class="drag-handle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </div>
      <input
        type="text"
        class="question-input"
        placeholder="Question title"
        value="${question.title}"
      >
      <select class="question-type-select">
        <option value="short-text" ${question.type === 'short-text' ? 'selected' : ''}>Short Answer</option>
        <option value="long-text" ${question.type === 'long-text' ? 'selected' : ''}>Paragraph</option>
        <option value="multiple-choice" ${question.type === 'multiple-choice' ? 'selected' : ''}>Multiple Choice</option>
        <option value="checkbox" ${question.type === 'checkbox' ? 'selected' : ''}>Checkboxes</option>
        <option value="dropdown" ${question.type === 'dropdown' ? 'selected' : ''}>Dropdown</option>
      </select>
    </div>
    <div class="question-options"></div>
    <div class="question-footer">
      <label class="required-toggle">
        <input type="checkbox" ${question.required ? 'checked' : ''}>
        Required
      </label>
      <button class="delete-question-btn" title="Delete question">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  const questionInput = card.querySelector('.question-input');
  const typeSelect = card.querySelector('.question-type-select');
  const requiredCheckbox = card.querySelector('.required-toggle input');
  const deleteBtn = card.querySelector('.delete-question-btn');
  const optionsContainer = card.querySelector('.question-options');

  questionInput.addEventListener('input', (e) => {
    updateQuestion(question.id, { title: e.target.value });
  });

  typeSelect.addEventListener('change', (e) => {
    const newType = e.target.value;
    updateQuestion(question.id, { type: newType });
    question.type = newType;

    if (newType === 'short-text' || newType === 'long-text') {
      question.options = [];
    } else if (question.options.length === 0) {
      question.options = ['Option 1'];
    }

    renderQuestionOptions(question, optionsContainer);
  });

  requiredCheckbox.addEventListener('change', (e) => {
    updateQuestion(question.id, { required: e.target.checked });
  });

  deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this question?')) {
      card.remove();
      formData.questions = formData.questions.filter(q => q.id !== question.id);
    }
  });

  setupDragAndDrop(card);

  renderQuestionOptions(question, optionsContainer);

  return card;
}

function renderQuestionOptions(question, container) {
  container.innerHTML = '';

  if (question.type === 'short-text') {
    container.innerHTML = '<input type="text" class="preview-input" placeholder="Short answer text" disabled>';
  } else if (question.type === 'long-text') {
    container.innerHTML = '<textarea class="preview-input preview-textarea" placeholder="Long answer text" disabled></textarea>';
  } else {
    const inputType = question.type === 'multiple-choice' ? 'radio' : 'checkbox';

    question.options.forEach((option, index) => {
      const optionItem = document.createElement('div');
      optionItem.className = 'option-item';

      optionItem.innerHTML = `
        <input type="${inputType}" disabled>
        <input
          type="text"
          class="option-input"
          placeholder="Option ${index + 1}"
          value="${option}"
          data-option-index="${index}"
        >
        <button class="remove-option-btn" data-option-index="${index}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      const optionInput = optionItem.querySelector('.option-input');
      optionInput.addEventListener('input', (e) => {
        question.options[index] = e.target.value;
        updateQuestion(question.id, { options: question.options });
      });

      const removeBtn = optionItem.querySelector('.remove-option-btn');
      removeBtn.addEventListener('click', () => {
        if (question.options.length > 1) {
          question.options.splice(index, 1);
          updateQuestion(question.id, { options: question.options });
          renderQuestionOptions(question, container);
        } else {
          showToast('At least one option is required');
        }
      });

      container.appendChild(optionItem);
    });

    const addOptionBtn = document.createElement('button');
    addOptionBtn.className = 'add-option-btn';
    addOptionBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add option
    `;

    addOptionBtn.addEventListener('click', () => {
      question.options.push(`Option ${question.options.length + 1}`);
      updateQuestion(question.id, { options: question.options });
      renderQuestionOptions(question, container);
    });

    container.appendChild(addOptionBtn);
  }
}

function setupDragAndDrop(card) {
  card.addEventListener('dragstart', (e) => {
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', card.innerHTML);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.question-card').forEach(c => {
      c.classList.remove('drag-over');
    });
  });

  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingCard = document.querySelector('.dragging');

    if (draggingCard && draggingCard !== card) {
      card.classList.add('drag-over');

      const rect = card.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (e.clientY < midpoint) {
        questionsContainer.insertBefore(draggingCard, card);
      } else {
        questionsContainer.insertBefore(draggingCard, card.nextSibling);
      }
    }
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    updateQuestionsOrder();
  });
}

function updateQuestionsOrder() {
  const cards = Array.from(questionsContainer.querySelectorAll('.question-card'));
  const newOrder = cards.map(card => {
    const id = parseInt(card.dataset.questionId);
    return formData.questions.find(q => q.id === id);
  }).filter(Boolean);

  formData.questions = newOrder;
}

function updateQuestion(id, updates) {
  const question = formData.questions.find(q => q.id === id);
  if (question) {
    Object.assign(question, updates);
  }
}

function saveDraft() {
  formData.title = formTitle.value;
  formData.description = formDescription.value;

  try {
    localStorage.setItem('formDraft', JSON.stringify(formData));
    return true;
  } catch (error) {
    console.error('Error saving draft:', error);
    showToast('Error saving draft');
    return false;
  }
}

function loadDraft() {
  try {
    const draft = localStorage.getItem('formDraft');
    if (draft) {
      formData = JSON.parse(draft);
      formTitle.value = formData.title || '';
      formDescription.value = formData.description || '';

      if (formData.questions && formData.questions.length > 0) {
        questionIdCounter = Math.max(...formData.questions.map(q => q.id));
        formData.questions.forEach(question => {
          addQuestion(question.type, question);
        });
      }
    }
  } catch (error) {
    console.error('Error loading draft:', error);
  }
}

function showPreview() {
  formData.title = formTitle.value;
  formData.description = formDescription.value;

  if (!formData.title.trim()) {
    showToast('Please add a form title');
    return;
  }

  if (formData.questions.length === 0) {
    showToast('Please add at least one question');
    return;
  }

  let previewHTML = `
    <div class="preview-form-header">
      <h1 class="preview-form-title">${escapeHtml(formData.title)}</h1>
      ${formData.description ? `<p class="preview-form-description">${escapeHtml(formData.description)}</p>` : ''}
    </div>
  `;

  formData.questions.forEach((question, index) => {
    const requiredMark = question.required ? '<span class="required">*</span>' : '';

    previewHTML += `
      <div class="preview-question">
        <div class="preview-question-title">
          ${index + 1}. ${escapeHtml(question.title) || 'Untitled Question'}${requiredMark}
        </div>
    `;

    if (question.type === 'short-text') {
      previewHTML += '<input type="text" class="preview-input" placeholder="Your answer">';
    } else if (question.type === 'long-text') {
      previewHTML += '<textarea class="preview-input preview-textarea" placeholder="Your answer"></textarea>';
    } else if (question.type === 'dropdown') {
      previewHTML += '<select class="preview-select"><option value="">Choose</option>';
      question.options.forEach(option => {
        previewHTML += `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`;
      });
      previewHTML += '</select>';
    } else {
      const inputType = question.type === 'multiple-choice' ? 'radio' : 'checkbox';
      const name = `question-${question.id}`;

      question.options.forEach((option, optIndex) => {
        previewHTML += `
          <div class="preview-option">
            <input type="${inputType}" id="${name}-${optIndex}" name="${name}" value="${escapeHtml(option)}">
            <label for="${name}-${optIndex}">${escapeHtml(option)}</label>
          </div>
        `;
      });
    }

    previewHTML += '</div>';
  });

  previewContent.innerHTML = previewHTML;
  previewModal.classList.remove('hidden');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createSampleQuestions() {
  const sampleQuestions = [
    {
      type: 'short-text',
      title: 'What is your name?',
      required: true
    },
    {
      type: 'multiple-choice',
      title: 'How would you rate your overall experience?',
      required: true,
      options: ['Excellent', 'Good', 'Average', 'Poor']
    },
    {
      type: 'checkbox',
      title: 'Which features did you find most useful?',
      required: false,
      options: ['User Interface', 'Performance', 'Documentation', 'Customer Support']
    },
    {
      type: 'long-text',
      title: 'Do you have any additional comments or suggestions?',
      required: false
    }
  ];

  sampleQuestions.forEach(q => {
    addQuestion(q.type, {
      id: ++questionIdCounter,
      ...q
    });
  });
}

window.addEventListener('beforeunload', () => {
  saveDraft();
});
