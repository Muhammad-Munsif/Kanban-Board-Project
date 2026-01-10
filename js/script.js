document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const board = document.getElementById("board");
  const addTaskBtn = document.getElementById("add-task-btn");
  const taskModal = document.getElementById("task-modal");
  const detailModal = document.getElementById("detail-modal");
  const moveModal = document.getElementById("move-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const closeDetailModalBtn = document.getElementById("close-detail-modal");
  const closeMoveModalBtn = document.getElementById("close-move-modal");
  const cancelTaskBtn = document.getElementById("cancel-task");
  const taskForm = document.getElementById("task-form");
  const editTaskBtn = document.getElementById("edit-task-btn");
  const deleteTaskBtn = document.getElementById("delete-task-btn");
  const moveTaskBtn = document.getElementById("move-task-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleSlider = document.getElementById("theme-toggle-slider");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const toast = document.getElementById("toast");

  // Task data
  let tasks = JSON.parse(localStorage.getItem("kanban-tasks")) || [];
  let currentTaskId = null;

  // Initialize the application
  function initApp() {
    setupTheme();
    setupSidebar();
    renderTasks();
    setupDragAndDrop();
    updateStats();
    setupEventListeners();

    // Add sample tasks if empty
    if (tasks.length === 0) {
      addSampleTasks();
    }
  }

  // Setup theme
  function setupTheme() {
    const savedTheme = localStorage.getItem("kanban-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
      themeToggleSlider.style.transform = "translateX(24px)";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggleSlider.style.transform = "translateX(0)";
    }

    themeToggle.addEventListener("click", toggleTheme);
  }

  // Toggle theme
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("kanban-theme", "light");
      themeToggleSlider.style.transform = "translateX(0)";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("kanban-theme", "dark");
      themeToggleSlider.style.transform = "translateX(24px)";
    }
  }

  // Setup sidebar
  function setupSidebar() {
    // Toggle sidebar on mobile
    sidebarToggle.addEventListener("click", toggleSidebar);
    sidebarOverlay.addEventListener("click", toggleSidebar);

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
      if (window.innerWidth <= 1024) {
        if (
          !sidebar.contains(e.target) &&
          !sidebarToggle.contains(e.target) &&
          sidebar.classList.contains("active")
        ) {
          toggleSidebar();
        }
      }
    });

    // Handle window resize
    window.addEventListener("resize", handleResize);
  }

  // Toggle sidebar
  function toggleSidebar() {
    sidebar.classList.toggle("active");
    sidebarOverlay.classList.toggle("active");
  }

  // Handle window resize
  function handleResize() {
    if (window.innerWidth > 1024) {
      sidebar.classList.remove("active");
      sidebarOverlay.classList.remove("active");
    }
  }

  // Add sample tasks
  function addSampleTasks() {
    tasks = [
      {
        id: "1",
        title: "Design new logo",
        description:
          "Create logo concepts for the new branding initiative. Need 3 different concepts to present.",
        status: "backlog",
        priority: "high",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Implement user authentication",
        description:
          "Add login and registration functionality with social login options",
        status: "in-progress",
        priority: "medium",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        title: "Write API documentation",
        description:
          "Document all endpoints for the REST API with examples and error codes",
        status: "in-review",
        priority: "low",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "4",
        title: "Setup CI/CD pipeline",
        description:
          "Configure GitHub Actions for automated testing and deployment to production",
        status: "done",
        priority: "high",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "5",
        title: "Mobile responsive testing",
        description:
          "Test all pages on mobile devices and fix any responsiveness issues",
        status: "in-progress",
        priority: "medium",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    saveTasks();
    renderTasks();
    updateStats();
  }

  // Render all tasks
  function renderTasks() {
    // Clear all columns
    document.querySelectorAll('[id$="-tasks"]').forEach((column) => {
      // Remove only task cards, keep empty state
      const taskCards = column.querySelectorAll(".task-card");
      taskCards.forEach((card) => card.remove());
    });

    // Render each task
    tasks.forEach((task) => {
      renderTask(task);
    });

    // Show/hide empty states
    updateEmptyStates();
  }

  // Render a single task
  function renderTask(task) {
    const column = document.getElementById(`${task.status}-tasks`);
    if (!column) return;

    // Remove empty state if it exists
    const emptyState = column.querySelector(".empty-state");
    if (emptyState) {
      emptyState.style.display = "none";
    }

    const taskElement = document.createElement("div");
    taskElement.className =
      "task-card bg-theme-secondary p-4 rounded-lg shadow-theme cursor-move theme-transition";
    taskElement.dataset.taskId = task.id;
    taskElement.draggable = true;

    // Add border based on priority
    if (task.priority === "high") {
      taskElement.style.borderLeft = "4px solid var(--danger-color)";
    } else if (task.priority === "medium") {
      taskElement.style.borderLeft = "4px solid var(--warning-color)";
    } else {
      taskElement.style.borderLeft = "4px solid var(--success-color)";
    }

    // Format due date
    const dueDate = task.dueDate ? formatDate(task.dueDate) : "No due date";
    const isOverdue =
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== "done";
    const dueClass = isOverdue ? "text-red-500" : "text-theme-secondary";

    taskElement.innerHTML = `
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-theme-primary truncate flex-1 mr-2">${
              task.title
            }</h3>
            <span class="priority-${
              task.priority
            } px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap">${
      task.priority
    }</span>
          </div>
          <p class="text-sm text-theme-secondary mb-3 line-clamp-2">${
            task.description || "No description provided"
          }</p>
          <div class="flex justify-between items-center">
            <span class="text-xs ${dueClass}">
              <i class="far fa-calendar mr-1"></i>${dueDate}
              ${isOverdue ? " (Overdue)" : ""}
            </span>
            <div class="flex items-center">
              <button class="task-actions p-1 text-theme-secondary hover:text-theme-primary ml-2" data-task-id="${
                task.id
              }">
                <i class="fas fa-ellipsis-v"></i>
              </button>
            </div>
          </div>
        `;

    // Add event listeners
    taskElement.addEventListener("click", (e) => {
      if (!e.target.closest(".task-actions")) {
        showTaskDetails(task.id);
      }
    });

    const actionsBtn = taskElement.querySelector(".task-actions");
    actionsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showTaskActions(task.id, e.target);
    });

    column.appendChild(taskElement);
  }

  // Show task actions menu
  function showTaskActions(taskId, target) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Remove any existing action menus
    document
      .querySelectorAll(".task-actions-menu")
      .forEach((menu) => menu.remove());

    const menu = document.createElement("div");
    menu.className =
      "task-actions-menu absolute bg-theme-secondary shadow-2xl rounded-lg py-2 z-40 theme-transition";
    menu.style.minWidth = "160px";

    menu.innerHTML = `
          <button class="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary text-theme-primary theme-transition" onclick="showTaskDetails('${taskId}')">
            <i class="fas fa-eye mr-2"></i>View Details
          </button>
          <button class="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary text-theme-primary theme-transition" onclick="editTaskFromMenu('${taskId}')">
            <i class="fas fa-edit mr-2"></i>Edit Task
          </button>
          <button class="w-full text-left px-4 py-2 text-sm hover:bg-theme-tertiary text-theme-primary theme-transition" onclick="moveTaskFromMenu('${taskId}')">
            <i class="fas fa-arrows-alt mr-2"></i>Move Task
          </button>
          <hr class="border-theme my-1">
          <button class="w-full text-left px-4 py-2 text-sm hover:bg-red-500 hover:text-white text-red-500 theme-transition" onclick="deleteTaskFromMenu('${taskId}')">
            <i class="fas fa-trash mr-2"></i>Delete Task
          </button>
        `;

    const rect = target.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;

    document.body.appendChild(menu);

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target !== target) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }

  // Global functions for menu actions
  window.editTaskFromMenu = function (taskId) {
    showTaskDetails(taskId);
    setTimeout(() => {
      document.getElementById("edit-task-btn").click();
    }, 100);
  };

  window.moveTaskFromMenu = function (taskId) {
    showTaskDetails(taskId);
    setTimeout(() => {
      document.getElementById("move-task-btn").click();
    }, 100);
  };

  window.deleteTaskFromMenu = function (taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      tasks = tasks.filter((t) => t.id !== taskId);
      saveTasks();
      renderTasks();
      updateStats();
      showToast("Task deleted successfully", "error");
    }
  };

  // Show task details modal
  function showTaskDetails(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    currentTaskId = taskId;

    // Populate detail modal
    document.getElementById("detail-title").textContent = task.title;
    document.getElementById("detail-description").textContent =
      task.description || "No description provided";
    document.getElementById("detail-due-date").textContent = task.dueDate
      ? formatDate(task.dueDate)
      : "No due date";
    document.getElementById("detail-created-at").textContent = formatDate(
      task.createdAt
    );

    // Set status and priority badges
    const statusBadge = document.getElementById("detail-status");
    statusBadge.textContent = getStatusText(task.status);
    statusBadge.className = `inline-block px-3 py-1 text-xs font-semibold rounded-full status-${task.status}`;

    const priorityBadge = document.getElementById("detail-priority");
    priorityBadge.textContent =
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    priorityBadge.className = `inline-block px-3 py-1 text-xs font-semibold rounded-full priority-${task.priority}`;

    // Show modal
    detailModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Get display text for status
  function getStatusText(status) {
    const statusMap = {
      backlog: "Backlog",
      "in-progress": "In Progress",
      "in-review": "In Review",
      done: "Done",
    };
    return statusMap[status] || status;
  }

  // Update all statistics
  function updateStats() {
    // Update task counts
    const counts = {
      backlog: 0,
      "in-progress": 0,
      "in-review": 0,
      done: 0,
    };

    let highPriority = 0;
    let dueToday = 0;
    let overdue = 0;
    const today = new Date().toISOString().split("T")[0];

    tasks.forEach((task) => {
      counts[task.status]++;
      if (task.priority === "high") highPriority++;
      if (task.dueDate === today) dueToday++;
      if (
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "done"
      )
        overdue++;
    });

    // Update column counts
    document.getElementById("backlog-count").textContent = counts.backlog;
    document.getElementById("in-progress-count").textContent =
      counts["in-progress"];
    document.getElementById("in-review-count").textContent =
      counts["in-review"];
    document.getElementById("done-count").textContent = counts.done;

    // Update stats cards
    document.getElementById("stats-total").textContent = tasks.length;
    document.getElementById("stats-high").textContent = highPriority;
    document.getElementById("stats-due").textContent = dueToday;
    document.getElementById("stats-completed").textContent = counts.done;

    // Update header badges
    document.getElementById("total-tasks").textContent = tasks.length;
    document.getElementById("mobile-total-tasks").textContent = tasks.length;

    // Update sidebar stats
    document.getElementById("sidebar-total-tasks").textContent = tasks.length;
    document.getElementById("sidebar-completed-tasks").textContent =
      counts.done;
    document.getElementById("sidebar-inprogress-tasks").textContent =
      counts["in-progress"];
    document.getElementById("sidebar-overdue-tasks").textContent = overdue;
  }

  // Update empty states
  function updateEmptyStates() {
    const statuses = ["backlog", "in-progress", "in-review", "done"];

    statuses.forEach((status) => {
      const column = document.getElementById(`${status}-tasks`);
      const taskCount = column.querySelectorAll(".task-card").length;
      const emptyState = column.querySelector(".empty-state");

      if (taskCount === 0 && emptyState) {
        emptyState.style.display = "block";
      } else if (emptyState) {
        emptyState.style.display = "none";
      }
    });
  }

  // Setup drag and drop
  function setupDragAndDrop() {
    const columns = document.querySelectorAll('[id$="-tasks"]');

    columns.forEach((column) => {
      column.addEventListener("dragover", handleDragOver);
      column.addEventListener("dragenter", handleDragEnter);
      column.addEventListener("dragleave", handleDragLeave);
      column.addEventListener("drop", handleDrop);
    });

    // Re-setup task drag events after each render
    document.addEventListener(
      "mouseover",
      () => {
        const taskElements = document.querySelectorAll(".task-card");
        taskElements.forEach((task) => {
          task.removeEventListener("dragstart", handleDragStart);
          task.removeEventListener("dragend", handleDragEnd);
          task.addEventListener("dragstart", handleDragStart);
          task.addEventListener("dragend", handleDragEnd);
        });
      },
      { once: true }
    );
  }

  // Drag handlers
  function handleDragStart(e) {
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", e.target.dataset.taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd(e) {
    e.target.classList.remove("dragging");
    document.querySelectorAll(".column").forEach((col) => {
      col.classList.remove("drag-over");
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(e) {
    e.preventDefault();
    const column = e.target.closest(".column");
    if (column) {
      column.classList.add("drag-over");
    }
  }

  function handleDragLeave(e) {
    const column = e.target.closest(".column");
    if (column && !column.contains(e.relatedTarget)) {
      column.classList.remove("drag-over");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const column = e.target.closest('[id$="-tasks"]');
    if (!column) return;

    column.closest(".column").classList.remove("drag-over");

    const taskId = e.dataTransfer.getData("text/plain");
    const newStatus = column.dataset.status;

    updateTaskStatus(taskId, newStatus);
  }

  // Update task status
  function updateTaskStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].status = newStatus;
    saveTasks();
    renderTasks();
    updateStats();
    showToast(`Task moved to ${getStatusText(newStatus)}`, "success");
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
  }

  // Show add task modal
  function showAddTaskModal(status = "backlog") {
    document.getElementById("modal-title").textContent = "Add New Task";
    taskForm.reset();
    document.getElementById("task-status").value = status;
    currentTaskId = null;

    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById("task-due-date").value = tomorrow
      .toISOString()
      .split("T")[0];

    taskModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  // Show move task modal
  function showMoveTaskModal() {
    if (!currentTaskId) return;
    moveModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  // Close all modals
  function closeAllModals() {
    taskModal.classList.add("hidden");
    detailModal.classList.add("hidden");
    moveModal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }

  // Handle task form submission
  function handleTaskFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById("task-title").value.trim();
    const description = document
      .getElementById("task-description")
      .value.trim();
    const status = document.getElementById("task-status").value;
    const priority = document.getElementById("task-priority").value;
    const dueDate = document.getElementById("task-due-date").value;

    if (!title) {
      showToast("Task title is required", "error");
      return;
    }

    if (currentTaskId) {
      // Update existing task
      const taskIndex = tasks.findIndex((t) => t.id === currentTaskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          title,
          description,
          status,
          priority,
          dueDate,
        };
        showToast("Task updated successfully", "success");
      }
    } else {
      // Create new task
      const newTask = {
        id: Date.now().toString(),
        title,
        description,
        status,
        priority,
        dueDate,
        createdAt: new Date().toISOString(),
      };
      tasks.push(newTask);
      showToast("Task added successfully", "success");
    }

    saveTasks();
    renderTasks();
    updateStats();
    closeAllModals();
  }

  // Handle edit task
  function handleEditTask() {
    if (!currentTaskId) return;

    const task = tasks.find((t) => t.id === currentTaskId);
    if (!task) return;

    // Fill form with task data
    document.getElementById("modal-title").textContent = "Edit Task";
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-status").value = task.status;
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-due-date").value = task.dueDate || "";

    // Switch to task modal
    detailModal.classList.add("hidden");
    taskModal.classList.remove("hidden");
  }

  // Handle delete task
  function handleDeleteTask() {
    if (!currentTaskId) return;

    if (confirm("Are you sure you want to delete this task?")) {
      tasks = tasks.filter((t) => t.id !== currentTaskId);
      saveTasks();
      renderTasks();
      updateStats();
      showToast("Task deleted successfully", "error");
      closeAllModals();
    }
  }

  // Handle move task
  function handleMoveTask() {
    showMoveTaskModal();
  }

  // Show toast notification
  function showToast(message, type = "success") {
    const toastIcon = document.getElementById("toast-icon");
    const toastMessage = document.getElementById("toast-message");

    toastMessage.textContent = message;

    if (type === "error") {
      toastIcon.className = "fas fa-exclamation-circle mr-3";
      toastIcon.style.color = "var(--danger-color)";
    } else if (type === "warning") {
      toastIcon.className = "fas fa-exclamation-triangle mr-3";
      toastIcon.style.color = "var(--warning-color)";
    } else {
      toastIcon.className = "fas fa-check-circle mr-3";
      toastIcon.style.color = "var(--success-color)";
    }

    toast.classList.remove("hidden");

    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Modal controls
    addTaskBtn.addEventListener("click", () => showAddTaskModal());
    closeModalBtn.addEventListener("click", closeAllModals);
    closeDetailModalBtn.addEventListener("click", closeAllModals);
    closeMoveModalBtn.addEventListener("click", closeAllModals);
    cancelTaskBtn.addEventListener("click", closeAllModals);

    // Form submission
    taskForm.addEventListener("submit", handleTaskFormSubmit);

    // Task actions
    editTaskBtn.addEventListener("click", handleEditTask);
    deleteTaskBtn.addEventListener("click", handleDeleteTask);
    moveTaskBtn.addEventListener("click", handleMoveTask);

    // Move task buttons
    document.querySelectorAll(".move-status-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const newStatus = e.currentTarget.dataset.status;
        if (currentTaskId) {
          updateTaskStatus(currentTaskId, newStatus);
          closeAllModals();
        }
      });
    });

    // Add task to specific column buttons
    document.querySelectorAll(".add-task-to-column").forEach((btn) => {
      btn.addEventListener("click", () => {
        const status = btn.dataset.status;
        showAddTaskModal(status);
      });
    });

    // Column header add buttons
    document.querySelectorAll(".column button").forEach((btn) => {
      if (
        btn.innerHTML.includes("fa-plus") &&
        !btn.classList.contains("add-task-to-column")
      ) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const status = btn.closest(".column").dataset.status;
          showAddTaskModal(status);
        });
      }
    });

    // Close modals when clicking outside
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", closeAllModals);
    });

    // Close modals with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllModals();
      }
    });
  }

  // Initialize the application
  initApp();
});
<script>
    document.addEventListener("DOMContentLoaded", function () {
      // DOM Elements
      const sidebarMenuItems = document.querySelectorAll('.sidebar-menu-item');
      const pageContents = document.querySelectorAll('.page-content');
      const pageTitle = document.getElementById('page-title');
      const pageSubtitle = document.getElementById('page-subtitle');
      const pageTitleDesktop = document.getElementById('page-title-desktop');
      const pageSubtitleDesktop = document.getElementById('page-subtitle-desktop');
      const addContextBtn = document.getElementById('add-context-btn');
      const addBtnText = document.getElementById('add-btn-text');
      const searchContainer = document.getElementById('search-container');
      const globalSearch = document.getElementById('global-search');
      const statsBadge = document.getElementById('stats-badge');

      // Initialize pages
      let currentPage = 'board';
      const pages = {
        'board': {
          title: 'Kanban Board',
          subtitle: 'Organize your work efficiently',
          addBtnText: 'Add Task',
          showSearch: true,
          showStats: true
        },
        'my-tasks': {
          title: 'My Tasks',
          subtitle: 'Tasks assigned to you',
          addBtnText: 'Add Task',
          showSearch: true,
          showStats: true
        },
        'calendar': {
          title: 'Calendar',
          subtitle: 'Schedule and manage deadlines',
          addBtnText: 'Add Event',
          showSearch: false,
          showStats: false
        },
        'analytics': {
          title: 'Analytics',
          subtitle: 'Track productivity and performance',
          addBtnText: 'Export Report',
          showSearch: false,
          showStats: false
        },
        'team': {
          title: 'Team',
          subtitle: 'Manage team members and projects',
          addBtnText: 'Add Member',
          showSearch: true,
          showStats: false
        }
      };

      // Page Navigation
      function navigateToPage(page) {
        // Update active menu item
        sidebarMenuItems.forEach(item => {
          item.classList.remove('active');
          if (item.dataset.page === page) {
            item.classList.add('active');
          }
        });

        // Update active page content
        pageContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${page}-page`) {
            content.classList.add('active');
          }
        });

        // Update page titles
        const pageConfig = pages[page];
        pageTitle.textContent = pageConfig.title;
        pageSubtitle.textContent = pageConfig.subtitle;
        pageTitleDesktop.textContent = pageConfig.title;
        pageSubtitleDesktop.textContent = pageConfig.subtitle;
        addBtnText.textContent = pageConfig.addBtnText;

        // Update UI elements based on page
        searchContainer.style.display = pageConfig.showSearch ? 'block' : 'none';
        statsBadge.style.display = pageConfig.showStats ? 'block' : 'none';

        // Update context button action
        updateAddButtonAction(page);

        currentPage = page;

        // Initialize page-specific functionality
        if (page === 'calendar') {
          initializeCalendar();
        } else if (page === 'analytics') {
          initializeAnalytics();
        } else if (page === 'team') {
          initializeTeam();
        } else if (page === 'my-tasks') {
          initializeMyTasks();
        }

        // Close sidebar on mobile
        if (window.innerWidth <= 1024) {
          const sidebar = document.getElementById('sidebar');
          const sidebarOverlay = document.getElementById('sidebar-overlay');
          sidebar.classList.remove('active');
          sidebarOverlay.classList.remove('active');
        }
      }

      // Update add button action based on current page
      function updateAddButtonAction(page) {
        addContextBtn.onclick = function () {
          switch (page) {
            case 'board':
            case 'my-tasks':
              document.getElementById('task-modal').classList.remove('hidden');
              document.body.style.overflow = 'hidden';
              break;
            case 'calendar':
              // Show quick add event form
              document.getElementById('event-title').focus();
              break;
            case 'analytics':
              exportAnalyticsReport();
              break;
            case 'team':
              document.getElementById('team-member-name').focus();
              break;
          }
        };
      }

      // Initialize Calendar
      function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: 'dayGridMonth',
          headerToolbar: false,
          themeSystem: 'bootstrap',
          events: [
            {
              title: 'Team Meeting',
              start: new Date(),
              className: 'event-type-meeting'
            },
            {
              title: 'Project Deadline',
              start: new Date(new Date().setDate(new Date().getDate() + 5)),
              className: 'event-type-deadline'
            },
            {
              title: 'Client Review',
              start: new Date(new Date().setDate(new Date().getDate() + 10)),
              className: 'event-type-reminder'
            }
          ],
          eventClick: function (info) {
            alert('Event: ' + info.event.title);
          }
        });

        calendar.render();

        // Update current month display
        const currentMonthEl = document.getElementById('current-month');
        const currentDate = calendar.getDate();
        currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });

        // Calendar controls
        document.getElementById('prev-month').onclick = () => {
          calendar.prev();
          updateCurrentMonth(calendar);
        };

        document.getElementById('next-month').onclick = () => {
          calendar.next();
          updateCurrentMonth(calendar);
        };

        document.getElementById('today-btn').onclick = () => {
          calendar.today();
          updateCurrentMonth(calendar);
        };

        // View switching
        document.querySelectorAll('[data-view]').forEach(btn => {
          btn.onclick = function () {
            const view = this.dataset.view;
            document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            calendar.changeView(view + (view === 'list' ? 'Month' : ''));
          };
        });
      }

      function updateCurrentMonth(calendar) {
        const currentMonthEl = document.getElementById('current-month');
        const currentDate = calendar.getDate();
        currentMonthEl.textContent = currentDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      }

      // Initialize Analytics
      function initializeAnalytics() {
        // Status Distribution Chart
        const statusCtx = document.getElementById('status-chart').getContext('2d');
        new Chart(statusCtx, {
          type: 'doughnut',
          data: {
            labels: ['Backlog', 'In Progress', 'In Review', 'Done'],
            datasets: [{
              data: [12, 8, 5, 15],
              backgroundColor: [
                '#6b7280',
                '#3b82f6',
                '#f59e0b',
                '#10b981'
              ],
              borderWidth: 2,
              borderColor: 'var(--bg-secondary)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: 'var(--text-primary)',
                  padding: 20
                }
              }
            }
          }
        });

        // Priority Distribution Chart
        const priorityCtx = document.getElementById('priority-chart').getContext('2d');
        new Chart(priorityCtx, {
          type: 'bar',
          data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
              label: 'Tasks',
              data: [8, 15, 12],
              backgroundColor: [
                '#ef4444',
                '#f59e0b',
                '#10b981'
              ],
              borderWidth: 0,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'var(--border-color)'
                },
                ticks: {
                  color: 'var(--text-secondary)'
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: 'var(--text-secondary)'
                }
              }
            }
          }
        });

        // Update analytics stats
        updateAnalyticsStats();
      }

      function updateAnalyticsStats() {
        // Simulate data
        document.getElementById('analytics-total-tasks').textContent = '40';
        document.getElementById('analytics-completed-tasks').textContent = '15';
        document.getElementById('analytics-avg-time').textContent = '5.2d';
        document.getElementById('analytics-overdue-tasks').textContent = '3';
      }

      function exportAnalyticsReport() {
        showToast('Analytics report exported successfully!', 'success');
      }

      // Initialize Team Page
      function initializeTeam() {
        // Add team member functionality
        document.getElementById('add-team-member-btn').onclick = function () {
          const name = document.getElementById('team-member-name').value;
          const email = document.getElementById('team-member-email').value;
          const role = document.getElementById('team-member-role').value;

          if (name && email) {
            showToast(`Team member ${name} added successfully!`, 'success');
            document.getElementById('team-member-name').value = '';
            document.getElementById('team-member-email').value = '';
            document.getElementById('team-member-role').value = 'developer';
          } else {
            showToast('Please fill in all required fields', 'error');
          }
        };
      }

      // Initialize My Tasks Page
      function initializeMyTasks() {
        // Filter functionality
        const statusFilter = document.getElementById('my-tasks-status-filter');
        const priorityFilter = document.getElementById('my-tasks-priority-filter');
        const sortSelect = document.getElementById('my-tasks-sort');

        [statusFilter, priorityFilter, sortSelect].forEach(select => {
          select.onchange = function () {
            filterMyTasks();
          };
        });

        // Initial filter
        filterMyTasks();
      }

      function filterMyTasks() {
        // This would filter and display tasks based on selections
        // For now, just show a message
        const container = document.getElementById('my-tasks-container');
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i class="fas fa-filter text-4xl text-theme-secondary mb-4"></i>
            <h3 class="text-xl font-semibold text-theme-primary mb-2">Filter Applied</h3>
            <p class="text-theme-secondary">Your filtered tasks will appear here</p>
          </div>
        `;
      }

      // Toast Notification Function
      function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toast-icon');
        const toastMessage = document.getElementById('toast-message');

        toastMessage.textContent = message;

        if (type === 'error') {
          toastIcon.className = 'fas fa-exclamation-circle mr-3';
          toastIcon.style.color = 'var(--danger-color)';
        } else if (type === 'warning') {
          toastIcon.className = 'fas fa-exclamation-triangle mr-3';
          toastIcon.style.color = 'var(--warning-color)';
        } else {
          toastIcon.className = 'fas fa-check-circle mr-3';
          toastIcon.style.color = 'var(--success-color)';
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
          toast.classList.add('hidden');
        }, 3000);
      }

      // Event Listeners for Navigation
      sidebarMenuItems.forEach(item => {
        item.addEventListener('click', function () {
          const page = this.dataset.page;
          navigateToPage(page);
        });
      });

      // Global search functionality
      globalSearch.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        // Search logic would go here based on current page
        console.log(`Searching for: ${searchTerm} on ${currentPage} page`);
      });

      // Initialize with Board page
      navigateToPage('board');

      // Keep existing functionality for Board page (tasks, drag & drop, etc.)
      // ... (Your existing board functionality code goes here)
      // Note: You'll need to integrate your existing board functionality
      // with the new multi-page structure

    });
  </script>