const API_KEY = CONFIG.GEMINI_API_KEY;
const playerSystem = new RPGEngine();

/* ═══════════════════════════════════════════════════════════
   Phase 7: Elite "Kaizen" Onboarding Engine + Dashboard
   ═══════════════════════════════════════════════════════════ */

// ── 13-Question Data Array ──
const onboardingQuestions = [
  {
    id: "name",
    question: "What should we call you?",
    subtitle: "Your coach needs to know who you are.",
    type: "text",
    field: "name",
    placeholder: "Enter your name"
  },
  {
    id: "age",
    question: "How old are you?",
    subtitle: "This helps us tailor your protocol.",
    type: "number",
    field: "age",
    placeholder: "Age in years"
  },
  {
    id: "primaryGoal",
    question: "What is your primary physical goal?",
    subtitle: "Pick the one that matters most right now.",
    type: "cards",
    field: "primaryGoal",
    options: [
      { label: "Build Muscle", emoji: "💪" },
      { label: "Lose Fat", emoji: "🔥" },
      { label: "Increase Height", emoji: "📏" },
      { label: "Overall Health", emoji: "🌿" }
    ]
  },
  {
    id: "aestheticFocus",
    question: "What is your main aesthetic focus?",
    subtitle: "Where do you want visible transformation?",
    type: "cards",
    field: "aestheticFocus",
    options: [
      { label: "Skincare", emoji: "✨" },
      { label: "Jawline / Mewing", emoji: "🗿" },
      { label: "Hair Growth", emoji: "💇" },
      { label: "Overall", emoji: "🪞" }
    ]
  },
  {
    id: "hobbyGrind",
    question: "What is your main hobby or career grind?",
    subtitle: "e.g., 'YouTube 200 subs', 'Learning to code', 'Music production'",
    type: "text",
    field: "hobbyGrind",
    placeholder: "What's your side mission?"
  },
  {
    id: "currentFeeling",
    question: "How do you feel about your current situation?",
    subtitle: "Be honest — this isn't a test.",
    type: "cards",
    field: "currentFeeling",
    options: [
      { label: "Wasting my potential", emoji: "😤" },
      { label: "Doing okay but missing something", emoji: "🤔" },
      { label: "Thriving and want more", emoji: "🚀" }
    ]
  },
  {
    id: "distractionHours",
    question: "How many hours a day do you lose to distractions?",
    subtitle: "Social media, YouTube rabbit holes, gaming…",
    type: "cards",
    field: "distractionHours",
    options: [
      { label: "1–2 hours", emoji: "⏳" },
      { label: "3–4 hours", emoji: "📱" },
      { label: "5+ hours", emoji: "💀" }
    ]
  },
  {
    id: "biggestObstacle",
    question: "What is the biggest thing holding you back?",
    subtitle: "The real enemy isn't outside — it's inside.",
    type: "cards",
    field: "biggestObstacle",
    options: [
      { label: "Lack of consistency", emoji: "🔄" },
      { label: "Instant gratification", emoji: "🍬" },
      { label: "No structure or plan", emoji: "🗺️" }
    ]
  },
  {
    id: "vices",
    question: "Which vices are you trying to break?",
    subtitle: "Select the one that hits hardest.",
    type: "cards",
    field: "vices",
    options: [
      { label: "Endless scrolling", emoji: "📲" },
      { label: "Junk food", emoji: "🍔" },
      { label: "Gaming addiction", emoji: "🎮" },
      { label: "None — I'm disciplined", emoji: "🧊" },
      { label: "Custom...", emoji: "✏️" }
    ]
  },
  {
    id: "trainingFrequency",
    question: "How often are you currently training your body?",
    subtitle: "Any physical activity counts.",
    type: "cards",
    field: "trainingFrequency",
    options: [
      { label: "0 days / week", emoji: "🛋️" },
      { label: "1–2 days / week", emoji: "🚶" },
      { label: "3–5 days / week", emoji: "🏋️" },
      { label: "6+ days / week", emoji: "⚡" }
    ]
  },
  {
    id: "rewardType",
    question: "What type of rewards motivate you most?",
    subtitle: "We'll fine-tune your gamification system.",
    type: "cards",
    field: "rewardType",
    options: [
      { label: "XP & Levels", emoji: "⬆️" },
      { label: "Daily Streaks", emoji: "🔥" },
      { label: "Visual Progress", emoji: "📊" }
    ]
  },
  {
    id: "commitment",
    question: "How committed are you to this transformation?",
    subtitle: "Choose wisely. Your protocol depends on it.",
    type: "cards",
    field: "commitment",
    options: [
      { label: "Just exploring", emoji: "👀" },
      { label: "Serious about change", emoji: "💎" },
      { label: "Legendary — no excuses", emoji: "👑" }
    ]
  },
  {
    id: "calc",
    question: "",
    type: "calc"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const viewHome = document.getElementById("view-home");
  const viewCoach = document.getElementById("view-coach");
  const viewProfile = document.getElementById("view-profile");

  const navItems = document.querySelectorAll(".bottom-nav-item");
  const bottomNav = document.querySelector(".bottom-nav");

  const onboardingContainer = document.getElementById("onboarding-container");
  const questionContainer = document.getElementById("question-container");
  const progressFill = document.getElementById("onboarding-progress-fill");
  const backBtn = document.getElementById("onboarding-back-btn");
  const nextBtn = document.getElementById("onboarding-next-btn");
  const userNameDisplays = document.querySelectorAll(".user-name-display");

  let currentQuestionIndex = 0;
  let userProfile = {};
  let isAnimating = false;

  const TASK_STORAGE_PREFIX = "dailyTask:";

  function toTaskId(text) {
    return (
      TASK_STORAGE_PREFIX +
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  }

  // ── View Navigation ──
  function showView(target) {
    if (!viewHome || !viewCoach) return;
    viewHome.style.display = "none";
    viewCoach.style.display = "none";
    if (viewProfile) viewProfile.style.display = "none";

    if (target === "home") {
      viewHome.style.display = "";
      updateHomeDashboard();
    } else if (target === "coach") {
      viewCoach.style.display = "";
    } else if (target === "profile" && viewProfile) {
      viewProfile.style.display = "";
      updateProfileView();
    }
  }

  function setActiveNav(target) {
    navItems.forEach((item) => {
      const view = item.getAttribute("data-view");
      if (view === target) {
        item.classList.add("active");
        item.setAttribute("aria-current", "page");
      } else {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      }
    });
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-view");
      if (target === "home" || target === "coach" || target === "profile") {
        showView(target);
        setActiveNav(target);
      }
    });
  });

  // ── Task System ──
  function handleTaskToggle(event) {
    const checkbox = event.target;
    const statCategory = checkbox.dataset.stat;
    const xpAmount = parseInt(checkbox.dataset.xp || 0, 10);
    const taskLabel = checkbox.closest('.task-label') || checkbox.closest('label');
    const labelText = taskLabel ? taskLabel.querySelector('.task-text') : null;

    if (checkbox.checked) {
      if (statCategory && xpAmount) {
        playerSystem.gainXP(xpAmount, statCategory);
      }
      if (labelText) {
        labelText.classList.add('task-completed');
      } else if (taskLabel) {
        taskLabel.classList.add('task-completed');
      }
    } else {
      if (statCategory && xpAmount) {
        playerSystem.loseXP(xpAmount, statCategory);
      }
      if (labelText) {
        labelText.classList.remove('task-completed');
      } else if (taskLabel) {
        taskLabel.classList.remove('task-completed');
      }
    }
    checkDailyStreak();
  }

  function checkDailyStreak() {
    const allCheckboxes = document.querySelectorAll('.task-checkbox');
    const checkedBoxes = document.querySelectorAll('.task-checkbox:checked');
    const total = allCheckboxes.length;
    const checked = checkedBoxes.length;

    if (total > 0 && checked === total) {
      playerSystem.setDailyCompletion(true);
    } else {
      playerSystem.setDailyCompletion(false);
    }
    updateDashboardUI();
  }

  const taskCheckboxes = document.querySelectorAll(".task-checkbox");
  taskCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", handleTaskToggle);
  });

  // ── Chat UI ──
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatHistory = document.getElementById("chat-history");

  // ── Profile Helpers ──
  function applyProfileToUI(profile) {
    if (!profile) return;
    userNameDisplays.forEach((el) => {
      el.textContent = profile.name || "";
    });
  }

  function getStoredProfile() {
    const raw = localStorage.getItem("userProfile");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to parse stored profile", e);
      return null;
    }
  }

  function setOnboardingVisibility(showOnboarding) {
    if (!onboardingContainer) return;
    if (showOnboarding) {
      onboardingContainer.classList.remove("hidden");
      if (bottomNav) bottomNav.classList.add("hidden");
    } else {
      onboardingContainer.classList.add("hidden");
      if (bottomNav) bottomNav.classList.remove("hidden");
    }
  }

  // ── Task Loading & Rendering ──
  function loadStoredTasks() {
    const raw = localStorage.getItem("dailyTasks");
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function renderTasks(tasks) {
    const container = document.getElementById("task-container");
    if (!container) return;
    container.innerHTML = "";

    tasks.forEach(taskObj => {
      const wrapper = document.createElement("div");
      wrapper.className = "task-item";
      wrapper.setAttribute("data-type", "system");
      wrapper.innerHTML = `
        <label class="task-label">
          <input type="checkbox" class="task-checkbox" data-stat="${taskObj.stat || 'discipline'}" data-xp="${taskObj.xp || 20}">
          <span class="task-custom-checkbox"></span>
          <span class="task-text">${taskObj.task}</span>
        </label>
      `;
      container.appendChild(wrapper);
    });

    const checkboxes = container.querySelectorAll(".task-checkbox");
    checkboxes.forEach(cb => {
      cb.addEventListener("change", handleTaskToggle);
    });

    checkDailyStreak();
  }

  async function checkDailyRefresh(profile) {
    const today = new Date().toLocaleDateString();
    const lastGen = localStorage.getItem("lastTaskGenerationDate");

    if (lastGen !== today) {
      const container = document.getElementById("task-container");
      if (container) {
        container.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; padding: 20px;">
            <div class="calc-spinner-ring" style="width:40px;height:40px;border-width:2px;"></div>
            <p style="text-align: center; margin-top: 15px; color: #E0E5FF; font-size: 0.9rem;">
              Analyzing progress… generating today's protocol.
            </p>
          </div>
        `;
      }
      await generatePersonalizedTasks(profile);
      localStorage.setItem("lastTaskGenerationDate", today);
    } else {
      const storedTasks = loadStoredTasks();
      if (storedTasks.length > 0) {
        renderTasks(storedTasks);
      }
    }
  }

  // ═══════════════════════════════════════════
  // Phase 7: Dynamic Onboarding Engine
  // ═══════════════════════════════════════════

  function updateProgressBar() {
    const total = onboardingQuestions.length;
    const pct = ((currentQuestionIndex + 1) / total) * 100;
    if (progressFill) progressFill.style.width = pct + "%";
  }

  function updateNavButtons() {
    const q = onboardingQuestions[currentQuestionIndex];

    // Back button
    if (backBtn) {
      backBtn.style.visibility = currentQuestionIndex === 0 ? "hidden" : "visible";
    }

    // Next button
    if (nextBtn) {
      if (q.type === "calc") {
        nextBtn.classList.add("hidden-btn");
      } else if (q.type === "cards") {
        nextBtn.classList.add("hidden-btn");
      } else {
        nextBtn.classList.remove("hidden-btn");
      }
    }
  }

  function renderQuestion(index, direction) {
    if (isAnimating) return;
    const q = onboardingQuestions[index];
    if (!q || !questionContainer) return;

    const existing = questionContainer.querySelector(".question-content, .calc-screen");

    if (existing) {
      isAnimating = true;
      const outClass = direction === "back" ? "slide-out-right" : "slide-out-left";
      existing.classList.add(outClass);

      // Safety timeout: if animationend never fires, force cleanup after 500ms
      const safetyTimer = setTimeout(() => {
        if (isAnimating) {
          existing.remove();
          injectQuestion(q, index, direction);
          isAnimating = false;
        }
      }, 500);

      existing.addEventListener("animationend", () => {
        clearTimeout(safetyTimer);
        existing.remove();
        injectQuestion(q, index, direction);
        isAnimating = false;
      }, { once: true });
    } else {
      injectQuestion(q, index, direction);
    }

    updateProgressBar();
    updateNavButtons();
  }

  function injectQuestion(q, index, direction) {
    if (q.type === "calc") {
      renderCalcScreen();
      return;
    }

    const total = onboardingQuestions.length - 1; // exclude calc screen from count
    const stepNum = index + 1;

    const div = document.createElement("div");
    div.className = "question-content";
    const inClass = direction === "back" ? "slide-in-left" : "slide-in-right";
    div.classList.add(inClass);

    let html = `<span class="question-step-label">Step ${stepNum} of ${total}</span>`;
    html += `<h2 class="question-title">${q.question}</h2>`;
    if (q.subtitle) {
      html += `<p class="question-subtitle">${q.subtitle}</p>`;
    }

    if (q.type === "text") {
      html += `<input type="text" class="onboarding-input" id="ob-input-${q.id}" placeholder="${q.placeholder || ''}" autocomplete="off" />`;
    } else if (q.type === "number") {
      html += `<input type="number" class="onboarding-input" id="ob-input-${q.id}" placeholder="${q.placeholder || ''}" min="1" max="100" />`;
    } else if (q.type === "cards") {
      html += `<div class="onboarding-cards">`;
      q.options.forEach(opt => {
        const isSelected = userProfile[q.field] === opt.label ? "selected" : "";
        html += `<button type="button" class="onboarding-card ${isSelected}" data-value="${opt.label}">
          <span class="card-emoji">${opt.emoji}</span>
          <span class="card-label">${opt.label}</span>
        </button>`;
      });
      html += `</div>`;
    }

    div.innerHTML = html;
    questionContainer.appendChild(div);

    // Restore previous text/number answer
    if (q.type === "text" || q.type === "number") {
      const input = div.querySelector(".onboarding-input");
      if (input && userProfile[q.field]) {
        input.value = userProfile[q.field];
      }
      // Auto-focus
      setTimeout(() => input && input.focus(), 100);

      // Enter key on text/number inputs
      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            goNext();
          }
        });
      }
    }

    // Card click handlers
    if (q.type === "cards") {
      const cards = div.querySelectorAll(".onboarding-card");
      cards.forEach(card => {
        card.addEventListener("click", () => {
          cards.forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
          userProfile[q.field] = card.dataset.value;

          // ── "Custom..." card logic ──
          const existingCustomInput = div.querySelector("#custom-option-input");
          if (card.dataset.value === "Custom...") {
            // Show custom input if not already present
            if (!existingCustomInput) {
              const customInput = document.createElement("input");
              customInput.type = "text";
              customInput.id = "custom-option-input";
              customInput.className = "custom-onboarding-input";
              customInput.placeholder = "Type your specific answer...";
              const cardsContainer = div.querySelector(".onboarding-cards");
              if (cardsContainer) {
                cardsContainer.after(customInput);
              }
              setTimeout(() => customInput.focus(), 50);

              // Enter key on custom input
              customInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goNext();
                }
              });
            } else {
              existingCustomInput.focus();
            }
            // Don't auto-advance for Custom — wait for user to type + press Next/Enter
            // Show the Next button so they can proceed
            if (nextBtn) nextBtn.classList.remove("hidden-btn");
            return;
          } else {
            // Remove custom input if a non-Custom card is clicked
            if (existingCustomInput) existingCustomInput.remove();
            // Re-hide Next for normal cards
            if (nextBtn) nextBtn.classList.add("hidden-btn");
          }

          // Auto-advance after short delay (for non-Custom cards)
          setTimeout(() => goNext(), 350);
        });
      });
    }
  }

  function goNext() {
    if (isAnimating) return;
    const q = onboardingQuestions[currentQuestionIndex];
    if (!q) return;

    // Validate text/number inputs
    if (q.type === "text" || q.type === "number") {
      const input = document.getElementById(`ob-input-${q.id}`);
      const val = input ? input.value.trim() : "";
      if (!val) {
        if (input) {
          input.focus();
          input.style.borderColor = "#ef4444";
          input.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.3)";
          setTimeout(() => {
            if (input) {
              input.style.borderColor = "";
              input.style.boxShadow = "";
            }
          }, 1500);
        }
        return;
      }
      userProfile[q.field] = q.type === "number" ? Number(val) : val;
    }

    // Validate card selection
    if (q.type === "cards") {
      if (!userProfile[q.field]) {
        return; // don't advance without selection
      }
      // If "Custom..." is selected, grab the custom input value
      if (userProfile[q.field] === "Custom...") {
        const customInput = document.getElementById("custom-option-input");
        const customVal = customInput ? customInput.value.trim() : "";
        if (!customVal) {
          if (customInput) {
            customInput.focus();
            customInput.style.borderColor = "#ef4444";
            customInput.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.3)";
            setTimeout(() => {
              if (customInput) {
                customInput.style.borderColor = "";
                customInput.style.boxShadow = "";
              }
            }, 1500);
          }
          return;
        }
        userProfile[q.field] = customVal;
      }
    }

    if (currentQuestionIndex < onboardingQuestions.length - 1) {
      currentQuestionIndex++;
      renderQuestion(currentQuestionIndex, "forward");
    }
  }

  function goBack() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion(currentQuestionIndex, "back");
    }
  }

  // ── Calculation Screen ──
  function renderCalcScreen() {
    // Hide nav buttons
    if (backBtn) backBtn.style.visibility = "hidden";
    if (nextBtn) nextBtn.classList.add("hidden-btn");

    const div = document.createElement("div");
    div.className = "calc-screen";
    div.innerHTML = `
      <div class="calc-spinner-ring"></div>
      <p class="calc-text" id="calc-status-text">Analyzing responses…</p>
    `;
    questionContainer.appendChild(div);

    const textEl = div.querySelector("#calc-status-text");
    const messages = [
      "Analyzing responses…",
      "Cross-referencing habits…",
      "Building custom protocol…",
      "Finalizing your transformation plan…"
    ];

    let msgIndex = 0;
    const cycleInterval = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length && textEl) {
        textEl.textContent = messages[msgIndex];
      }
    }, 1000);

    setTimeout(async () => {
      clearInterval(cycleInterval);
      await finishOnboarding();
    }, 4000);
  }

  // ── Finish Onboarding ──
  async function finishOnboarding() {
    // Ensure name is applied
    if (userProfile.name) {
      applyProfileToUI(userProfile);
    }

    // Generate tasks
    await generatePersonalizedTasks(userProfile);
    localStorage.setItem("lastTaskGenerationDate", new Date().toLocaleDateString());

    // Save profile
    localStorage.setItem("userProfile", JSON.stringify(userProfile));

    // Show dashboard
    setOnboardingVisibility(false);
    showView("home");
    setActiveNav("home");
    updateHomeDashboard();
    updateProfileView();
  }

  // ── Wire up nav buttons ──
  if (nextBtn) {
    nextBtn.addEventListener("click", goNext);
  }
  if (backBtn) {
    backBtn.addEventListener("click", goBack);
  }

  // Enter key support
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (!onboardingContainer || onboardingContainer.classList.contains("hidden")) return;

    const q = onboardingQuestions[currentQuestionIndex];
    if (q && (q.type === "text" || q.type === "number")) {
      e.preventDefault();
      goNext();
    }
  });

  // ═══════════════════════════════════════════
  // Init: Check Profile or Start Onboarding
  // ═══════════════════════════════════════════

  const existingProfile = getStoredProfile();
  if (existingProfile) {
    userProfile = existingProfile;
    setOnboardingVisibility(false);
    applyProfileToUI(existingProfile);
    checkDailyRefresh(userProfile);
    updateHomeDashboard();
    updateProfileView();
  } else {
    setOnboardingVisibility(true);
    renderQuestion(0, "forward");
  }

  // ═══════════════════════════════════════════
  // AI Task Generation (unchanged)
  // ═══════════════════════════════════════════

  async function generatePersonalizedTasks(profile) {
    const state = playerSystem.state || {};
    const level = state.level || 1;
    const streak = state.streak || 0;
    const goals = profile.primaryGoal || "Overall Health";

    let yesterdayTasksHtml = "";
    try {
      const lastTasks = JSON.parse(localStorage.getItem('dailyTasks') || "[]");
      if (lastTasks.length > 0) {
        yesterdayTasksHtml = ` Yesterday's tasks were: ${lastTasks.map(t => t.task).join(", ")}.`;
      }
    } catch (e) { }

    const prompt = `You are an AI coach. Based on this user: ${JSON.stringify(profile)}, generate exactly 3 daily tasks tailored to their profile (1 physical, 1 aesthetic, 1 career/hobby).
The user is currently Level ${level} with a ${streak}-day consistency streak. Their goals are: ${goals}.
If the Level or Streak is low (1-3), generate extremely easy 'micro-habits' to build momentum (e.g., 'Drink 1 glass of water', 'Do 5 pushups'). If the Level/Streak is higher, progressively increase the difficulty and duration of the tasks (e.g., 'Run for 20 minutes'). Ensure the 3 tasks offer a mix of their focus areas. DO NOT repeat the exact same tasks from yesterday.${yesterdayTasksHtml}
STRICT RULE: You MUST return ONLY a raw JSON array of exactly 3 objects.
NO markdown formatting (do not wrap in \`\`\`json). NO conversational text.
Example format:
[{"task": "Write script for YouTube video", "stat": "charisma", "xp": 30}, {"task": "Do 15 mins of HIIT cardio", "stat": "discipline", "xp": 40}, {"task": "Ice your face", "stat": "looks", "xp": 30}]`;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;
    let tasksArray = null;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";

      if (text.startsWith("\`\`\`json")) text = text.replace(/^\`\`\`json/, "");
      if (text.startsWith("\`\`\`")) text = text.replace(/^\`\`\`/, "");
      if (text.endsWith("\`\`\`")) text = text.replace(/\`\`\`$/, "");
      text = text.trim();

      tasksArray = JSON.parse(text);
      if (!Array.isArray(tasksArray) || tasksArray.length === 0) {
        throw new Error("Invalid format from AI");
      }
    } catch (e) {
      console.error("Failed to generate personalized tasks, using fallback", e);
      tasksArray = [
        { "task": "Do daily spine lengthening stretches", "stat": "discipline", "xp": 25 },
        { "task": "Cleanse, tone, moisturize your face", "stat": "looks", "xp": 25 },
        { "task": "Research one potential career path", "stat": "charisma", "xp": 30 }
      ];
    }

    localStorage.setItem('dailyTasks', JSON.stringify(tasksArray));
    renderTasks(tasksArray);
  }

  // ═══════════════════════════════════════════
  // Dashboard & UI Updates (unchanged)
  // ═══════════════════════════════════════════

  function updateDateAndGreeting() {
    const dateEl = document.querySelector('.home-date');
    const greetingEl = document.querySelector('.user-greeting');

    if (dateEl) {
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      const today = new Date().toLocaleDateString('en-US', options).toUpperCase();
      dateEl.textContent = today;
    }

    if (greetingEl) {
      const hour = new Date().getHours();
      let greeting = "Good Evening";
      if (hour < 12) greeting = "Good Morning";
      else if (hour < 18) greeting = "Good Afternoon";

      const nameSpan = greetingEl.querySelector('.user-name-display');
      const nameHtml = nameSpan ? nameSpan.outerHTML : '<span class="user-name-display"></span>';

      greetingEl.innerHTML = `${greeting},<br/>${nameHtml}`;
      if (userProfile && userProfile.name) {
        applyProfileToUI(userProfile);
      }
    }
  }

  function updateHomeDashboard() {
    updateDateAndGreeting();
    updateDashboardUI();
  }

  function updateDashboardUI() {
    const state = playerSystem.state;

    const streakEl = document.getElementById("rpg-streak-count");
    if (streakEl) streakEl.textContent = state.streak || 0;

    const levelEl = document.getElementById("rpg-current-level");
    if (levelEl) levelEl.textContent = state.level || 1;

    const currentXpEl = document.getElementById("rpg-current-xp");
    const nextXpEl = document.getElementById("rpg-next-xp");
    const levelRing = document.getElementById("rpg-level-ring");

    const xpForCurrent = playerSystem.getXPForCurrentLevel();
    const xpForNext = playerSystem.getXPForNextLevel();

    const xpIntoLevel = Math.max(0, (state.totalXP || 0) - xpForCurrent);
    const xpNeededForLevel = Math.max(1, xpForNext - xpForCurrent);

    if (currentXpEl) currentXpEl.textContent = xpIntoLevel;
    if (nextXpEl) nextXpEl.textContent = xpNeededForLevel;

    if (levelRing) {
      const circumference = 314.159;
      const percent = Math.min(xpIntoLevel / xpNeededForLevel, 1);
      levelRing.style.strokeDashoffset = circumference - (percent * circumference);
    }

    const c = state.stats?.charisma || 0;
    const l = state.stats?.looks || 0;
    const d = state.stats?.discipline || 0;
    const maxStat = Math.max(10, c, l, d);

    const updateStat = (id, value) => {
      const valEl = document.getElementById(`rpg-stat-${id}-val`);
      const fillEl = document.getElementById(`rpg-stat-${id}-fill`);
      if (valEl) valEl.textContent = value;
      if (fillEl) {
        const pct = (value / maxStat) * 100;
        fillEl.style.width = `${pct}%`;
      }
    };

    updateStat('charisma', c);
    updateStat('looks', l);
    updateStat('discipline', d);
  }

  const testBtn = document.getElementById("rpg-test-btn");
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      const result = playerSystem.gainXP(50, 'discipline');
      console.log("XP Gained:", result);
      updateDashboardUI();
    });
  }

  function updateProfileView() {
    const profile = getStoredProfile();
    if (!profile) return;

    const nameDisplayEl = document.getElementById("profile-name-display");
    const initialEl = document.getElementById("profile-avatar-initial");

    if (nameDisplayEl) nameDisplayEl.textContent = profile.name || "User Name";
    if (initialEl && profile.name) {
      initialEl.textContent = profile.name.charAt(0).toUpperCase();
    }
  }

  // ═══════════════════════════════════════════
  // Chat (unchanged)
  // ═══════════════════════════════════════════

  function appendMessage(sender, text) {
    if (!chatHistory || !text) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("chat-message");

    if (sender === "user") {
      wrapper.classList.add("chat-message-user");
    } else {
      wrapper.classList.add("chat-message-ai");
    }

    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");

    const body = document.createElement("p");

    let formatted = String(text);
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/\n/g, "<br>");

    body.innerHTML = formatted;
    bubble.appendChild(body);

    const meta = document.createElement("span");
    meta.classList.add("chat-meta");
    meta.textContent = sender === "user" ? "You" : "Coach";

    wrapper.appendChild(bubble);
    wrapper.appendChild(meta);

    chatHistory.appendChild(wrapper);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  async function fetchGeminiResponse(prompt) {
    const trimmed = (prompt || "").trim();
    if (!trimmed) return null;

    let profile = null;
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      try {
        profile = JSON.parse(storedProfile);
      } catch (e) {
        console.warn("Failed to parse userProfile from storage", e);
      }
    }

    const personaPrompt =
      profile && profile.name
        ? `You are an elite Confidence, Looks, and Discipline Coach. Your client is ${profile.name}, a ${profile.age}yo. Fitness Level: ${profile.trainingFrequency}. Physical Goal: ${profile.primaryGoal}. Aesthetic Focus: ${profile.aestheticFocus}. Career/Hobby Grind: ${profile.hobbyGrind}. STRICT RULES: Tailor all advice specifically to these metrics. Keep responses punchy, 1-3 short sentences or max 3 bullet points. Use emojis. The user says: ${trimmed}`
        : 'You are an elite, high-energy Confidence and Fitness Coach inside a mobile app. NEVER write long essays. Keep responses extremely concise—strictly 1-3 short sentences, or a max 3 short bullet points. Be punchy and use emojis. The user says: ' +
        trimmed;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      API_KEY;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: personaPrompt }] }],
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        console.error("Google says exactly this:", errorDetails);
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      return text;
    } catch (error) {
      console.error("Gemini API error:", error);
      appendMessage(
        "ai",
        "Sorry, I'm having trouble reaching your Confidence Coach right now. Please try again in a moment."
      );
      return null;
    }
  }

  async function handleSend() {
    if (!chatInput) return;

    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage("user", text);
    chatInput.value = "";

    appendMessage("ai", "Coach is typing...");
    const typingIndicator = chatHistory.lastElementChild;

    const responseText = await fetchGeminiResponse(text);

    if (typingIndicator && typingIndicator.parentNode === chatHistory) {
      chatHistory.removeChild(typingIndicator);
    }

    if (responseText) {
      appendMessage("ai", responseText);
    }
  }

  if (chatSend) {
    chatSend.addEventListener("click", () => {
      handleSend();
    });
  }

  if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    });
  }

  // ── Edit Tasks Toggle ──
  const editTasksBtn = document.getElementById("edit-tasks-btn");
  const taskListContainer = document.getElementById("task-container");

  if (editTasksBtn && taskListContainer) {
    editTasksBtn.addEventListener("click", () => {
      const isEditMode = taskListContainer.classList.toggle("edit-mode");
      editTasksBtn.textContent = isEditMode ? "Done" : "Edit";
    });
  }

  // ── Add Custom Task ──
  const addCustomTaskBtn = document.getElementById("add-custom-task-btn");
  if (addCustomTaskBtn) {
    addCustomTaskBtn.addEventListener("click", () => {
      const newTask = prompt("Add a new task/action:");
      if (newTask !== null && newTask.trim() !== "") {
        if (taskListContainer) {
          const wrapper = document.createElement("div");
          wrapper.className = "task-item";
          wrapper.setAttribute("data-type", "custom");
          wrapper.innerHTML = `
            <label class="task-label" style="flex: 1;">
              <input type="checkbox" class="task-checkbox" data-stat="discipline" data-xp="20">
              <span class="task-custom-checkbox"></span>
              <span class="task-text">${newTask}</span>
            </label>
            <div class="task-edit-actions">
              <button type="button" class="btn-icon edit" title="Edit text">✏️</button>
              <button type="button" class="btn-icon delete" title="Delete task">🗑️</button>
            </div>
          `;
          taskListContainer.appendChild(wrapper);

          const newCheckbox = wrapper.querySelector(".task-checkbox");
          if (newCheckbox) {
            newCheckbox.addEventListener("change", handleTaskToggle);
          }

          const editBtn = wrapper.querySelector(".edit");
          const deleteBtn = wrapper.querySelector(".delete");
          const taskTextSpan = wrapper.querySelector(".task-text");

          if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
              if (newCheckbox.checked) {
                newCheckbox.checked = false;
                handleTaskToggle({ target: newCheckbox });
              }
              wrapper.remove();
              checkDailyStreak();
            });
          }
          if (editBtn) {
            editBtn.addEventListener("click", () => {
              const updated = prompt("Update task:", taskTextSpan.textContent);
              if (updated !== null && updated.trim() !== "") {
                taskTextSpan.textContent = updated;
              }
            });
          }
          checkDailyStreak();
        }
      }
    });
  }

  // ── FAB → AI Camera Tracker ──
  const fab = document.querySelector(".fab");
  const viewCamera = document.getElementById("view-camera");
  const closeCameraBtn = document.getElementById("close-camera-btn");

  if (fab && viewCamera) {
    fab.addEventListener("click", () => {
      // Hide all views + nav + FAB
      viewHome.style.display = "none";
      viewCoach.style.display = "none";
      if (viewProfile) viewProfile.style.display = "none";
      if (bottomNav) bottomNav.style.display = "none";
      fab.style.display = "none";

      // Show camera view
      viewCamera.style.display = "";
      // Initialize AI tracker
      if (typeof AITracker !== "undefined") {
        AITracker.init();
      }
    });
  }

  if (closeCameraBtn && viewCamera) {
    closeCameraBtn.addEventListener("click", () => {
      // Stop tracker
      if (typeof AITracker !== "undefined") {
        AITracker.stop();
      }
      // Hide camera view
      viewCamera.style.display = "none";

      // Restore nav + FAB + home view
      if (bottomNav) bottomNav.style.display = "";
      if (fab) fab.style.display = "";
      showView("home");
      setActiveNav("home");
    });
  }

  // ── PWA Service Worker ──
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
});

// ── PWA Install Prompt ──
let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';

  installBtn.addEventListener('click', () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      deferredPrompt = null;
    });
  });
});