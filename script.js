const TASKS_STORAGE_KEY = "todo_tasks";
const THEME_STORAGE_KEY = "todo_theme";

let tasks = [];
let currentEditId = null;
let focusTodayMode = false;

 
const body = document.body;

const taskForm = document.getElementById("taskForm");
const formTitle = document.getElementById("formTitle");
const taskSubmitBtn = document.getElementById("taskSubmit");
const cancelEditBtn = document.getElementById("cancelEdit");

const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const titleError = document.getElementById("titleError");

const filterCategorySelect = document.getElementById("filterCategory");
const filterPrioritySelect = document.getElementById("filterPriority");
const filterStatusSelect = document.getElementById("filterStatus");
const searchInput = document.getElementById("searchInput");

const totalTasksSpan = document.getElementById("totalTasks");
const completedTasksSpan = document.getElementById("completedTasks");
const activeTasksSpan = document.getElementById("activeTasks");

const completedBar = document.getElementById("completedBar");
const activeBar = document.getElementById("activeBar");

const taskListEl = document.getElementById("taskList");
const emptyStateEl = document.getElementById("emptyState");

const themeToggleBtn = document.getElementById("themeToggle");
const focusTodayToggleBtn = document.getElementById("focusTodayToggle");
const heroQuoteEl = document.getElementById("heroQuote");
const heroNextTaskEl = document.getElementById("heroNextTask");
const clearCompletedBtn = document.getElementById("clearCompleted");

 
function loadTasksFromLocalStorage() {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    tasks = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load tasks:", e);
    tasks = [];
  }
}

function saveTasksToLocalStorage() {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function loadThemeFromLocalStorage() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const theme = storedTheme === "dark" ? "dark" : "light";  
  setTheme(theme);
}

function saveThemeToLocalStorage(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

 
function setTheme(theme) {
  body.classList.remove("light-theme", "dark-theme");
  if (theme === "dark") {
    body.classList.add("dark-theme");
    if (themeToggleBtn) themeToggleBtn.textContent = "☀️ Light Mode";
  } else {
    body.classList.add("light-theme");
    if (themeToggleBtn) themeToggleBtn.textContent = "🌙 Dark Mode";
  }
}

function toggleTheme() {
  const isDark = body.classList.contains("dark-theme");
  const newTheme = isDark ? "light" : "dark";
  setTheme(newTheme);
  saveThemeToLocalStorage(newTheme);
}

 
function initHeroQuote() {
  if (!heroQuoteEl) return;
  const quotes = [
    "Small progress is still progress.",
    "Your future is built by what you do today.",
    "Done is better than perfect.",
    "Focus on the next right step.",
    "Big results start with small consistent actions.",
  ];
  const idx = Math.floor(Math.random() * quotes.length);
  heroQuoteEl.textContent = `"${quotes[idx]}"`;
}

 
function createTaskObject() {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const category = categoryInput.value;
  const priority = priorityInput.value;
  const dueDateValue = dueDateInput.value || null;  

  if (!title) {
    titleError.textContent = "Title is required.";
    return null;
  }
  titleError.textContent = "";

  const now = new Date();
  return {
    id: currentEditId || Date.now().toString(),
    title,
    description,
    category,
    priority,
    completed: false,
    createdAt: now.toISOString(),
    dueDate: dueDateValue,
  };
}

function resetForm() {
  taskForm.reset();
  titleError.textContent = "";
  currentEditId = null;
  formTitle.textContent = "Add New Task";
  taskSubmitBtn.textContent = "Add Task";
  cancelEditBtn.classList.add("hidden");
  categoryInput.value = "Personal";
  priorityInput.value = "Medium";
}

function addTask(task) {
  tasks.push(task);
  saveTasksToLocalStorage();
  renderAll();
}

function updateTask(updatedTask) {
  tasks = tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
  saveTasksToLocalStorage();
  renderAll();
}

function deleteTask(id) {
  const confirmed = confirm("Are you sure you want to delete this task?");
  if (!confirmed) return;
  tasks = tasks.filter((t) => t.id !== id);
  saveTasksToLocalStorage();
  renderAll();
}

function toggleTaskCompleted(id) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  saveTasksToLocalStorage();
  renderAll();
}

function startEditTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  currentEditId = id;
  titleInput.value = task.title;
  descriptionInput.value = task.description || "";
  categoryInput.value = task.category;
  priorityInput.value = task.priority;
  dueDateInput.value = task.dueDate || "";

  formTitle.textContent = "Edit Task";
  taskSubmitBtn.textContent = "Update Task";
  cancelEditBtn.classList.remove("hidden");
}

function clearCompletedTasks() {
  const hasCompleted = tasks.some((t) => t.completed);
  if (!hasCompleted) return;
  const confirmed = confirm("Delete all completed tasks?");
  if (!confirmed) return;
  tasks = tasks.filter((t) => !t.completed);
  saveTasksToLocalStorage();
  renderAll();
}

 
function getPriorityRank(priority) {
   
  if (priority === "High") return 1;
  if (priority === "Medium") return 2;
  return 3;
}

 
function applyFiltersAndSearch(taskArray) {
  let filtered = [...taskArray];

  const categoryFilter = filterCategorySelect.value;
  const priorityFilter = filterPrioritySelect.value;
  const statusFilter = filterStatusSelect.value;
  const searchText = searchInput.value.trim().toLowerCase();

  if (categoryFilter !== "All") {
    filtered = filtered.filter((t) => t.category === categoryFilter);
  }

  if (priorityFilter !== "All") {
    filtered = filtered.filter((t) => t.priority === priorityFilter);
  }

  if (statusFilter === "Active") {
    filtered = filtered.filter((t) => !t.completed);
  } else if (statusFilter === "Completed") {
    filtered = filtered.filter((t) => t.completed);
  }

  if (searchText) {
    filtered = filtered.filter((t) => {
      const title = t.title.toLowerCase();
      const description = (t.description || "").toLowerCase();
      return title.includes(searchText) || description.includes(searchText);
    });
  }

  
  if (focusTodayMode) {
    filtered = filtered.filter((t) => {
      const status = getDueStatus(t);
      return status === "today" || status === "overdue";
    });
  }

  
  filtered.sort((a, b) => {
    const hasA = !!a.dueDate;
    const hasB = !!b.dueDate;

    if (hasA && hasB) {
      const dA = new Date(a.dueDate);
      const dB = new Date(b.dueDate);

      if (dA.getTime() !== dB.getTime()) {
        return dA - dB;  
      }

      const pA = getPriorityRank(a.priority);
      const pB = getPriorityRank(b.priority);
      if (pA !== pB) return pA - pB;

      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (hasA && !hasB) { 
      return -1;
    } else if (!hasA && hasB) {
      return 1;
    } else {
      const pA = getPriorityRank(a.priority);
      const pB = getPriorityRank(b.priority);
      if (pA !== pB) return pA - pB;
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  return filtered;
}

function getDueStatus(task) {
  if (!task.dueDate) return "none";

  const today = new Date();
  const todayYMD = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const due = new Date(task.dueDate);
  const dueYMD = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueYMD < todayYMD) {
    return "overdue";
  } else if (dueYMD.getTime() === todayYMD.getTime()) {
    return "today";
  } else {
    return "future";
  }
}

 
function renderStatistics() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

  totalTasksSpan.textContent = total;
  completedTasksSpan.textContent = completed;
  activeTasksSpan.textContent = active;

   
  let completedPercent = 0;
  let activePercent = 0;

  if (total > 0) {
    completedPercent = (completed / total) * 100;
    activePercent = (active / total) * 100;
  }

  completedBar.style.width = `${completedPercent}%`;
  activeBar.style.width = `${activePercent}%`;
}

function renderHeroNextTask() {
  if (!heroNextTaskEl) return;
  const upcoming = tasks
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => {
      const dA = new Date(a.dueDate);
      const dB = new Date(b.dueDate);
      if (dA.getTime() !== dB.getTime()) return dA - dB;
      return getPriorityRank(a.priority) - getPriorityRank(b.priority);
    });

  if (upcoming.length === 0) {
    heroNextTaskEl.textContent = "No upcoming tasks yet. Add one to get started!";
    return;
  }

  const t = upcoming[0];
  const status = getDueStatus(t);
  let prefix = "Upcoming";
  if (status === "today") prefix = "Due today";
  if (status === "overdue") prefix = "Overdue";

  heroNextTaskEl.textContent = `${prefix}: ${t.title} · ${t.dueDate} · ${t.priority} priority`;
}

function renderTasks() {
  const visibleTasks = applyFiltersAndSearch(tasks);

  taskListEl.innerHTML = "";

  if (visibleTasks.length === 0) {
    emptyStateEl.style.display = "block";
    return;
  } else {
    emptyStateEl.style.display = "none";
  }

  visibleTasks.forEach((task) => {
    const dueStatus = getDueStatus(task);

    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item");
    if (task.completed) taskItem.classList.add("completed");
    if (dueStatus === "overdue") taskItem.classList.add("overdue");
    if (dueStatus === "today") taskItem.classList.add("due-today");

     
    const checkboxWrapper = document.createElement("div");
    checkboxWrapper.classList.add("task-checkbox");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTaskCompleted(task.id));
    checkboxWrapper.appendChild(checkbox);

     
    const main = document.createElement("div");
    main.classList.add("task-main");

    const titleRow = document.createElement("div");
    titleRow.classList.add("task-title-row");

    const title = document.createElement("div");
    title.classList.add("task-title");
    title.textContent = task.title;

    const actions = document.createElement("div");
    actions.classList.add("task-actions");

    const editBtn = document.createElement("button");
    editBtn.classList.add("btn", "btn-secondary");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEditTask(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn", "btn-secondary");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    titleRow.appendChild(title);
    titleRow.appendChild(actions);

    const meta = document.createElement("div");
    meta.classList.add("task-meta");

    
    const categoryBadge = document.createElement("span");
    categoryBadge.classList.add("badge", "badge-category");
    categoryBadge.textContent = task.category;
    meta.appendChild(categoryBadge);

     
    const priorityBadge = document.createElement("span");
    priorityBadge.classList.add("badge");
    if (task.priority === "High") {
      priorityBadge.classList.add("badge-priority-high");
    } else if (task.priority === "Medium") {
      priorityBadge.classList.add("badge-priority-medium");
    } else {
      priorityBadge.classList.add("badge-priority-low");
    }
    priorityBadge.textContent = task.priority + " priority";
    meta.appendChild(priorityBadge);

     
    if (task.dueDate) {
      const dueBadge = document.createElement("span");
      dueBadge.classList.add("badge");
      if (dueStatus === "overdue") {
        dueBadge.classList.add("badge-overdue");
        dueBadge.textContent = "Overdue · " + task.dueDate;
      } else if (dueStatus === "today") {
        dueBadge.classList.add("badge-due-today");
        dueBadge.textContent = "Due Today · " + task.dueDate;
      } else {
        dueBadge.classList.add("badge-due");
        dueBadge.textContent = "Due · " + task.dueDate;
      }
      meta.appendChild(dueBadge);
    }

     
    if (task.description) {
      const desc = document.createElement("div");
      desc.classList.add("task-description");
      desc.textContent = task.description;
      main.appendChild(desc);
    }

    main.prepend(meta);
    main.prepend(titleRow);

    taskItem.appendChild(checkboxWrapper);
    taskItem.appendChild(main);

    taskListEl.appendChild(taskItem);
  });
}

function renderAll() {
  renderStatistics();
  renderTasks();
  renderHeroNextTask();
}

 
if (taskForm) {
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const taskObj = createTaskObject();
    if (!taskObj) return;

    if (currentEditId) {
       
      const oldTask = tasks.find((t) => t.id === currentEditId);
      if (oldTask) {
        taskObj.completed = oldTask.completed;
      }
      updateTask(taskObj);
    } else {
      addTask(taskObj);
    }
    resetForm();
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    resetForm();
  });
}

[filterCategorySelect, filterPrioritySelect, filterStatusSelect].forEach(
  (el) => {
    if (!el) return;
    el.addEventListener("change", () => renderTasks());
  }
);

if (searchInput) {
  searchInput.addEventListener("input", () => renderTasks());
}

 
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);
}

 
if (focusTodayToggleBtn) {
  focusTodayToggleBtn.addEventListener("click", () => {
    focusTodayMode = !focusTodayMode;
    focusTodayToggleBtn.classList.toggle("active", focusTodayMode);
    focusTodayToggleBtn.textContent = focusTodayMode
      ? "✅ Showing Today / Overdue"
      : "🎯 Focus Today";
    renderTasks();
  });
}

if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener("click", clearCompletedTasks);
}

function init() {
  loadThemeFromLocalStorage();
  initHeroQuote();
  loadTasksFromLocalStorage();
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);