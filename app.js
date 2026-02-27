/**
 * TASKFLOW - Gestionnaire de tâches moderne
 * Architecture modulaire ES6+
 */

// ==========================================================================
// CONFIGURATION & ÉTAT
// ==========================================================================
const CONFIG = {
    // On utilise LoremFlickr qui permet de chercher par mots-clés
    IMAGE_API_URL: 'https://loremflickr.com/300/200', 
    STORAGE_KEY: 'taskflow_data_v2',
    MAX_IMAGES:  3,
    NOTIFICATION_DURATION: 3000
};

const State = {
    tasks: [],
    currentFilter: 'all',
    currentPriority: 'normale',
    notificationTimeout: null,
    wasJustCompleted: false
};

// Références DOM (inchangé)
const DOM = {
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
    clearCompleted: document.getElementById('clearCompleted'),
    liveClock:      document.getElementById('liveClock')
};

// ==========================================================================
// UTILITAIRES
// ==========================================================================

// Échappement HTML
const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Extraction de mots-clés intelligents pour la recherche d'images
const extractKeywords = (text) => {
    // Mots "poubelles" à ignorer pour avoir des images pertinentes
    const stopWords = new Set(['le','la','les','un','une','des','de','du','pour','avec','sans','sur','dans','et','ou','mais','donc','or','ni','car','faire','travailler','projet','projets','tache']);
    
    const words = text.toLowerCase()
        // Garde les lettres, chiffres et accents français
        .replace(/[^\w\sàâäéèêëîïôöùûüç-]/g, '') 
        .split(/\s+/)
        // Ne garde que les mots de plus de 3 lettres qui ne sont pas dans les stopWords
        .filter(w => w.length > 3 && !stopWords.has(w));
    
    // On garde les 2 mots les plus pertinents, séparés par une virgule pour LoremFlickr
    return words.slice(0, 2).join(',') || 'business,work';
};

// Génération d'URL d'images dynamiques basées sur le champ lexical
const generateImages = (text) => {
    const keywords = extractKeywords(text);
    const seed = Date.now(); // Permet d'avoir des images différentes à chaque fois
    
    // Crée 3 URLs avec le mot clé. L'argument "lock" permet d'avoir 3 images différentes de la même catégorie
    return Array.from({ length: CONFIG.MAX_IMAGES }, (_, i) => 
        `${CONFIG.IMAGE_API_URL}/${encodeURIComponent(keywords)}?lock=${seed + i}`
    );
};

// Système de notification (Toast)
const showNotification = (message, type = 'success') => {
    if (State.notificationTimeout) clearTimeout(State.notificationTimeout);
    
    // Icônes dynamiques selon le type
    const icons = {
        success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
    };

    DOM.notification.innerHTML = `${icons[type] || icons.success} <span>${escapeHtml(message)}</span>`;
    DOM.notification.className = `notification ${type} show`;
    
    State.notificationTimeout = setTimeout(() => {
        DOM.notification.classList.remove('show');
    }, CONFIG.NOTIFICATION_DURATION);
};

// Confettis en pur JS (Effet Premium)
const fireConfetti = () => {
    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.top = `-10px`;
        confetti.style.width = `${Math.random() * 8 + 6}px`;
        confetti.style.height = `${Math.random() * 4 + 4}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        confetti.style.zIndex = '99999';
        confetti.style.pointerEvents = 'none';
        confetti.style.transition = `transform ${Math.random() * 2 + 1}s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${Math.random() * 2 + 1}s ease`;
        
        document.body.appendChild(confetti);

        // Déclencher l'animation
        requestAnimationFrame(() => {
            confetti.style.transform = `translate3d(${Math.random() * 300 - 150}px, ${window.innerHeight + 50}px, 0) rotate(${Math.random() * 720}deg)`;
            confetti.style.opacity = '0';
        });

        // Nettoyage
        setTimeout(() => confetti.remove(), 3000);
    }
};

// ==========================================================================
// GESTION DES DONNÉES (LocalStorage)
// ==========================================================================
const loadTasks = () => {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        State.tasks = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Erreur lors du chargement des tâches", e);
        State.tasks = [];
    }
};

const saveTasks = () => {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(State.tasks));
    } catch (e) {
        showNotification('Erreur lors de la sauvegarde.', 'error');
    }
};

// ==========================================================================
// LOGIQUE MÉTIER & AFFICHAGE
// ==========================================================================

// Horloge intelligente
const startClock = () => {
    const formatter = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
    });
    
    const tick = () => {
        DOM.liveClock.textContent = formatter.format(new Date()).replace(',', ' -');
    };
    
    tick();
    setInterval(tick, 30000); // Mise à jour toutes les 30s (pas besoin de la seconde)
};

// Mise à jour des statistiques et de la barre de progression
const updateStats = () => {
    const total = State.tasks.length;
    const completed = State.tasks.filter(t => t.completed).length;
    const active = total - completed;
    const urgent = State.tasks.filter(t => t.priority === 'urgent' && !t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Mise à jour du DOM
    DOM.totalTasks.textContent = total;
    DOM.activeTasks.textContent = active;
    DOM.completedTasks.textContent = completed;
    DOM.urgentTasks.textContent = urgent;

    DOM.progressBar.style.width = `${pct}%`;
    DOM.progressLabel.textContent = `${pct} % accompli`;
    DOM.progressWrapper.setAttribute('aria-valuenow', pct);

    // Effet "Waouh" : 100% accompli
    if (pct === 100 && total > 0) {
        DOM.progressLabel.textContent = `🎉 100 % accompli !`;
        DOM.progressBar.style.boxShadow = "0 0 15px rgba(16, 185, 129, 0.8)";
        DOM.progressBar.style.background = "var(--color-success)";
        if (!State.wasJustCompleted) {
            fireConfetti();
            showNotification("Félicitations ! Toutes vos tâches sont terminées.", "success");
            State.wasJustCompleted = true;
        }
    } else {
        DOM.progressBar.style.boxShadow = "";
        DOM.progressBar.style.background = "";
        State.wasJustCompleted = false;
    }
};

// Gestion de l'état vide (Empty State)
const toggleEmptyState = () => {
    const filtered = getFilteredTasks();
    const show = filtered.length === 0;

    const messages = {
        all:       { title: 'Aucune tâche pour le moment', msg: 'Commencez par ajouter votre première tâche ci-dessus.' },
        active:    { title: 'Toutes les tâches sont terminées !', msg: 'Bien joué, vous êtes à jour. Prenez un café ☕' },
        completed: { title: 'Aucune tâche terminée', msg: 'Cochez une tâche pour la voir apparaître ici.' },
        urgent:    { title: 'Aucune urgence', msg: 'Pas de stress en vue, profitez-en !' }
    };

    DOM.emptyState.style.display = show ? 'block' : 'none';
    DOM.taskList.style.display = show ? 'none' : 'block';

    if (show) {
        const msg = messages[State.currentFilter] || messages.all;
        DOM.emptyTitle.textContent = msg.title;
        DOM.emptyMessage.textContent = msg.msg;
    }
};

// Calcul des badges de date
const getDueBadge = (dueDate, completed) => {
    if (!dueDate || completed) return null;

    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dueDate); due.setHours(0,0,0,0);
    const diffDays = Math.round((due - today) / 86400000);

    if (diffDays < 0) return { text: 'En retard', cls: 'overdue' };
    if (diffDays === 0) return { text: "Aujourd'hui", cls: 'today' };
    if (diffDays === 1) return { text: 'Demain', cls: 'tomorrow' };
    return { text: `Dans ${diffDays} j`, cls: 'upcoming' };
};

// Filtrage
const getFilteredTasks = () => {
    switch (State.currentFilter) {
        case 'active':    return State.tasks.filter(t => !t.completed);
        case 'completed': return State.tasks.filter(t => t.completed);
        case 'urgent':    return State.tasks.filter(t => t.priority === 'urgent' && !t.completed);
        default:          return State.tasks;
    }
};

// ==========================================================================
// CRÉATION ET GESTION DES TÂCHES (DOM)
// ==========================================================================

const createTaskElement = (task) => {
    const li = document.createElement('li');
    const isOverdue = task.dueDate && !task.completed && (new Date(task.dueDate) < new Date().setHours(0,0,0,0));
    
    li.className = `task-item priority-${task.priority} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
    li.dataset.id = task.id;

    const dueInfo = getDueBadge(task.dueDate, task.completed);
    const dateCreee = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(task.createdAt));

    let imagesHtml = '';
    if (task.images?.length > 0) {
        imagesHtml = `<div class="task-image-container">
            ${task.images.map(src => `<img src="${src}" alt="Preuve de complétion" class="task-image" loading="lazy">`).join('')}
        </div>`;
    }

    // Utilisation des Template Literals pour une structure claire
    li.innerHTML = `
        <button class="task-checkbox ${task.completed ? 'checked' : ''}" role="checkbox" aria-checked="${task.completed}" aria-label="Marquer comme terminé"></button>
        <div class="task-content">
            <div class="task-header">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="badge-priority badge-${task.priority}">${task.priority}</span>
                ${dueInfo ? `<span class="badge-due ${dueInfo.cls}">${dueInfo.text}</span>` : ''}
            </div>
            <div class="task-meta">Ajoutée le ${dateCreee}</div>
            ${imagesHtml}
        </div>
        <div class="task-actions">
            <button class="btn-icon btn-edit" aria-label="Modifier la tâche" title="Modifier">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon btn-delete" aria-label="Supprimer la tâche" title="Supprimer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    `;

    // Attachement des événements
    li.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(task.id));
    li.querySelector('.btn-edit').addEventListener('click', () => editTask(task.id));
    li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));
    
    // Zoom sur les images
    li.querySelectorAll('.task-image').forEach(img => {
        img.addEventListener('click', () => openModal(img.src));
    });

    return li;
};

const renderTasks = () => {
    DOM.taskList.innerHTML = '';
    getFilteredTasks().forEach(task => {
        DOM.taskList.appendChild(createTaskElement(task));
    });
    toggleEmptyState();
    updateStats();
};

// ==========================================================================
// ACTIONS (Ajouter, Modifier, Supprimer)
// ==========================================================================

const addTask = (text, dueDate, priority) => {
    const newTask = {
        id: Date.now().toString(),
        text: text.trim(),
        priority: priority || 'normale',
        dueDate: dueDate || null,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        images: []
    };
    
    State.tasks.unshift(newTask); // Ajoute au début
    saveTasks();
    renderTasks();
    showNotification('Tâche ajoutée avec succès !');
};

const toggleTask = (id) => {
    const task = State.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    if (task.completed) {
        task.images = generateImages(task.text);
        showNotification('Tâche terminée, bien joué !', 'success');
    } else {
        task.images = []; // On enlève les images si on décoche
    }

    saveTasks();
    renderTasks();
};

const editTask = (id) => {
    const task = State.tasks.find(t => t.id === id);
    if (!task) return;

    const li = document.querySelector(`[data-id="${id}"]`);
    const textSpan = li.querySelector('.task-text');
    const originalText = task.text;

    // Remplacement par un input
    textSpan.innerHTML = `<input class="task-edit-input" type="text" value="${escapeHtml(originalText)}" maxlength="120">`;
    const input = textSpan.querySelector('.task-edit-input');
    
    input.focus();
    // Placer le curseur à la fin du texte
    input.setSelectionRange(input.value.length, input.value.length);

    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            task.text = newText;
            saveTasks();
            showNotification('Tâche mise à jour.');
        }
        renderTasks(); // Re-rend l'élément dans tous les cas
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); } // Blur déclenche saveEdit
        if (e.key === 'Escape') { renderTasks(); } // Annuler
    });
    input.addEventListener('blur', saveEdit);
};

const deleteTask = (id) => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
        el.classList.add('deleting');
        // On attend la fin de l'animation CSS (0.3s) avant de retirer du DOM
        setTimeout(() => {
            State.tasks = State.tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            showNotification('Tâche supprimée.', 'warning');
        }, 300);
    }
};

const clearCompleted = () => {
    const count = State.tasks.filter(t => t.completed).length;
    if (count === 0) {
        showNotification('Aucune tâche terminée à nettoyer.', 'warning');
        return;
    }
    
    // Animation de suppression pour toutes les tâches terminées visibles
    const completedEls = document.querySelectorAll('.task-item.completed');
    completedEls.forEach(el => el.classList.add('deleting'));

    setTimeout(() => {
        State.tasks = State.tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        showNotification(`${count} tâche(s) nettoyée(s).`, 'success');
    }, 300);
};

// ==========================================================================
// MODALE D'IMAGE & FILTRES
// ==========================================================================

const openModal = (src) => {
    DOM.modalImage.src = src;
    DOM.imageModal.classList.add('active');
    DOM.imageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Empêche le scroll en arrière-plan
};

const closeModal = () => {
    DOM.imageModal.classList.remove('active');
    DOM.imageModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
};

const setFilter = (filter) => {
    State.currentFilter = filter;
    DOM.filterBtns.forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    renderTasks();
};

// ==========================================================================
// INITIALISATION ET ÉCOUTEURS D'ÉVÉNEMENTS
// ==========================================================================

const init = () => {
    loadTasks();
    startClock();
    renderTasks();

    // 1. Ajout de tâche
    DOM.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = DOM.taskInput.value.trim();
        const dueDate = DOM.dateInput.value;
        
        if (!text) return;

        // Avertissement si la date est dans le passé
        if (dueDate) {
            const due = new Date(dueDate).setHours(0,0,0,0);
            const today = new Date().setHours(0,0,0,0);
            if (due < today) {
                showNotification('Attention : la date choisie est déjà passée.', 'warning');
            }
        }

        addTask(text, dueDate, State.currentPriority);
        
        // Reset du formulaire
        DOM.taskInput.value = '';
        DOM.dateInput.value = '';
        DOM.taskInput.focus();
    });

    // 2. Sélection de priorité
    DOM.priorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            DOM.priorityBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            State.currentPriority = btn.dataset.priority;
        });
    });

    // 3. Filtres
    DOM.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // 4. Nettoyage
    DOM.clearCompleted.addEventListener('click', clearCompleted);

    // 5. Gestion de la modale (Fermeture)
    DOM.modalClose.addEventListener('click', closeModal);
    DOM.imageModal.addEventListener('click', (e) => {
        if (e.target === DOM.imageModal) closeModal(); // Clic à l'extérieur
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.imageModal.classList.contains('active')) {
            closeModal();
        }
    });

    // 6. Message de bienvenue
    if (State.tasks.length === 0) {
        setTimeout(() => {
            showNotification('Bienvenue sur TaskFlow ! Prêt à être productif ?');
        }, 500);
    }
};

// Lancement de l'application
document.addEventListener('DOMContentLoaded', init);