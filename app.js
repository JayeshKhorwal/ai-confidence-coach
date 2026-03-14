const API_KEY = CONFIG.GEMINI_API_KEY;

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

  function applyTaskState(label, checked) {
    const checkbox = label.querySelector(".task-checkbox");
    const custom = label.querySelector(".task-custom-checkbox");
    const text = label.querySelector(".task-text");

    if (!checkbox || !custom || !text) return;

    checkbox.checked = checked;

    if (checked) {
      custom.classList.add("checked");
      text.classList.add("task-completed");
    } else {
      custom.classList.remove("checked");
      text.classList.remove("task-completed");
    }
  }

  function initTasks() {
    const taskLabels = document.querySelectorAll(".task-item .task-label");

    taskLabels.forEach((label) => {
      const textEl = label.querySelector(".task-text");
      if (!textEl) return;

      const rawText = textEl.textContent.trim();
      const taskId = toTaskId(rawText);

      const stored = localStorage.getItem(taskId);
      const isChecked = stored === "true";
      applyTaskState(label, isChecked);

      label.addEventListener("click", (event) => {
        // Avoid toggling twice if browser toggles checkbox
        event.preventDefault();

        const checkbox = label.querySelector(".task-checkbox");
        if (!checkbox) return;

        const nextChecked = !checkbox.checked;
        applyTaskState(label, nextChecked);
        localStorage.setItem(taskId, String(nextChecked));
      });
    });
  }

  initTasks();

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

    const tasksRaw = localStorage.getItem("dailyTasks");
    let tasks = [];
    if (tasksRaw) {
      try {
        tasks = JSON.parse(tasksRaw);
      } catch (e) {
        tasks = [];
      }
    }

    if (!tasks || tasks.length === 0) {
      tasks = ["100 pushups", "Drink water", "Read an article"];
    }

    const container = document.getElementById("dynamic-task-list");
    if (container) {
      container.innerHTML = "";
      tasks.forEach(taskText => {
        const div = document.createElement("div");
        div.className = "task-item";
        div.innerHTML = `
          <label class="task-label">
            <input type="checkbox" class="task-checkbox">
            <span class="task-custom-checkbox"></span>
            <span class="task-text">${taskText}</span>
          </label>
        `;
        container.appendChild(div);
      });
      initTasks();
    }

    const fitness = userData.fitnessLevel || "Beginner";
    let basePercent = 10;
    if (fitness === "Intermediate") basePercent = 35;
    else if (fitness === "Advanced") basePercent = 60;

    const charismaRing = document.getElementById("charisma-percent");
    const looksRing = document.getElementById("looks-percent");
    const disciplineRing = document.getElementById("discipline-percent");

    const looksPercent = Math.min(basePercent + 10, 100);
    const disciplinePercent = Math.min(basePercent + 20, 100);

    if (charismaRing) charismaRing.textContent = `${basePercent}%`;
    if (looksRing) looksRing.textContent = `${looksPercent}%`;
    if (disciplineRing) disciplineRing.textContent = `${disciplinePercent}%`;

    const charismaCircle = document.getElementById("ring-charisma-circle");
    const looksCircle = document.getElementById("ring-looks-circle");
    const disciplineCircle = document.getElementById("ring-discipline-circle");

    if (charismaCircle) {
      charismaCircle.style.strokeDashoffset = 251.2 - (251.2 * (basePercent / 100));
    }
    if (looksCircle) {
      looksCircle.style.strokeDashoffset = 251.2 - (251.2 * (looksPercent / 100));
    }
    if (disciplineCircle) {
      disciplineCircle.style.strokeDashoffset = 251.2 - (251.2 * (disciplinePercent / 100));
    }
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

    const reply = await fetchGeminiResponse(text);
    if (reply) {
      appendMessage("ai", reply);
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

  // FAB / floating plus button
  const fab = document.querySelector(".fab");
  if (fab) {
    fab.addEventListener("click", () => {
      alert("AI Camera Tracking coming in Phase 5! 📸💪");
    });
  }
});