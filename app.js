const API_KEY = CONFIG.GEMINI_API_KEY;
const playerSystem = new RPGEngine();
document.addEventListener("DOMContentLoaded", () => {
  const viewHome = document.getElementById("view-home");
  const viewCoach = document.getElementById("view-coach");
  const viewProfile = document.getElementById("view-profile");

  const navItems = document.querySelectorAll(".bottom-nav-item");
  const bottomNav = document.querySelector(".bottom-nav");

  const onboardingScreen = document.getElementById("onboarding-screen");
  const userNameDisplays = document.querySelectorAll(".user-name-display");
  const quizSteps = document.querySelectorAll(".quiz-step");
  const quizStepLabel = document.getElementById("quiz-step-label");
  const quizLoading = document.getElementById("quiz-loading");
  const quizFinishButton = document.getElementById("quiz-finish");
  const quizOptions = document.querySelectorAll(".quiz-option");
  const quizNextButtons = document.querySelectorAll(".quiz-next");
  const quizTargetLabel = document.getElementById("quiz-target-label");
  const backButtons = document.querySelectorAll(".back-btn");
  const heightUnitToggle = document.getElementById("height-unit-toggle");
  const weightUnitToggle = document.getElementById("weight-unit-toggle");
  const targetUnitToggle = document.getElementById("target-unit-toggle");
  const step5NumberInput = document.getElementById("step-5-number-input");
  const step5Cards = document.getElementById("step-5-cards");

  let currentStep = 1;
  let userData = {};

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

  // Chat UI bindings
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatHistory = document.getElementById("chat-history");

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
    if (!onboardingScreen) return;
    if (showOnboarding) {
      onboardingScreen.classList.remove("hidden");
      if (bottomNav) bottomNav.classList.add("hidden");
    } else {
      onboardingScreen.classList.add("hidden");
      if (bottomNav) bottomNav.classList.remove("hidden");
    }
  }

  const existingProfile = getStoredProfile();
  if (existingProfile) {
    userData = existingProfile;
    setOnboardingVisibility(false);
    applyProfileToUI(existingProfile);
    updateHomeDashboard();
    updateProfileView();
  } else {
    setOnboardingVisibility(true);
  }

  function goToStep(stepNumber) {
    currentStep = stepNumber;
    quizSteps.forEach((step) => {
      step.classList.remove("active");
    });
    const target = document.querySelector(
      `.quiz-step[data-step="${stepNumber}"]`
    );
    if (target) {
      target.classList.add("active");
    }
    if (quizStepLabel) {
      const total = quizSteps.length;
      quizStepLabel.textContent = `Step ${stepNumber} of ${total}`;
    }
    if (stepNumber === 5) {
      if (!quizTargetLabel) return;
      const goal = userData.primaryGoal;
      if (goal === "Build Muscle") {
        quizTargetLabel.textContent = "What is your target physique?";
        if (step5NumberInput) step5NumberInput.classList.add("hidden");
        if (step5Cards) step5Cards.classList.remove("hidden");
      } else {
        if (step5NumberInput) step5NumberInput.classList.remove("hidden");
        if (step5Cards) step5Cards.classList.add("hidden");
        if (goal === "Increase Height") {
          quizTargetLabel.textContent = "What is your target height (cm)?";
        } else if (goal === "Lose Weight") {
          quizTargetLabel.textContent = "What is your target weight (kg)?";
        } else {
          quizTargetLabel.textContent = "What is your specific target?";
        }
      }
    }
  }

  quizNextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.step);
      const next = Number(button.dataset.nextStep);
      if (!step || !next) return;

      if (step === 1) {
        const input = document.getElementById("quiz-name");
        const value = input?.value.trim();
        if (!value) return;
        userData.name = value;
        applyProfileToUI(userData);
      } else if (step === 2) {
        const input = document.getElementById("quiz-age");
        const value = input?.value.trim();
        if (!value) return;
        userData.age = value;
      } else if (step === 3) {
        const heightCmInput = document.getElementById("quiz-height");
        const heightFtInput = document.getElementById("quiz-height-ft");
        const heightInInput = document.getElementById("quiz-height-in");
        const weightInput = document.getElementById("quiz-weight");

        const heightUnit =
          heightUnitToggle?.querySelector(".unit-option.active")?.dataset
            .unit || "cm";
        const weightUnit =
          weightUnitToggle?.querySelector(".unit-option.active")?.dataset
            .unit || "kg";

        let heightCm = null;
        if (heightUnit === "cm") {
          const h = heightCmInput?.value.trim();
          if (!h) return;
          heightCm = parseFloat(h);
        } else {
          const ft = parseFloat(heightFtInput?.value.trim() || "0");
          const inch = parseFloat(heightInInput?.value.trim() || "0");
          if (!ft && !inch) return;
          heightCm = ft * 30.48 + inch * 2.54;
        }

        const wRaw = weightInput?.value.trim();
        if (!wRaw) return;
        let weightKg =
          weightUnit === "kg"
            ? parseFloat(wRaw)
            : parseFloat(wRaw) / 2.20462;

        if (!heightCm || !weightKg) return;
        userData.currentHeight = Math.round(heightCm);
        userData.currentWeight = Math.round(weightKg);
      } else if (step === 5) {
        const targetInput = document.getElementById("quiz-target");
        const targetUnit =
          targetUnitToggle?.querySelector(".unit-option.active")?.dataset
            .unit || "kgcm";
        const goal = userData.primaryGoal;
        const raw = targetInput?.value.trim();
        if (!raw) return;
        let numeric = parseFloat(raw);
        if (!numeric) return;

        if (goal === "Increase Height") {
          // height target
          if (targetUnit === "imperial") {
            // treat input as inches of extra? keep simple: assume cm direct even in imperial toggle
          }
          userData.targetValue = Math.round(numeric); // cm
        } else {
          // weight target
          if (targetUnit === "imperial") {
            numeric = numeric / 2.20462; // lbs -> kg
          }
          userData.targetValue = Math.round(numeric); // kg
        }
      } else if (step === 8) {
        const hobby = document.getElementById("quiz-hobby")?.value.trim();
        if (!hobby) return;
        userData.hobbyGrind = hobby;
      }

      if (step === 8) return;
      goToStep(next);
    });
  });

  quizOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const parent = option.closest(".quiz-options");
      if (!parent) return;
      const field = parent.getAttribute("data-field");
      const valueAttr = option.getAttribute("data-value");
      const targetCard = option.getAttribute("data-target-card");

      parent
        .querySelectorAll(".quiz-option")
        .forEach((o) => o.classList.remove("active"));
      option.classList.add("active");

      const step = Number(option.dataset.step);
      if (!step) return;

      if (step === 5 && targetCard) {
        // physique choice for Build Muscle
        userData.targetValue = targetCard;
      } else if (field && valueAttr) {
        userData[field] = valueAttr;
      }

      setTimeout(() => {
        goToStep(step + 1);
      }, 200);
    });
  });

  async function generateDailyTasks(userProfile) {
    const prompt = `You are an AI coach. Based on this user: ${JSON.stringify(userProfile)}, generate exactly 3 daily tasks. Task 1: physical. Task 2: aesthetic. Task 3: career. STRICT RULE: Each task MUST be a short, punchy title (maximum 5-8 words). NO reasoning, NO explanations. (Example: "Do 50 crunches", "Record a video for 200 subs"). Respond ONLY with a valid JSON array of 3 strings.`;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";

      let tasksArray = [];
      try {
        tasksArray = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse task JSON", e, text);
        tasksArray = ["100 pushups", "Drink water", "Read an article"];
      }
      localStorage.setItem('dailyTasks', JSON.stringify(tasksArray));
    } catch (e) {
      console.error("Failed to generate daily tasks", e);
      localStorage.setItem('dailyTasks', JSON.stringify(["100 pushups", "Drink water", "Read an article"]));
    }
  }

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
      if (userData && userData.name) {
        applyProfileToUI(userData);
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

  async function finishOnboarding() {
    if (quizLoading) {
      quizLoading.classList.remove("hidden");
    }
    quizSteps.forEach((step) => step.classList.remove("active"));

    await generateDailyTasks(userData);

    localStorage.setItem("userProfile", JSON.stringify(userData));
    applyProfileToUI(userData);
    setOnboardingVisibility(false);

    showView("home");
    setActiveNav("home");
    updateHomeDashboard();
    updateProfileView();
  }

  if (quizFinishButton) {
    quizFinishButton.addEventListener("click", () => {
      const hobby = document.getElementById("quiz-hobby")?.value.trim();
      if (!hobby) return;
      userData.hobbyGrind = hobby;
      finishOnboarding();
    });
  }

  goToStep(currentStep);

  // Back buttons
  backButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const backStep = Number(btn.dataset.backStep);
      if (!backStep || backStep < 1) return;
      goToStep(backStep);
    });
  });

  // Unit toggles
  function wireUnitToggle(toggleEl, onChange) {
    if (!toggleEl) return;
    toggleEl.querySelectorAll(".unit-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        toggleEl
          .querySelectorAll(".unit-option")
          .forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");
        if (onChange) onChange(opt.dataset.unit);
      });
    });
  }

  wireUnitToggle(heightUnitToggle, (unit) => {
    const cmGroup = document.getElementById("height-cm-group");
    const ftinGroup = document.getElementById("height-ftin-group");
    if (!cmGroup || !ftinGroup) return;
    if (unit === "ftin") {
      cmGroup.classList.add("hidden");
      ftinGroup.classList.remove("hidden");
    } else {
      cmGroup.classList.remove("hidden");
      ftinGroup.classList.add("hidden");
    }
  });

  wireUnitToggle(weightUnitToggle);
  wireUnitToggle(targetUnitToggle);

  // Global Enter key support for quiz
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const activeStep = document.querySelector(".quiz-step.active");
    if (!activeStep) return;

    const isInputFocused =
      document.activeElement &&
      activeStep.contains(document.activeElement) &&
      (document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA");

    if (!isInputFocused) return;

    const stepNum = Number(activeStep.dataset.step);
    if (!stepNum) return;

    if (stepNum === 8 && quizFinishButton) {
      e.preventDefault();
      quizFinishButton.click();
      return;
    }

    const nextButton = activeStep.querySelector(".quiz-next");
    if (nextButton) {
      e.preventDefault();
      nextButton.click();
    }
  });

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

    // Basic markdown formatting for AI/user messages
    let formatted = String(text);
    // Bold **text**
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic *text*
    formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Newlines to <br>
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
        ? `You are an elite Confidence, Looks, and Discipline Coach. Your client is ${profile.name}, a ${profile.age}yo. Height: ${profile.currentHeight}cm, Weight: ${profile.currentWeight}kg. Fitness Level: ${profile.fitnessLevel}. Physical Goal: ${profile.primaryGoal || profile.physicalGoal} (Target: ${profile.targetValue}). Aesthetic Focus: ${profile.aestheticFocus}. Career/Hobby Grind: ${profile.hobbyGrind}. STRICT RULES: Tailor all advice specifically to these metrics. Keep responses punchy, 1-3 short sentences or max 3 bullet points. Use emojis. The user says: ${trimmed}`
        : 'You are an elite, high-energy Confidence and Fitness Coach inside a mobile app. Your user is Jayesh. NEVER write long essays. Keep responses extremely concise—strictly 1-3 short sentences, or a max 3 short bullet points. Be punchy and use emojis. The user says: ' +
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

    // Show loading state
    appendMessage("ai", "Coach is typing...");
    const typingIndicator = chatHistory.lastElementChild;

    const responseText = await fetchGeminiResponse(text);

    // Remove typing indicator
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

  // Edit Tasks Toggle
  const editTasksBtn = document.getElementById("edit-tasks-btn");
  const taskListContainer = document.getElementById("dynamic-task-list");

  if (editTasksBtn && taskListContainer) {
    editTasksBtn.addEventListener("click", () => {
      const isEditMode = taskListContainer.classList.toggle("edit-mode");
      editTasksBtn.textContent = isEditMode ? "Done" : "Edit";
    });
  }

  // Add Custom Task inside Edit Mode
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

  // FAB / floating plus button
  const fab = document.querySelector(".fab");
  if (fab) {
    fab.addEventListener("click", () => {
      alert("⚡ AI Camera Tracking Booting Up... (Coming in Phase 6)");
    });
  }

  // Register PWA service worker
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
let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome from auto-showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Un-hide our custom button!
  installBtn.style.display = 'block';

  installBtn.addEventListener('click', () => {
    // Hide the button
    installBtn.style.display = 'none';
    // Show the native browser install prompt
    deferredPrompt.prompt();
    // Wait for user to click Install
    deferredPrompt.userChoice.then((choiceResult) => {
      deferredPrompt = null;
    });
  });
});