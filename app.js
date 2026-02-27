// Configuration
const CONFIG = {
    PICSUM_URL:  'https://picsum.photos/seed',
    STORAGE_KEY: 'taskflow_tasks',
    MAX_IMAGES:  3
};

// Etat global
let tasks          = [];
let currentFilter  = 'all';
let currentPriority = 'normale';

// Références DOM
const elements = {
    taskForm:       document.getElementById('taskForm'),
    taskInput:      document.getElementById('taskInput'),
    dateInput:      document.getElementById('dateInput'),
    taskList:       document.getElementById('taskList'),
    emptyState:     document.getElementById('emptyState'),
    emptyTitle:     document.getElementById('emptyTitle'),
    emptyMessage:   document.getElementById('emptyMessage'),
    filterBtns:     document.querySelectorAll('.filter-btn'),
    priorityBtns:   document.querySelectorAll('.priority-btn'),
    totalTasks:     document.getElementById('totalTasks'),
    activeTasks:    document.getElementById('activeTasks'),
    completedTasks: document.getElementById('completedTasks'),
    urgentTasks:    document.getElementById('urgentTasks'),
    progressBar:    document.getElementById('progressBar'),
    progressLabel:  document.getElementById('progressLabel'),
    progressWrapper:document.getElementById('progressBarWrapper'),
    imageModal:     document.getElementById('imageModal'),
    modalImage:     document.getElementById('modalImage'),
    modalClose:     document.getElementById('modalClose'),
    notification:   document.getElementById('notification'),
    addBtn:         document.getElementById('addBtn'),
    clearCompleted: document.getElementById('clearCompleted'),
    liveClock:      document.getElementById('liveClock')
};

// ---- LOCALSTORAGE ----

function loadTasks() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        tasks = stored ? JSON.parse(stored) : [];
    } catch (e) {
        tasks = [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        showNotification('Erreur de sauvegarde.', 'error');
    }
}

// ---- HORLOGE EN DIRECT ----

function startClock() {
    function tick() {
        var now  = new Date();
        var jour = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
        var heure = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        elements.liveClock.textContent = jour + '  ' + heure;
    }
    tick();
    setInterval(tick, 1000);
}

// ---- NOTIFICATIONS ----

function showNotification(message, type) {
    var t = type || 'success';
    elements.notification.textContent = message;
    elements.notification.className = 'notification ' + t + ' show';
    setTimeout(function () {
        elements.notification.classList.remove('show');
    }, 3000);
}

// ---- STATISTIQUES ET PROGRESSION ----

function updateStats() {
    var total     = tasks.length;
    var completed = tasks.filter(function (t) { return t.completed; }).length;
    var active    = total - completed;
    var urgent    = tasks.filter(function (t) { return t.priority === 'urgent' && !t.completed; }).length;
    var pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

    elements.totalTasks.textContent     = total;
    elements.activeTasks.textContent    = active;
    elements.completedTasks.textContent = completed;
    elements.urgentTasks.textContent    = urgent;

    elements.progressBar.style.width = pct + '%';
    elements.progressLabel.textContent = pct + ' % accompli';
    elements.progressWrapper.setAttribute('aria-valuenow', pct);
}

// ---- ETAT VIDE ----

var emptyMessages = {
    all:       { title: 'Aucune tâche pour le moment',        msg: 'Commencez par ajouter votre première tâche ci-dessus.' },
    active:    { title: 'Toutes les tâches sont terminées !', msg: 'Bien joué, vous êtes à jour.' },
    completed: { title: 'Aucune tâche terminée',              msg: 'Cochez une tâche pour la voir apparaître ici.' },
    urgent:    { title: 'Aucune tâche urgente',               msg: 'Pas d\'urgence en vue, profitez-en !' }
};

function toggleEmptyState() {
    var filtered = getFilteredTasks();
    var show     = filtered.length === 0;

    elements.emptyState.style.display  = show ? 'block' : 'none';
    elements.taskList.style.display    = show ? 'none'  : 'block';

    if (show) {
        var msg = emptyMessages[currentFilter] || emptyMessages.all;
        elements.emptyTitle.textContent   = msg.title;
        elements.emptyMessage.textContent = msg.msg;
    }
}

// ---- FILTRAGE ----

function getFilteredTasks() {
    if (currentFilter === 'active')    return tasks.filter(function (t) { return !t.completed; });
    if (currentFilter === 'completed') return tasks.filter(function (t) { return t.completed; });
    if (currentFilter === 'urgent')    return tasks.filter(function (t) { return t.priority === 'urgent' && !t.completed; });
    return tasks;
}

// ---- DATE D'ECHEANCE ----

function getDueBadge(dueDate, completed) {
    if (!dueDate || completed) return null;

    var today    = new Date(); today.setHours(0,0,0,0);
    var due      = new Date(dueDate); due.setHours(0,0,0,0);
    var diffDays = Math.round((due - today) / 86400000);

    if (diffDays < 0)  return { text: 'En retard',           cls: 'overdue' };
    if (diffDays === 0) return { text: 'Aujourd\'hui',        cls: 'today' };
    if (diffDays === 1) return { text: 'Demain',              cls: 'tomorrow' };
    return               { text: 'Dans ' + diffDays + ' j',  cls: 'upcoming' };
}

// ---- SECURITE HTML ----

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---- IMAGES DYNAMIQUES ----

function generateImages(text) {
    var keyword = extractKeywords(text).split(' ')[0] || 'work';
    var seed    = Date.now();
    var imgs    = [];
    for (var i = 0; i < CONFIG.MAX_IMAGES; i++) {
        imgs.push(CONFIG.PICSUM_URL + '/' + keyword + (seed + i) + '/200/200');
    }
    return imgs;
}

function extractKeywords(text) {
    var stopWords = ['le','la','les','un','une','des','de','du','pour','avec','sans','sur','dans','et','ou','mais','donc','or','ni','car'];
    var words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(function (w) { return w.length > 2 && !stopWords.includes(w); });
    return words.slice(0, 3).join(' ') || text.slice(0, 20);
}

// ---- CREATION D'UN ELEMENT TACHE ----

function createTaskElement(task) {
    var li       = document.createElement('li');
    var isOverdue = task.dueDate && !task.completed && (new Date(task.dueDate) < new Date().setHours(0,0,0,0));
    var classes  = ['task-item', 'priority-' + (task.priority || 'normale')];
    if (task.completed) classes.push('completed');
    if (isOverdue)      classes.push('overdue');
    li.className = classes.join(' ');
    li.dataset.id = task.id;

    // Badge priorité
    var badgePriority = '<span class="badge-priority badge-' + task.priority + '">' + task.priority + '</span>';

    // Badge échéance
    var badgeDue = '';
    var dueInfo  = getDueBadge(task.dueDate, task.completed);
    if (dueInfo) {
        badgeDue = '<span class="badge-due ' + dueInfo.cls + '">' + dueInfo.text + '</span>';
    }

    // Date de création
    var dateCreee = new Date(task.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    // Images
    var imagesHtml = '';
    if (task.images && task.images.length > 0) {
        var imgTags = task.images.map(function (src) {
            return '<img src="' + src + '" alt="Image associée à la tâche" class="task-image" loading="lazy">';
        }).join('');
        imagesHtml = '<div class="task-image-container">' + imgTags + '</div>';
    }

    li.innerHTML =
        '<div class="task-checkbox ' + (task.completed ? 'checked' : '') + '"' +
            ' role="checkbox" aria-checked="' + task.completed + '" tabindex="0"></div>' +
        '<div class="task-content">' +
            '<div class="task-header">' +
                '<span class="task-text">' + escapeHtml(task.text) + '</span>' +
                badgePriority +
                badgeDue +
            '</div>' +
            '<div class="task-meta">Ajoutée le ' + dateCreee + '</div>' +
            imagesHtml +
        '</div>' +
        '<div class="task-actions">' +
            '<button class="btn-icon btn-edit" aria-label="Modifier la tâche">' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                    '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>' +
                    '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>' +
                '</svg>' +
            '</button>' +
            '<button class="btn-icon btn-delete" aria-label="Supprimer la tâche">' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                    '<polyline points="3 6 5 6 21 6"></polyline>' +
                    '<path d="M19 6l-1 14H6L5 6"></path>' +
                    '<path d="M10 11v6M14 11v6"></path>' +
                    '<path d="M9 6V4h6v2"></path>' +
                '</svg>' +
            '</button>' +
        '</div>';

    // Checkbox
    var checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('click', function () { toggleTask(task.id); });
    checkbox.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTask(task.id); }
    });

    // Bouton éditer
    var editBtn = li.querySelector('.btn-edit');
    editBtn.addEventListener('click', function () { editTask(task.id); });

    // Bouton supprimer
    var deleteBtn = li.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', function () { deleteTask(task.id); });

    // Clic sur les images
    var images = li.querySelectorAll('.task-image');
    images.forEach(function (img) {
        img.addEventListener('click', function () { openModal(img.src); });
    });

    return li;
}

// ---- AFFICHAGE ----

function renderTasks() {
    elements.taskList.innerHTML = '';
    getFilteredTasks().forEach(function (task) {
        elements.taskList.appendChild(createTaskElement(task));
    });
    toggleEmptyState();
    updateStats();
}

// ---- AJOUTER ----

function addTask(text, dueDate, priority) {
    var task = {
        id:          Date.now().toString(),
        text:        text.trim(),
        priority:    priority || 'normale',
        dueDate:     dueDate || null,
        completed:   false,
        createdAt:   new Date().toISOString(),
        completedAt: null,
        images:      []
    };
    tasks.unshift(task);
    saveTasks();
    renderTasks();
    showNotification('Tâche ajoutée.');
}

// ---- COCHER / DECOCHER ----

function toggleTask(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    task.completed   = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    if (task.completed) {
        task.images = generateImages(task.text);
        showNotification('Tâche marquée comme terminée.', 'success');
    } else {
        task.images = [];
    }

    saveTasks();
    renderTasks();
}

// ---- MODIFIER (édition inline) ----

function editTask(id) {
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    var li       = document.querySelector('[data-id="' + id + '"]');
    var textSpan = li.querySelector('.task-text');
    var original = task.text;

    // Remplacer le texte par un champ d'édition
    textSpan.innerHTML = '<input class="task-edit-input" type="text" value="' + escapeHtml(original) + '" maxlength="120">';
    var input = textSpan.querySelector('.task-edit-input');
    input.focus();
    input.select();

    function saveEdit() {
        var newText = input.value.trim();
        if (newText && newText !== original) {
            task.text = newText;
            saveTasks();
            showNotification('Tâche modifiée.', 'success');
        }
        renderTasks();
    }

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter')  { e.preventDefault(); saveEdit(); }
        if (e.key === 'Escape') { renderTasks(); }
    });
    input.addEventListener('blur', saveEdit);
}

// ---- SUPPRIMER ----

function deleteTask(id) {
    var el = document.querySelector('[data-id="' + id + '"]');
    if (el) {
        el.classList.add('deleting');
        setTimeout(function () {
            tasks = tasks.filter(function (t) { return t.id !== id; });
            saveTasks();
            renderTasks();
            showNotification('Tâche supprimée.', 'success');
        }, 300);
    }
}

// ---- VIDER LES TÂCHES TERMINÉES ----

function clearCompleted() {
    var count = tasks.filter(function (t) { return t.completed; }).length;
    if (count === 0) {
        showNotification('Aucune tâche terminée à supprimer.', 'warning');
        return;
    }
    tasks = tasks.filter(function (t) { return !t.completed; });
    saveTasks();
    renderTasks();
    showNotification(count + ' tâche(s) supprimée(s).', 'success');
}

// ---- MODALE ----

function openModal(src) {
    elements.modalImage.src = src;
    elements.imageModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.imageModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ---- CHANGER LE FILTRE ----

function setFilter(filter) {
    currentFilter = filter;
    elements.filterBtns.forEach(function (btn) {
        var active = btn.dataset.filter === filter;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active);
    });
    renderTasks();
}

// ---- INITIALISATION ----

function init() {
    loadTasks();
    startClock();
    renderTasks();

    // Soumission du formulaire
    elements.taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var text    = elements.taskInput.value.trim();
        var dueDate = elements.dateInput.value;
        if (!text) return;

        // Avertir si la date est dans le passé
        if (dueDate) {
            var due   = new Date(dueDate); due.setHours(0,0,0,0);
            var today = new Date();        today.setHours(0,0,0,0);
            if (due < today) {
                showNotification('Attention : la date choisie est déjà passée.', 'warning');
            }
        }

        addTask(text, dueDate, currentPriority);
        elements.taskInput.value = '';
        elements.dateInput.value = '';
        elements.taskInput.focus();
    });

    // Sélection de la priorité
    elements.priorityBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            elements.priorityBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentPriority = btn.dataset.priority;
        });
    });

    // Filtres
    elements.filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () { setFilter(btn.dataset.filter); });
    });

    // Vider terminées
    elements.clearCompleted.addEventListener('click', clearCompleted);

    // Fermeture de la modale
    elements.modalClose.addEventListener('click', closeModal);
    elements.imageModal.addEventListener('click', function (e) {
        if (e.target === elements.imageModal) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && elements.imageModal.classList.contains('active')) closeModal();
    });

    // Message de bienvenue
    if (tasks.length === 0) {
        showNotification('Bienvenue sur TaskFlow ! Ajoutez votre première tâche.');
    }
}

document.addEventListener('DOMContentLoaded', init);
