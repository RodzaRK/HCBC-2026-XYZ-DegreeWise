const defaultUniversity = "Southeast Missouri State University";

const demoSemesters = [
  {
    title: "Fall 2026",
    courses: [
      {
        name: "CS 265 - Computer Science II",
        credits: 3,
        professor: "Ziping Liu",
        days: "MWF",
        startTime: "09:00",
        modality: "in-person",
        professorSignal: demoProfessorSignal("Ziping Liu", "Computer Science", 4.1, 3.2, 85),
        courseInfo: demoCourseInfo("CS 265", "Computer Science II", "01", "20341", "Dr Ziping Liu", {
          days: "MWF",
          time: "9:00 AM",
          workloadHours: 12,
          prerequisites: "Prerequisite: CS 155."
        })
      },
      {
        name: "CY 201 - Intro to Cybersecurity",
        credits: 3,
        professor: "Ethan Chou",
        days: "TTh",
        startTime: "09:30",
        modality: "in-person",
        professorSignal: demoProfessorSignal("Ethan Chou", "Cybersecurity", 4.7, 2.6, 92),
        courseInfo: demoCourseInfo("CY 201", "Intro to Cybersecurity", "01", "20342", "Dr Ethan Chou", {
          days: "TTh",
          time: "9:30 AM",
          workloadHours: 11,
          description: "Introductory cybersecurity course with weekly labs and security exercises."
        })
      },
      {
        name: "CS 351 - C & the Posix Environment",
        credits: 3,
        professor: "Juefei Yuan",
        days: "MW",
        startTime: "11:00",
        modality: "in-person",
        professorSignal: demoProfessorSignal("Juefei Yuan", "Computer Science", 4.2, 3.0, 88),
        courseInfo: demoCourseInfo("CS 351", "C & the Posix Environment", "01", "20343", "Dr Juefei Yuan", {
          days: "MW",
          time: "11:00 AM",
          workloadHours: 13,
          prerequisites: "Prerequisite: CS 265.",
          description: "Systems programming course with C, Posix tools, projects, and command-line labs."
        })
      },
      {
        name: "CY 320 - Access Control",
        credits: 3,
        professor: "Zhouzhou Li",
        days: "TTh",
        startTime: "12:00",
        modality: "in-person",
        professorSignal: demoProfessorSignal("Zhouzhou Li", "Cybersecurity", 4.0, 3.3, 84),
        courseInfo: demoCourseInfo("CY 320", "Access Control", "01", "20344", "Dr Zhouzhou Li", {
          days: "TTh",
          time: "12:00 PM",
          workloadHours: 12,
          prerequisites: "Prerequisite: CY 201.",
          description: "Cybersecurity access control course with policy analysis, security models, and applied projects."
        })
      },
      {
        name: "PY 101 - Introduction to Psychology",
        credits: 3,
        professor: "Emilie Kay Beltzer",
        days: "M",
        startTime: "13:30",
        modality: "online",
        professorSignal: demoProfessorSignal("Emilie Kay Beltzer", "Psychology", 4.3, 2.6, 88),
        courseInfo: demoCourseInfo("PY 101", "Introduction to Psychology", "90", "20345", "Dr Emilie Kay Beltzer", {
          days: "M",
          time: "1:30 PM",
          workloadHours: 8,
          session: "Online",
          description: "Online general education course with readings, quizzes, and short reflection assignments."
        })
      },
      {
        name: "RS 202 - Old Testament Literature",
        credits: 3,
        professor: "Bruce W Gentry",
        days: "F",
        startTime: "10:30",
        modality: "online",
        professorSignal: demoProfessorSignal("Bruce W Gentry", "Religious Studies", 4.0, 2.8, 84),
        courseInfo: demoCourseInfo("RS 202", "Old Testament Literature", "90", "20346", "Dr Bruce W Gentry", {
          days: "F",
          time: "10:30 AM",
          workloadHours: 8,
          session: "Online",
          description: "Online humanities course with steady reading and discussion assignments."
        })
      }
    ]
  }
];

const state = {
  semesters: cloneDemoSemesters(),
  selectedSemester: 0,
  apiOnline: false,
  aiAnalysis: null,
  aiDisabled: false,
  aiPendingSignature: "",
  chatHistory: [],
  degreePlan: null,
  degreePlanUploading: false,
  simulationBase: null,
  simulationEvents: []
};

const semesterContainer = document.querySelector("#semesters");
const semesterTemplate = document.querySelector("#semesterTemplate");
const classRowTemplate = document.querySelector("#classRowTemplate");
const riskGauge = document.querySelector("#riskGauge");
const riskGaugeText = document.querySelector("#riskGaugeText");
const riskScore = document.querySelector("#riskScore");
const riskLabel = document.querySelector("#riskLabel");
const suggestionList = document.querySelector("#suggestionList");
const briefScoreGrid = document.querySelector("#briefScoreGrid");
const scheduleComment = document.querySelector("#scheduleComment");
const detailBreakdown = document.querySelector("#detailBreakdown");
const chatMessages = document.querySelector("#chatMessages");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const themeToggle = document.querySelector("#themeToggle");
const resetDemo = document.querySelector("#resetDemo");
const universityInput = document.querySelector("#university");
const apiStatus = document.querySelector("#apiStatus");
const aiStatus = document.querySelector("#aiStatus");
const courseSuggestions = document.querySelector("#courseSuggestions");
const professorSuggestions = document.querySelector("#professorSuggestions");
const degreeMapUpload = document.querySelector("#degreeMapUpload");
const degreeMapButton = document.querySelector("#degreeMapButton");
const degreeMapStatus = document.querySelector("#degreeMapStatus");
const degreePlanSummary = document.querySelector("#degreePlanSummary");
const degreePlanGrid = document.querySelector("#degreePlanGrid");
const advisorExport = document.querySelector("#advisorExport");
const startSimulation = document.querySelector("#startSimulation");
const saveSimulation = document.querySelector("#saveSimulation");
const discardSimulation = document.querySelector("#discardSimulation");
const simulateAddLight = document.querySelector("#simulateAddLight");
const simulateMoveHardest = document.querySelector("#simulateMoveHardest");
const simulateSwapLoad = document.querySelector("#simulateSwapLoad");
const simulationTitle = document.querySelector("#simulationTitle");
const simulationStatus = document.querySelector("#simulationStatus");
const lifeBalanceLabel = document.querySelector("#lifeBalanceLabel");
const lifeBalanceScore = document.querySelector("#lifeBalanceScore");
const lifeBalanceMeter = document.querySelector("#lifeBalanceMeter");
const lifeBalanceReasons = document.querySelector("#lifeBalanceReasons");
const prerequisiteWarnings = document.querySelector("#prerequisiteWarnings");
const backupPlanList = document.querySelector("#backupPlanList");

const courseSearchTimers = new WeakMap();
const professorLookupTimers = new WeakMap();
let aiAnalysisTimer = null;

const prerequisiteRules = {
  "CS 265": { allOf: ["CS 155"] },
  "CS 300": { anyOf: [["CS 265"], ["CS 155", "MA 223"]] },
  "CS 351": { allOf: ["CS 265"] },
  "CS 380": { allOf: ["CS 351"] },
  "CS 390": { allOf: ["CS 300", "MA 223"] },
  "CS 440": { allOf: ["CS 380"] },
  "CS 445": { allOf: ["CS 300"] },
  "CS 460": { allOf: ["CS 300"] },
  "CS 480": { anyOf: [["CS 300"], ["CY 310"]] },
  "CS 495": { allOf: ["CS 499"] },
  "CS 499": { allOf: ["CS 300"] },
  "CY 310": { allOf: ["CY 201"] },
  "CY 320": { allOf: ["CY 201"] },
  "CY 350": { allOf: ["CY 310"] },
  "CY 410": { allOf: ["CY 320"] },
  "CY 430": { allOf: ["CY 310"] },
  "CY 440": { allOf: ["CY 350"] },
  "CY 450": { allOf: ["CY 310"] },
  "CY 470": { anyOf: [["CY 410"], ["CY 430"]] },
  "CY 480": { allOf: ["CY 350"] },
  "CY 490": { allOf: ["CY 440", "CY 450"] },
  "MA 345": { anyOf: [["MA 223"], ["MA 134"]] }
};

const backupCourseCatalog = [
  { code: "PY 101", title: "Introduction to Psychology", credits: 3, requirement: "Social Science", workload: 3, professorQuality: 4.1 },
  { code: "RS 202", title: "Old Testament Literature", credits: 3, requirement: "Humanities", workload: 4, professorQuality: 4.0 },
  { code: "SC 105", title: "Fundamentals of Oral Communication", credits: 3, requirement: "Oral Communication", workload: 3, professorQuality: 4.2 },
  { code: "PS 103", title: "US Political Systems", credits: 3, requirement: "Civics", workload: 4, professorQuality: 3.9 },
  { code: "AR 100", title: "Art Appreciation", credits: 3, requirement: "Fine Arts", workload: 2, professorQuality: 4.0 },
  { code: "GO 150", title: "People and Places of the World", credits: 3, requirement: "Global Perspectives", workload: 3, professorQuality: 3.8 },
  { code: "CY 201", title: "Introduction to Cybersecurity", credits: 3, requirement: "Major Foundation", workload: 5, professorQuality: 4.2 },
  { code: "CS 265", title: "Computer Science II", credits: 3, requirement: "Major Sequence", workload: 6, professorQuality: 4.1 },
  { code: "MA 223", title: "Discrete Mathematics", credits: 3, requirement: "Math", workload: 6, professorQuality: 3.9 }
];

const savedTheme = localStorage.getItem("degreewise-theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.dataset.theme = "dark";
}

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = current;
  localStorage.setItem("degreewise-theme", current);
});

resetDemo.addEventListener("click", () => {
  universityInput.value = defaultUniversity;
  state.semesters = cloneDemoSemesters();
  state.selectedSemester = 0;
  state.aiAnalysis = null;
  state.aiDisabled = false;
  state.aiPendingSignature = "";
  state.chatHistory = [];
  state.simulationBase = null;
  state.simulationEvents = [];
  resetChatMessages();
  setAiStatus("AI checking", "pending");
  render();
});

universityInput.addEventListener("change", () => {
  clearRemoteSignals();
  state.aiAnalysis = null;
  state.aiDisabled = false;
  state.aiPendingSignature = "";
  state.chatHistory = [];
  resetChatMessages();
  setAiStatus("AI checking", "pending");
  render();
});

advisorExport.addEventListener("click", () => {
  exportAdvisorSummary();
});

startSimulation.addEventListener("click", () => {
  beginSimulation("Started a temporary what-if simulation.");
});

saveSimulation.addEventListener("click", () => {
  state.simulationBase = null;
  state.simulationEvents = ["Simulation saved into the live plan."];
  render();
});

discardSimulation.addEventListener("click", () => {
  if (state.simulationBase) {
    state.semesters = JSON.parse(JSON.stringify(state.simulationBase));
  }
  state.simulationBase = null;
  state.simulationEvents = ["Temporary simulation discarded."];
  render();
});

simulateAddLight.addEventListener("click", () => {
  beginSimulation("Added a light general education class.");
  const semester = state.semesters[state.selectedSemester] || state.semesters[0];
  const option = nextLightBackupCourse(semester);
  semester.courses.push({
    name: `${option.code} - ${option.title}`,
    credits: option.credits,
    professor: "",
    courseInfo: {
      code: option.code,
      title: option.title,
      credits: option.credits,
      description: `${option.requirement}. Low-load backup option.`,
      workloadHours: option.workload * 2,
      source: "What-if simulator"
    }
  });
  render();
});

simulateMoveHardest.addEventListener("click", () => {
  beginSimulation("Moved the hardest current class one semester later.");
  moveHardestCourseToNextSemester();
  render();
});

simulateSwapLoad.addEventListener("click", () => {
  beginSimulation("Swapped a high-load class for a lower-load backup.");
  swapHighestLoadCourse();
  render();
});

degreeMapButton.addEventListener("click", () => {
  degreeMapUpload.click();
});

degreeMapUpload.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  await uploadDegreeMap(file);
  degreeMapUpload.value = "";
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) {
    return;
  }
  appendChatMessage("user", question);
  chatInput.value = "";
  const pending = appendChatMessage("assistant", "Thinking...");
  let answer = "";

  try {
    answer = await generateAiScheduleAnswer(question) || generateScheduleAnswer(question);
  } catch (error) {
    reportGeminiFallback("chat", error.message);
    answer = generateScheduleAnswer(question);
  }

  pending.textContent = answer;
  rememberChatExchange(question, answer);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

async function checkApiHealth() {
  try {
    const health = await fetchJson("/api/health");
    state.apiOnline = true;
    setApiStatus("API online", "online");
    setAiStatus(health.providers?.ai === "Gemini REST API" ? "Gemini ready" : "Local AI", health.providers?.ai === "Gemini REST API" ? "online" : "local");
  } catch (error) {
    state.apiOnline = false;
    setApiStatus("Offline demo", "offline");
    setAiStatus("Local AI", "local");
  }
}

function render() {
  semesterContainer.replaceChildren();

  state.semesters.forEach((semester, semesterIndex) => {
    const block = semesterTemplate.content.firstElementChild.cloneNode(true);
    const titleInput = block.querySelector(".semester-title-input");
    const classList = block.querySelector(".class-list");
    const creditTotal = block.querySelector(".credit-total");
    const courseTotal = block.querySelector(".course-total");
    const addClassButton = block.querySelector(".add-class");

    titleInput.value = semester.title;
    titleInput.addEventListener("input", (event) => {
      semester.title = event.target.value;
      updateAnalytics();
    });

    semester.courses.forEach((course, courseIndex) => {
      const row = classRowTemplate.content.firstElementChild.cloneNode(true);
      const nameInput = row.querySelector(".class-name");
      const creditSelect = row.querySelector(".class-credits");
      const professorInput = row.querySelector(".class-professor");
      const daysInput = row.querySelector(".class-days");
      const startInput = row.querySelector(".class-start");
      const modalitySelect = row.querySelector(".class-modality");
      const removeButton = row.querySelector(".remove-class");

      nameInput.value = course.name;
      creditSelect.value = String(course.credits || 3);
      professorInput.value = course.professor;
      daysInput.value = course.days || course.courseInfo?.days || "";
      startInput.value = course.startTime || timeValueFromCourse(course);
      modalitySelect.value = course.modality || "";
      syncLookupDetail(row, course);

      nameInput.addEventListener("input", (event) => {
        course.name = event.target.value;
        course.courseStatus = course.name.trim().length > 1 ? "searching" : "";
        course.courseInfo = null;
        syncLookupDetail(row, course);
        scheduleCourseSearch(course);
        updateAnalytics();
      });

      nameInput.addEventListener("change", () => {
        lookupCourse(course, row, creditSelect, nameInput);
      });

      nameInput.addEventListener("blur", () => {
        lookupCourse(course, row, creditSelect, nameInput);
      });

      creditSelect.addEventListener("change", (event) => {
        course.credits = Number(event.target.value);
        updateAnalytics();
        updateSemesterSummary(block, semester);
      });

      professorInput.addEventListener("input", (event) => {
        course.professor = event.target.value;
        course.professorSignal = null;
        course.professorStatus = course.professor.trim().length > 1 ? "searching" : "";
        syncLookupDetail(row, course);
        scheduleProfessorLookup(course, row);
        updateAnalytics();
      });

      professorInput.addEventListener("change", () => {
        lookupProfessor(course, row);
      });

      professorInput.addEventListener("blur", () => {
        lookupProfessor(course, row);
      });

      daysInput.addEventListener("input", (event) => {
        course.days = event.target.value;
        updateAnalytics();
      });

      startInput.addEventListener("change", (event) => {
        course.startTime = event.target.value;
        updateAnalytics();
      });

      modalitySelect.addEventListener("change", (event) => {
        course.modality = event.target.value;
        updateAnalytics();
      });

      removeButton.addEventListener("click", () => {
        semester.courses.splice(courseIndex, 1);
        render();
      });

      classList.append(row);
    });

    addClassButton.addEventListener("click", () => {
      semester.courses.push({ name: "", credits: 3, professor: "" });
      state.selectedSemester = semesterIndex;
      render();
      focusLastCourse(semesterIndex);
    });

    updateSemesterSummary(block, semester);

    block.addEventListener("focusin", () => {
      state.selectedSemester = semesterIndex;
      updateAnalytics();
    });

    semesterContainer.append(block);
  });

  updateAnalytics();
  renderDegreePlan();
  requestAnimationFrame(hydrateVisibleRows);
}

function updateSemesterSummary(block, semester) {
  const creditTotal = block.querySelector(".credit-total");
  const courseTotal = block.querySelector(".course-total");
  const totalCredits = semester.courses.reduce((sum, course) => sum + Number(course.credits || 0), 0);
  creditTotal.textContent = `${totalCredits} credits`;
  courseTotal.textContent = `${semester.courses.length} courses`;
}

function addNextSemester(afterIndex) {
  const nextTitle = nextSemesterTitle(state.semesters[afterIndex]?.title || "Fall 2026");
  state.semesters.splice(afterIndex + 1, 0, {
    title: nextTitle,
    courses: [
      { name: "", credits: 3, professor: "" }
    ]
  });
  state.selectedSemester = afterIndex + 1;
  render();
  focusLastCourse(state.selectedSemester);
}

function focusLastCourse(semesterIndex) {
  requestAnimationFrame(() => {
    const semesterBlocks = semesterContainer.querySelectorAll(".semester-block");
    const targetBlock = semesterBlocks[semesterIndex];
    const inputs = targetBlock?.querySelectorAll(".class-name");
    inputs?.[inputs.length - 1]?.focus();
  });
}

function hydrateVisibleRows() {
  const blocks = semesterContainer.querySelectorAll(".semester-block");

  state.semesters.forEach((semester, semesterIndex) => {
    const rows = blocks[semesterIndex]?.querySelectorAll(".class-list .class-row") || [];
    semester.courses.forEach((course, courseIndex) => {
      const row = rows[courseIndex];
      if (!row) {
        return;
      }

      const nameInput = row.querySelector(".class-name");
      const creditSelect = row.querySelector(".class-credits");
      if (course.name.trim() && !course.courseInfo) {
        lookupCourse(course, row, creditSelect, nameInput, { quiet: true });
      }

      if (course.professor.trim() && !course.professorSignal) {
        lookupProfessor(course, row, { quiet: true });
      }
    });
  });
}

function scheduleCourseSearch(course) {
  clearTimeout(courseSearchTimers.get(course));
  const term = course.name.trim();
  if (term.length < 2) {
    courseSuggestions.replaceChildren();
    return;
  }

  const timer = setTimeout(async () => {
    try {
      const data = await fetchJson("/api/courses/search", {
        q: term,
        university: currentUniversity()
      });
      course.courseAlternatives = data.results || [];
      setCourseSuggestions(data.results || []);
    } catch (error) {
      course.courseAlternatives = [];
    }
  }, 260);

  courseSearchTimers.set(course, timer);
}

function scheduleProfessorLookup(course, row) {
  clearTimeout(professorLookupTimers.get(course));
  const name = course.professor.trim();
  if (name.length < 2) {
    return;
  }

  const timer = setTimeout(() => {
    lookupProfessor(course, row, { quiet: true });
  }, 520);

  professorLookupTimers.set(course, timer);
}

async function lookupCourse(course, row, creditSelect, nameInput, options = {}) {
  const query = course.name.trim();
  if (query.length < 2) {
    course.courseStatus = "";
    syncLookupDetail(row, course);
    return;
  }

  const scopedQuery = `${currentUniversity()}::${query}`;
  if (course.lastCourseLookupQuery === scopedQuery && course.courseInfo) {
    course.courseStatus = "";
    syncLookupDetail(row, course);
    return;
  }

  course.lastCourseLookupQuery = scopedQuery;
  course.courseStatus = options.quiet ? course.courseStatus : "loading";
  syncLookupDetail(row, course);

  try {
    const data = await fetchJson("/api/courses/lookup", {
      code: query,
      university: currentUniversity()
    });

    if (course.name.trim() !== query) {
      return;
    }

    if (data.course) {
      course.courseInfo = data.course;
      course.courseAlternatives = (data.results || []).filter((item) => item.code !== data.course.code);
      course.courseProvider = data.provider;
      course.courseFallback = Boolean(data.fallback);
      course.courseStatus = "";

      const credits = clampCredits(data.course.credits);
      if (credits) {
        course.credits = credits;
        creditSelect.value = String(credits);
      }

      if (shouldAdoptCourseName(query, data.course)) {
        course.name = data.course.name;
        nameInput.value = data.course.name;
      }
    } else {
      course.courseStatus = "not-found";
    }

    updateAnalytics();
  } catch (error) {
    course.courseStatus = "error";
  }

  syncLookupDetail(row, course);
}

async function lookupProfessor(course, row, options = {}) {
  const name = course.professor.trim();
  if (name.length < 2) {
    course.professorStatus = "";
    course.professorSignal = null;
    syncLookupDetail(row, course);
    updateAnalytics();
    return;
  }

  const scopedQuery = `${currentUniversity()}::${name}`;
  if (course.lastProfessorLookupQuery === scopedQuery && course.professorSignal) {
    course.professorStatus = "";
    syncLookupDetail(row, course);
    return;
  }

  course.lastProfessorLookupQuery = scopedQuery;
  course.professorStatus = options.quiet ? course.professorStatus : "loading";
  syncLookupDetail(row, course);

  try {
    const data = await fetchJson("/api/professors/search", {
      name,
      university: currentUniversity()
    });

    if (course.professor.trim() !== name) {
      return;
    }

    if (data.result) {
      course.professorSignal = normalizeProfessorSignal(data.result, data.provider, data.fallback);
      course.professorStatus = "";
      setProfessorSuggestions(data.results || []);
    } else {
      course.professorStatus = "not-found";
    }

    updateAnalytics();
  } catch (error) {
    course.professorStatus = "error";
    course.professorSignal = pendingProfessorSignal(name, "Lookup unavailable");
    updateAnalytics();
  }

  syncLookupDetail(row, course);
}

function updateAnalytics() {
  const semester = state.semesters[state.selectedSemester] || state.semesters[0];
  const localRisk = calculateRisk(semester);
  const breakdown = buildSemesterBreakdown(semester, localRisk);
  const aiAnalysis = currentAiAnalysis(semester);
  const risk = aiAnalysis
    ? {
        ...localRisk,
        score: aiAnalysis.burnoutScore,
        label: aiAnalysis.burnoutLabel || localRisk.label
      }
    : localRisk;
  const color = risk.score >= 72
    ? "var(--danger)"
    : risk.score >= 48
      ? "var(--warning)"
      : "var(--accent)";

  riskGauge.style.setProperty("--risk", `${risk.score}%`);
  riskGauge.style.setProperty("--risk-color", color);
  riskGaugeText.textContent = risk.score;
  riskScore.textContent = `${risk.score}%`;
  riskLabel.textContent = risk.label;
  riskScore.style.color = color;

  renderBriefBreakdown(breakdown, risk, aiAnalysis);
  renderDetailedBreakdown(breakdown, risk);
  safeRenderPanel(() => renderLifeBalance(semester, breakdown, risk), "life balance");
  safeRenderPanel(renderPrerequisiteWarnings, "prerequisite checks");
  safeRenderPanel(() => renderBackupPlans(semester, breakdown, risk), "backup plans");
  renderSuggestions(semester, risk, breakdown, aiAnalysis);
  safeRenderPanel(() => renderSimulationState(semester, risk, breakdown), "simulation");
  scheduleGeminiAnalysis(semester);
}

function safeRenderPanel(callback, label) {
  try {
    callback();
  } catch (error) {
    console.warn(`[DegreeWise] ${label} render failed: ${error.message}`);
    if (label === "life balance" && lifeBalanceReasons) {
      lifeBalanceReasons.replaceChildren(checkItem(`Campus-life balance could not render: ${error.message}`, "warn"));
    }
  }
}

function scheduleGeminiAnalysis(semester) {
  const signature = scheduleSignature(semester);
  const hasCourses = (semester?.courses || []).some((course) => course.name.trim());

  if (!hasCourses || state.aiDisabled || state.aiAnalysis?.signature === signature || state.aiPendingSignature === signature) {
    return;
  }

  clearTimeout(aiAnalysisTimer);
  aiAnalysisTimer = setTimeout(async () => {
    const currentSemester = state.semesters[state.selectedSemester] || state.semesters[0];
    const currentSignature = scheduleSignature(currentSemester);

    if (!currentSignature || state.aiAnalysis?.signature === currentSignature) {
      return;
    }

    state.aiPendingSignature = currentSignature;
    setAiStatus("Testing Gemini", "pending");

    try {
      const localRisk = calculateRisk(currentSemester);
      const breakdown = buildSemesterBreakdown(currentSemester, localRisk);
      const data = await postJson("/api/ai/analyze", buildAiSchedulePayload(currentSemester, localRisk, breakdown));

      if (state.aiPendingSignature !== currentSignature) {
        return;
      }

      if (data.enabled === false) {
        state.aiDisabled = data.retryable !== true;
        reportGeminiFallback("analysis", data.reason);
        return;
      }

      state.aiAnalysis = normalizeAiAnalysis(data, currentSignature);
      setAiStatus("Using Gemini", "online");
      updateAnalytics();
    } catch (error) {
      state.aiDisabled = true;
      reportGeminiFallback("analysis", error.message);
    } finally {
      if (state.aiPendingSignature === currentSignature) {
        state.aiPendingSignature = "";
      }
    }
  }, 700);
}

function currentAiAnalysis(semester) {
  const signature = scheduleSignature(semester);
  return state.aiAnalysis?.signature === signature ? state.aiAnalysis : null;
}

function normalizeAiAnalysis(data, signature) {
  const score = Math.max(0, Math.min(100, Math.round(Number(data.burnoutScore))));
  return {
    signature,
    burnoutScore: Number.isFinite(score) ? score : 50,
    burnoutLabel: data.burnoutLabel || "",
    briefSummary: data.briefSummary || "",
    recommendations: Array.isArray(data.recommendations) ? data.recommendations.filter(Boolean) : []
  };
}

function calculateRisk(semester) {
  const courses = semester?.courses || [];
  const totalCredits = courses.reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const courseCount = courses.filter((course) => course.name.trim()).length;
  const difficultyAverage = professorDifficultyAverage(courses);
  const fourCreditCourses = courses.filter((course) => Number(course.credits) >= 4).length;
  const workloadBump = courses.reduce((sum, course) => {
    const hours = Number(course.courseInfo?.workloadHours || 0);
    return sum + Math.max(0, hours - 10) * 0.8;
  }, 0);

  let score = 18;
  score += Math.max(0, totalCredits - 9) * 6;
  score += Math.max(0, courseCount - 4) * 7;
  score += difficultyAverage * 8;
  score += fourCreditCourses * 5;
  score += workloadBump;

  const bounded = Math.max(8, Math.min(96, Math.round(score)));
  const label = bounded >= 72 ? "High Load" : bounded >= 48 ? "Needs Review" : "Balanced";

  return { score: bounded, label, totalCredits, difficultyAverage };
}

function professorDifficultyAverage(courses) {
  const difficulties = courses
    .filter((course) => course.professor.trim())
    .map((course) => Number(course.professorSignal?.difficulty || 2.5))
    .filter(Boolean);

  if (!difficulties.length) {
    return 2.5;
  }

  return difficulties.reduce((sum, value) => sum + value, 0) / difficulties.length;
}

function buildSemesterBreakdown(semester, risk) {
  const courses = (semester?.courses || []).filter((course) => course.name.trim());
  const classDetails = courses.map((course) => buildClassBreakdown(course));
  const factorNames = ["writing", "reading", "labsProjects", "subject", "professor", "pace"];
  const totals = {};

  factorNames.forEach((factor) => {
    totals[factor] = Math.round(average(classDetails.map((item) => item.scores[factor])));
  });

  totals.creditLoad = creditLoadScore(risk.totalCredits, courses.length);

  return {
    classes: classDetails,
    scores: totals,
    summary: summarizeSchedule(totals, risk, classDetails),
    reasons: buildBurnoutReasons(totals, risk, classDetails)
  };
}

function buildClassBreakdown(course) {
  const info = course.courseInfo || {};
  const code = extractDisplayedCourseCode(course.name || info.code || "");
  const subjectCode = code.split(" ")[0] || "";
  const number = Number((code.match(/\d+/) || [0])[0]);
  const credits = Number(course.credits || info.credits || 3);
  const text = `${course.name} ${info.title || ""} ${info.description || ""} ${info.prerequisites || ""}`.toLowerCase();
  const professorDifficulty = Number(course.professorSignal?.difficulty || 2.5);

  let writing = 2 + keywordScore(text, ["writing", "composition", "seminar", "essay", "report", "presentation", "communication", "literature"]);
  let reading = 2 + keywordScore(text, ["reading", "history", "theory", "policy", "psychology", "sociology", "research", "literature", "ethics"]);
  let labsProjects = 2 + keywordScore(text, ["lab", "programming", "software", "project", "systems", "data", "cyber", "network", "database", "mobile", "robotics"]);
  let subject = 3 + keywordScore(text, ["algorithms", "calculus", "discrete", "assembly", "operating system", "machine learning", "chemistry", "physics", "security"]);
  let pace = 3;

  if (["EN", "MC", "SC", "SO", "SW", "PS", "UI", "WH"].includes(subjectCode)) {
    writing += 2;
    reading += 2;
  }

  if (["CS", "CY", "BY", "CH", "PH", "GO", "MA"].includes(subjectCode)) {
    labsProjects += subjectCode === "MA" ? 1 : 2;
    subject += 1;
  }

  if (number >= 300) {
    subject += 2;
    pace += 1;
  } else if (number >= 200) {
    subject += 1;
  }

  if (number >= 500) {
    subject += 2;
    pace += 1;
  }

  if (credits >= 4) {
    writing += 1;
    reading += 1;
    labsProjects += 1;
    pace += 2;
  } else if (credits <= 2) {
    pace -= 1;
  }

  const professor = clampScore(Math.round(professorDifficulty * 2));
  subject += Math.max(0, professorDifficulty - 2.5);

  const scores = {
    writing: clampScore(Math.round(writing)),
    reading: clampScore(Math.round(reading)),
    labsProjects: clampScore(Math.round(labsProjects)),
    subject: clampScore(Math.round(subject)),
    professor,
    pace: clampScore(Math.round(pace + credits / 2))
  };

  const classScore = clampScore(Math.round(
    scores.writing * 0.12
    + scores.reading * 0.14
    + scores.labsProjects * 0.2
    + scores.subject * 0.25
    + scores.professor * 0.14
    + scores.pace * 0.15
  ));

  return {
    course,
    code,
    title: course.courseInfo?.title || course.name.replace(/^[A-Z]{2,4}\s+\d{3}[A-Z]?\s+-\s+/, "") || "Course pending",
    credits,
    classScore,
    burnoutPoints: Math.round(classScore * credits * 1.25),
    scores,
    note: classNote(scores, course, classScore)
  };
}

function renderBriefBreakdown(breakdown, risk, aiAnalysis) {
  briefScoreGrid.replaceChildren();

  const items = [
    ["Writing", breakdown.scores.writing],
    ["Reading", breakdown.scores.reading],
    ["Labs/Projects", breakdown.scores.labsProjects],
    ["Subject Difficulty", breakdown.scores.subject],
    ["Professor Difficulty", breakdown.scores.professor],
    ["Credit Load", breakdown.scores.creditLoad]
  ];

  items.forEach(([label, score]) => {
    const card = document.createElement("div");
    card.className = "brief-score";
    card.innerHTML = `
      <div class="brief-score-top">
        <span class="brief-score-label"></span>
        <span class="brief-score-value"></span>
      </div>
      <div class="mini-meter"><span></span></div>
    `;
    card.querySelector(".brief-score-label").textContent = label;
    card.querySelector(".brief-score-value").textContent = `${score}/10`;
    card.querySelector(".mini-meter").style.setProperty("--score", score);
    card.querySelector(".mini-meter").style.setProperty("--meter-color", scoreColor(score));
    briefScoreGrid.append(card);
  });

  const summary = aiAnalysis?.briefSummary || breakdown.summary;
  scheduleComment.textContent = `${summary} Burnout risk is ${risk.score}%, so treat this as a ${risk.label.toLowerCase()} semester.`;
}

function renderDetailedBreakdown(breakdown, risk) {
  detailBreakdown.replaceChildren();

  const summary = document.createElement("article");
  summary.className = "detail-item detail-summary-item";
  summary.innerHTML = `
    <div class="detail-item-head">
      <div>
        <div class="detail-title">Semester burnout score</div>
        <div class="detail-subtitle"></div>
      </div>
      <div class="detail-score"></div>
    </div>
    <p class="detail-note"></p>
  `;
  summary.querySelector(".detail-subtitle").textContent = `${breakdown.classes.length} classes, ${breakdown.classes.reduce((sum, item) => sum + item.credits, 0)} credits`;
  summary.querySelector(".detail-score").textContent = `${risk.score}%`;
  summary.querySelector(".detail-note").textContent = burnoutScoreExplanation(risk, breakdown);
  const reasonList = document.createElement("div");
  reasonList.className = "reason-chip-list";
  (breakdown.reasons || []).forEach((reason) => {
    const chip = document.createElement("span");
    chip.className = `reason-chip ${reason.level}`;
    chip.textContent = `${reason.label}: ${reason.detail}`;
    reasonList.append(chip);
  });
  summary.append(reasonList);
  detailBreakdown.append(summary);

  if (!breakdown.classes.length) {
    detailBreakdown.append(emptyState("Add classes to see a class-by-class difficulty breakdown."));
    return;
  }

  breakdown.classes.forEach((item) => {
    const article = document.createElement("article");
    article.className = "detail-item detail-class-card";
    const signal = item.course.professorSignal || pendingProfessorSignal(item.course.professor || "Professor pending", item.course.professorStatus);

    const head = document.createElement("div");
    head.className = "detail-item-head";

    const textWrap = document.createElement("div");
    const title = document.createElement("div");
    title.className = "detail-title";
    title.textContent = item.course.name || `${item.code} - ${item.title}`;

    const instructor = document.createElement("div");
    instructor.className = "detail-instructor";
    const instructorName = item.course.professor || item.course.professorSignal?.name || "Not entered";
    instructor.append("Instructor: ");
    if (instructorName !== "Not entered") {
      const link = document.createElement("a");
      link.href = professorProfileUrl(signal, instructorName);
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = instructorName;
      instructor.append(link);
    } else {
      instructor.append(instructorName);
    }

    const subtitle = document.createElement("div");
    subtitle.className = "detail-subtitle";
    subtitle.textContent = `${item.credits} credits | ${item.burnoutPoints} burnout pts`;
    textWrap.append(title, instructor, subtitle);

    head.append(textWrap);

    const compactStats = document.createElement("div");
    compactStats.className = "detail-compact-stats";
    [
      ["Class rating", `${item.classScore}/10`],
      ["Professor rating", signal.rating > 0 ? `${signal.rating.toFixed(1)}/5` : "Pending"]
    ].forEach(([label, value]) => {
      const stat = document.createElement("div");
      stat.className = "compact-stat";
      stat.innerHTML = `<span></span><strong></strong>`;
      stat.querySelector("span").textContent = label;
      stat.querySelector("strong").textContent = value;
      compactStats.append(stat);
    });

    const factors = document.createElement("div");
    factors.className = "factor-grid";
    [
      ["Writing", item.scores.writing],
      ["Reading", item.scores.reading],
      ["Labs/Projects", item.scores.labsProjects],
      ["Subject", item.scores.subject],
      ["Professor", item.scores.professor],
      ["Pace", item.scores.pace]
    ].forEach(([label, value]) => {
      const chip = document.createElement("div");
      chip.className = "factor-chip";
      chip.textContent = `${label}: ${value}/10`;
      factors.append(chip);
    });

    const professorMetrics = document.createElement("div");
    professorMetrics.className = "detail-professor-metrics";
    [
      ["Rating", signal.rating > 0 ? `${signal.rating.toFixed(1)}/5` : "Pending"],
      ["Difficulty", signal.difficulty ? `${signal.difficulty.toFixed(1)}/5` : "Pending"],
      ["Take Again", Number(signal.wouldTakeAgain) > 0 ? `${Math.round(signal.wouldTakeAgain)}%` : "Pending"]
    ].forEach(([label, value]) => {
      const metric = document.createElement("div");
      metric.className = "detail-professor-metric";
      metric.innerHTML = `<span></span><strong></strong>`;
      metric.querySelector("span").textContent = label;
      metric.querySelector("strong").textContent = value;
      professorMetrics.append(metric);
    });

    const tags = document.createElement("div");
    tags.className = "tag-row detail-tags";
    signal.tags.slice(0, 3).forEach((tag) => {
      const chip = document.createElement("span");
      chip.textContent = tag;
      tags.append(chip);
    });

    const note = document.createElement("p");
    note.className = "detail-note";
    note.textContent = item.note;

    const details = document.createElement("details");
    details.className = "detail-more";
    const moreToggle = document.createElement("summary");
    moreToggle.textContent = "Expand metrics";
    details.append(moreToggle, factors, professorMetrics, tags, note);

    article.append(head, compactStats, details);
    detailBreakdown.append(article);
  });
}

function beginSimulation(message) {
  if (!state.simulationBase) {
    state.simulationBase = JSON.parse(JSON.stringify(state.semesters));
    state.simulationEvents = [];
  }
  if (message) {
    state.simulationEvents.unshift(message);
    state.simulationEvents = state.simulationEvents.slice(0, 4);
  }
}

function renderSimulationState(semester, risk, breakdown) {
  const active = Boolean(state.simulationBase);
  simulationTitle.textContent = active ? "Temporary Simulation" : "Live Plan";
  startSimulation.hidden = active;
  saveSimulation.hidden = !active;
  discardSimulation.hidden = !active;

  const baseSemester = state.simulationBase?.[state.selectedSemester];
  if (active && baseSemester) {
    const baseRisk = calculateRisk(baseSemester);
    const baseCredits = baseSemester.courses.reduce((sum, course) => sum + Number(course.credits || 0), 0);
    const creditDelta = risk.totalCredits - baseCredits;
    const riskDelta = risk.score - baseRisk.score;
    const impact = graduationImpactSummary();
    simulationStatus.textContent = `Simulation only: ${formatSigned(creditDelta)} credits, ${formatSigned(riskDelta)} burnout points, ${impact}. ${state.simulationEvents[0] || "Edits are temporary until saved."}`;
    simulationStatus.dataset.mode = "active";
    return;
  }

  const lastEvent = state.simulationEvents[0];
  simulationStatus.textContent = lastEvent || "Make edits normally, or start a temporary simulation before changing the plan.";
  simulationStatus.dataset.mode = "live";
}

function moveHardestCourseToNextSemester() {
  const semester = state.semesters[state.selectedSemester] || state.semesters[0];
  if (!semester?.courses?.length) {
    state.simulationEvents.unshift("No class is available to move.");
    return;
  }

  const risk = calculateRisk(semester);
  const breakdown = buildSemesterBreakdown(semester, risk);
  const hardest = [...breakdown.classes].sort((a, b) => b.classScore - a.classScore)[0];
  const courseIndex = semester.courses.findIndex((course) => course === hardest?.course);
  if (courseIndex < 0) {
    return;
  }

  const [course] = semester.courses.splice(courseIndex, 1);
  let nextSemester = state.semesters[state.selectedSemester + 1];
  if (!nextSemester) {
    nextSemester = {
      title: nextSemesterTitle(semester.title || "Fall 2026"),
      courses: []
    };
    state.semesters.splice(state.selectedSemester + 1, 0, nextSemester);
  }
  if (nextSemester.courses.length === 1 && !nextSemester.courses[0].name.trim()) {
    nextSemester.courses.splice(0, 1);
  }
  nextSemester.courses.push(course);
}

function swapHighestLoadCourse() {
  const semester = state.semesters[state.selectedSemester] || state.semesters[0];
  const risk = calculateRisk(semester);
  const breakdown = buildSemesterBreakdown(semester, risk);
  const hardest = [...breakdown.classes].sort((a, b) => b.classScore - a.classScore)[0];
  if (!hardest) {
    state.simulationEvents.unshift("No class is available to swap.");
    return;
  }

  const courseIndex = semester.courses.findIndex((course) => course === hardest.course);
  const replacement = nextLightBackupCourse(semester);
  semester.courses.splice(courseIndex, 1, {
    name: `${replacement.code} - ${replacement.title}`,
    credits: replacement.credits,
    professor: "",
    courseInfo: {
      code: replacement.code,
      title: replacement.title,
      credits: replacement.credits,
      description: `${replacement.requirement}. Backup option for what-if planning.`,
      workloadHours: replacement.workload * 2,
      source: "What-if simulator"
    }
  });
}

function nextLightBackupCourse(semester) {
  const used = new Set((semester?.courses || []).map((course) => normalizeCourseKey(course.name || course.courseInfo?.code || "")));
  return backupCourseCatalog.find((course) => !used.has(normalizeCourseKey(course.code))) || backupCourseCatalog[0];
}

function renderLifeBalance(semester, breakdown, risk) {
  const balance = calculateLifeBalance(semester, breakdown, risk);
  const color = balance.score >= 74 ? "var(--accent)" : balance.score >= 55 ? "var(--warning)" : "var(--danger)";

  lifeBalanceLabel.textContent = balance.label;
  lifeBalanceScore.textContent = `${balance.score}%`;
  lifeBalanceScore.style.color = color;
  lifeBalanceMeter.style.width = `${balance.score}%`;
  lifeBalanceMeter.style.background = color;
  lifeBalanceReasons.replaceChildren();
  balance.reasons.slice(0, 4).forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    lifeBalanceReasons.append(item);
  });
}

function calculateLifeBalance(semester, breakdown, risk) {
  const courses = (semester?.courses || []).filter((course) => course.name.trim());
  const meetings = courses.map(courseMeetingInfo).filter(Boolean);
  const dayGroups = groupMeetingsByDay(meetings);
  const reasons = [];
  let score = 88;

  if (risk.totalCredits > 15) {
    score -= (risk.totalCredits - 15) * 6;
    reasons.push(`${risk.totalCredits} credits leaves less room for work, clubs, commute, and recovery.`);
  }

  if (courses.length >= 6) {
    score -= 8;
    reasons.push("Six or more classes means more context-switching and weekly deadlines.");
  }

  const technicalCount = breakdown.classes.filter((item) => ["CS", "CY", "MA"].includes((item.code || "").split(" ")[0])).length;
  if (technicalCount >= 4) {
    score -= 8;
    reasons.push("Many technical courses are stacked in the same term.");
  }

  if (meetings.length) {
    const early = meetings.filter((meeting) => meeting.start < 510).length;
    const late = meetings.filter((meeting) => meeting.start >= 1020).length;
    if (early) {
      score -= early * 4;
      reasons.push(`${early} early class${early > 1 ? "es" : ""} may pressure sleep and commute time.`);
    }
    if (late) {
      score -= late * 5;
      reasons.push(`${late} late class${late > 1 ? "es" : ""} can cut into work, dinner, or evening study.`);
    }

    Object.entries(dayGroups).forEach(([day, dayMeetings]) => {
      dayMeetings.sort((a, b) => a.start - b.start);
      for (let index = 1; index < dayMeetings.length; index += 1) {
        const gap = dayMeetings[index].start - dayMeetings[index - 1].end;
        if (gap >= 0 && gap <= 15) {
          score -= 4;
          reasons.push(`${day} has back-to-back classes with almost no transition time.`);
        } else if (gap >= 150) {
          score -= 3;
          reasons.push(`${day} has a long campus gap that may be hard to use well.`);
        }
      }
      const hasLunch = dayMeetings.some((meeting) => meeting.end <= 690) || dayMeetings.some((meeting) => meeting.start >= 810);
      const overlapsLunch = dayMeetings.some((meeting) => meeting.start < 780 && meeting.end > 720);
      if (dayMeetings.length >= 3 && overlapsLunch && !hasLunch) {
        score -= 5;
        reasons.push(`${day} may not have a clear lunch break.`);
      }
    });
  } else {
    score -= 4;
    reasons.push("Meeting times are missing, so life balance is estimated from workload only.");
  }

  const onlineCount = courses.filter((course) => normalizeSpaces(course.modality || course.courseInfo?.session).toLowerCase().includes("online")).length;
  if (onlineCount) {
    score += Math.min(6, onlineCount * 3);
    reasons.push(`${onlineCount} online or flexible class${onlineCount > 1 ? "es" : ""} can reduce campus friction.`);
  }

  if (!reasons.length) {
    reasons.push("Credit load, timing, and course mix look livable.");
  }

  const bounded = Math.max(25, Math.min(98, Math.round(score)));
  const label = bounded >= 74 ? "Livable" : bounded >= 55 ? "Tight" : "Overloaded";
  return { score: bounded, label, reasons };
}

function renderPrerequisiteWarnings() {
  const warnings = analyzePrerequisites();
  prerequisiteWarnings.replaceChildren();

  if (!warnings.length) {
    prerequisiteWarnings.append(checkItem("Prerequisite order looks clear for visible rules.", "ok"));
    return;
  }

  warnings.slice(0, 6).forEach((warning) => {
    prerequisiteWarnings.append(checkItem(`${warning.course}: ${warning.message}`, warning.level));
  });
}

function analyzePrerequisites() {
  const entries = plannedCourseEntries();
  const completed = completedCourseCodes(entries);
  const warnings = [];
  const seen = new Set(completed);

  entries.forEach((entry) => {
    const code = normalizeCourseKey(entry.code);
    if (!code || !/[A-Z]{2,4}\s+\d/.test(code)) {
      return;
    }

    const rule = mergePrerequisiteRules(prerequisiteRules[code], parsePrerequisiteText(entry.prerequisites || ""));
    if (!rule) {
      seen.add(code);
      return;
    }

    const missingAll = (rule.allOf || []).filter((required) => !seen.has(normalizeCourseKey(required)));
    if (missingAll.length) {
      warnings.push({
        course: code,
        level: "warn",
        message: `needs ${missingAll.join(", ")} before ${entry.term}.`
      });
    }

    if (rule.anyOf?.length) {
      const satisfied = rule.anyOf.some((group) => group.every((required) => seen.has(normalizeCourseKey(required))));
      if (!satisfied) {
        warnings.push({
          course: code,
          level: "warn",
          message: `needs one of these prerequisite paths first: ${rule.anyOf.map((group) => group.join(" + ")).join(" or ")}.`
        });
      }
    }

    seen.add(code);
  });

  return warnings;
}

function renderBackupPlans(semester, breakdown, risk) {
  const backups = rankBackupCourses(semester, breakdown, risk);
  backupPlanList.replaceChildren();

  if (!backups.length) {
    backupPlanList.append(checkItem("Add classes to generate backup options.", "info"));
    return;
  }

  backups.slice(0, 4).forEach((backup, index) => {
    backupPlanList.append(checkItem(`#${index + 1} ${backup.code} - ${backup.title}: ${backup.reason}`, backup.level));
  });
}

function rankBackupCourses(semester, breakdown, risk) {
  const used = new Set((semester?.courses || []).map((course) => normalizeCourseKey(course.name || course.courseInfo?.code || "")));
  const hardest = [...(breakdown.classes || [])].sort((a, b) => b.classScore - a.classScore)[0];
  const targetRequirement = hardest?.code?.startsWith("CS") || hardest?.code?.startsWith("CY") ? "Major" : "Gen Ed";
  const satisfied = new Set(plannedCourseEntries().map((entry) => normalizeCourseKey(entry.code)));

  return backupCourseCatalog
    .filter((course) => !used.has(normalizeCourseKey(course.code)))
    .map((course) => {
      const prereqRule = prerequisiteRules[course.code];
      const prereqFit = !prereqRule || prerequisiteRuleSatisfied(prereqRule, satisfied);
      const requirementFit = targetRequirement === "Major"
        ? (course.requirement.includes("Major") ? 28 : 15)
        : (!course.requirement.includes("Major") ? 28 : 12);
      const score = requirementFit
        + (course.credits === 3 ? 14 : 8)
        + Math.max(0, 18 - course.workload * 2)
        + course.professorQuality * 5
        + (prereqFit ? 14 : -14)
        + (risk.totalCredits >= 15 && course.workload <= 4 ? 8 : 0);
      return {
        ...course,
        score,
        level: prereqFit ? "ok" : "warn",
        reason: `${course.requirement}; ${course.credits} credits; workload ${course.workload}/10; ${prereqFit ? "prereqs fit" : "verify prereqs"}; keeps graduation path flexible.`
      };
    })
    .sort((a, b) => b.score - a.score);
}

function exportAdvisorSummary() {
  const semester = state.semesters[state.selectedSemester] || state.semesters[0];
  const risk = calculateRisk(semester);
  const breakdown = buildSemesterBreakdown(semester, risk);
  const life = calculateLifeBalance(semester, breakdown, risk);
  const prereqs = analyzePrerequisites();
  const backups = rankBackupCourses(semester, breakdown, risk).slice(0, 4);
  const plan = state.degreePlan;
  const exportWindow = window.open("", "_blank");
  if (!exportWindow) {
    appendChatMessage("assistant", "Pop-up blocking stopped the advisor export. Allow pop-ups for this page and try again.");
    return;
  }

  exportWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>DegreeWise Advisor Export</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; line-height: 1.45; }
          h1, h2, h3 { margin: 0 0 8px; }
          h1 { font-size: 28px; }
          h2 { border-bottom: 1px solid #d1d5db; padding-bottom: 6px; margin-top: 24px; }
          .meta, .grid { display: grid; gap: 8px; }
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
          ul { margin-top: 8px; padding-left: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; }
          th, td { border: 1px solid #d1d5db; padding: 7px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; }
          @media print { button { display: none; } body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Save as PDF</button>
        <h1>DegreeWise Advisor Summary</h1>
        <p>${escapeHtml(currentUniversity())} | ${escapeHtml(document.querySelector("#major")?.value || "Major pending")} | Credits completed: ${escapeHtml(document.querySelector("#creditsCompleted")?.value || "0")}</p>
        <div class="grid">
          <div class="box"><strong>Burnout:</strong> ${risk.score}% (${escapeHtml(risk.label)})<br>${escapeHtml(burnoutScoreExplanation(risk, breakdown))}</div>
          <div class="box"><strong>Campus-life balance:</strong> ${life.score}% (${escapeHtml(life.label)})<br>${escapeHtml(life.reasons[0] || "")}</div>
        </div>
        <h2>Current Semester: ${escapeHtml(semester.title || "Current Plan")}</h2>
        ${advisorCourseTable(semester.courses || [])}
        <h2>Structured Burnout Reasons</h2>
        <ul>${(breakdown.reasons || []).map((reason) => `<li>${escapeHtml(reason.label)}: ${escapeHtml(reason.detail)}</li>`).join("")}</ul>
        <h2>Prerequisite Warnings</h2>
        <ul>${(prereqs.length ? prereqs : [{ course: "OK", message: "No visible prerequisite conflicts." }]).map((item) => `<li>${escapeHtml(item.course)}: ${escapeHtml(item.message)}</li>`).join("")}</ul>
        <h2>Backup Course Options</h2>
        <ul>${backups.map((item) => `<li>${escapeHtml(item.code)} - ${escapeHtml(item.title)}: ${escapeHtml(item.reason)}</li>`).join("")}</ul>
        <h2>4-Year Degree Map</h2>
        ${advisorDegreePlanTable(plan)}
        <h2>Advisor Questions</h2>
        <ul>
          <li>Are the prerequisite assumptions correct for my catalog year?</li>
          <li>Which gen eds double-count with my program or scholarship requirements?</li>
          <li>Can any high-load semester be moved without delaying graduation?</li>
          <li>Are the backup courses actually available next term?</li>
        </ul>
      </body>
    </html>
  `);
  exportWindow.document.close();
  exportWindow.focus();
}

function buildBurnoutReasons(scores, risk, classDetails) {
  const reasons = [];
  const addReason = (label, value, detail) => {
    const level = value >= 8 ? "high" : value >= 6 ? "medium" : "low";
    reasons.push({ label, value, level, detail });
  };

  addReason("Credit load", scores.creditLoad || 1, `${risk.totalCredits || 0} credits is ${risk.totalCredits >= 16 ? "above" : "near"} the usual comfort range.`);
  addReason("Technical load", scores.subject || 1, `${classDetails.filter((item) => ["CS", "CY", "MA"].includes((item.code || "").split(" ")[0])).length} technical or quantitative courses are in the term.`);
  addReason("Labs/projects", scores.labsProjects || 1, `Project and lab pressure is ${scoreBand(scores.labsProjects)}.`);
  addReason("Professor difficulty", scores.professor || 1, `Instructor difficulty average is ${risk.difficultyAverage?.toFixed?.(1) || "pending"}/5.`);
  addReason("Reading/writing", Math.max(scores.reading || 1, scores.writing || 1), `Reading is ${scores.reading}/10 and writing is ${scores.writing}/10.`);

  return reasons.sort((a, b) => b.value - a.value).slice(0, 5);
}

function checkItem(text, level = "info") {
  const item = document.createElement("div");
  item.className = `check-item ${level}`;
  item.textContent = text;
  return item;
}

function courseMeetingInfo(course) {
  const start = parseTimeToMinutes(course.startTime) ?? parseTimeToMinutesFromText(course.courseInfo?.time);
  if (start === null) {
    return null;
  }
  const days = expandMeetingDays(course.days || course.courseInfo?.days || "");
  return {
    start,
    end: start + 75,
    days: days.length ? days : ["TBD"]
  };
}

function groupMeetingsByDay(meetings) {
  return meetings.reduce((groups, meeting) => {
    meeting.days.forEach((day) => {
      groups[day] = groups[day] || [];
      groups[day].push(meeting);
    });
    return groups;
  }, {});
}

function expandMeetingDays(value) {
  const text = String(value || "").toUpperCase();
  if (!text) {
    return [];
  }
  if (text.includes("TTH") || text.includes("TR")) {
    return ["Tue", "Thu"];
  }
  const days = [];
  if (text.includes("M")) days.push("Mon");
  if (text.includes("T")) days.push("Tue");
  if (text.includes("W")) days.push("Wed");
  if (text.includes("R") || text.includes("H")) days.push("Thu");
  if (text.includes("F")) days.push("Fri");
  return [...new Set(days)];
}

function timeValueFromCourse(course) {
  const minutes = parseTimeToMinutesFromText(course.courseInfo?.time);
  if (minutes === null) {
    return "";
  }
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function parseTimeToMinutes(value) {
  if (!value) {
    return null;
  }
  const match = String(value).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function parseTimeToMinutesFromText(value) {
  const text = String(value || "");
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) {
    return null;
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const suffix = (match[3] || "").toUpperCase();
  if (suffix === "PM" && hours < 12) hours += 12;
  if (suffix === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function plannedCourseEntries() {
  const entries = [];
  if (state.degreePlan?.semesters?.length) {
    state.degreePlan.semesters.forEach((semester, semesterIndex) => {
      (semester.courses || []).forEach((course) => {
        entries.push({
          code: normalizeCourseKey(course.code || course.title),
          title: course.title || course.name || "",
          prerequisites: course.prerequisites || "",
          term: semester.term || `Semester ${semesterIndex + 1}`,
          order: semesterIndex
        });
      });
    });
    return entries;
  }

  state.semesters.forEach((semester, semesterIndex) => {
    (semester.courses || []).forEach((course) => {
      entries.push({
        code: normalizeCourseKey(course.courseInfo?.code || extractDisplayedCourseCode(course.name) || course.name),
        title: course.courseInfo?.title || course.name,
        prerequisites: course.courseInfo?.prerequisites || "",
        term: semester.title || `Semester ${semesterIndex + 1}`,
        order: semesterIndex
      });
    });
  });
  return entries;
}

function completedCourseCodes(entries) {
  if (!state.degreePlan?.semesters?.length) {
    return new Set();
  }
  const completedCredits = Number(document.querySelector("#creditsCompleted")?.value || 0);
  const completed = new Set();
  let creditTotal = 0;
  for (const entry of entries) {
    if (creditTotal >= completedCredits) {
      break;
    }
    completed.add(normalizeCourseKey(entry.code));
    creditTotal += 3;
  }
  return completed;
}

function mergePrerequisiteRules(staticRule, parsedRule) {
  if (!staticRule && !parsedRule) {
    return null;
  }

  const allOf = [...(staticRule?.allOf || []), ...(parsedRule?.allOf || [])]
    .map(normalizeCourseKey)
    .filter(Boolean);

  const anyOf = [...(staticRule?.anyOf || []), ...(parsedRule?.anyOf || [])]
    .map((group) => [...new Set(group.map(normalizeCourseKey).filter(Boolean))])
    .filter((group) => group.length);

  return {
    allOf: [...new Set(allOf)],
    anyOf
  };
}

function parsePrerequisiteText(text) {
  const matches = String(text || "").match(/\b[A-Z]{2,4}\s*\d{3}[A-Z]?\b/g);
  if (!matches?.length) {
    return null;
  }
  const normalized = matches.map(normalizeCourseKey);
  if (/\bor\b/i.test(text)) {
    return { anyOf: normalized.map((code) => [code]) };
  }
  return { allOf: normalized };
}

function prerequisiteRuleSatisfied(rule, satisfied) {
  const allMet = (rule.allOf || []).every((required) => satisfied.has(normalizeCourseKey(required)));
  const anyMet = !rule.anyOf?.length || rule.anyOf.some((group) => group.every((required) => satisfied.has(normalizeCourseKey(required))));
  return allMet && anyMet;
}

function normalizeCourseKey(value) {
  const match = String(value || "").match(/\b[A-Z]{2,4}\s*\d{3}[A-Z]?\b/i);
  return match ? match[0].toUpperCase().replace(/\s+/, " ") : String(value || "").trim().toUpperCase();
}

function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function scoreBand(score) {
  return score >= 8 ? "high" : score >= 6 ? "moderate" : "low";
}

function formatSigned(value) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function graduationImpactSummary() {
  const totalCourses = state.semesters.reduce((sum, semester) => sum + semester.courses.length, 0);
  const emptyFutureTerms = state.semesters.slice(state.selectedSemester + 1).filter((semester) => !semester.courses.length).length;
  if (emptyFutureTerms) {
    return "graduation pacing still has open future space";
  }
  return `${totalCourses} planned courses remain on the map`;
}

function advisorCourseTable(courses) {
  if (!courses?.length) {
    return "<p>No current semester courses entered.</p>";
  }
  return `
    <table>
      <thead><tr><th>Course</th><th>Credits</th><th>Professor</th><th>Days</th><th>Start</th></tr></thead>
      <tbody>
        ${courses.map((course) => `
          <tr>
            <td>${escapeHtml(course.name || course.courseInfo?.name || "")}</td>
            <td>${escapeHtml(course.credits || "")}</td>
            <td>${escapeHtml(course.professor || "")}</td>
            <td>${escapeHtml(course.days || course.courseInfo?.days || "")}</td>
            <td>${escapeHtml(course.startTime || timeValueFromCourse(course) || "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function advisorDegreePlanTable(plan) {
  if (!plan?.semesters?.length) {
    return "<p>No 4-year degree map uploaded yet.</p>";
  }
  return `
    <table>
      <thead><tr><th>Term</th><th>Credits</th><th>Burnout</th><th>Courses</th></tr></thead>
      <tbody>
        ${plan.semesters.map((semester) => `
          <tr>
            <td>${escapeHtml(semester.term)}</td>
            <td>${escapeHtml(semester.credits)}</td>
            <td>${escapeHtml(semester.burnoutScore)}%</td>
            <td>${escapeHtml((semester.courses || []).map((course) => course.code || course.title).join(", "))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function uploadDegreeMap(file) {
  if (file.size > 8 * 1024 * 1024) {
    setDegreeMapStatus("Please upload a degree map under 8 MB.", "error");
    return;
  }

  state.degreePlanUploading = true;
  degreeMapButton.disabled = true;
  degreeMapButton.textContent = "Analyzing...";
  setDegreeMapStatus(`Analyzing ${file.name}...`, "pending");

  const formData = new FormData();
  formData.append("degreeMap", file);
  formData.append("university", currentUniversity());
  formData.append("major", document.querySelector("#major")?.value?.trim() || "");
  formData.append("creditsCompleted", document.querySelector("#creditsCompleted")?.value || "0");

  try {
    const data = await postForm("/api/degree-map/analyze", formData);
    const plan = normalizeDegreePlan(data.plan || data);
    state.degreePlan = {
      ...plan,
      source: data.source || plan.source || "local",
      model: data.model || "",
      fallback: Boolean(data.fallback),
      providerError: data.providerError || ""
    };

    const source = state.degreePlan.source === "gemini" ? "Gemini" : "local planner";
    setDegreeMapStatus(`Built an 8-semester plan with ${source}.`, state.degreePlan.fallback ? "local" : "online");
    renderDegreePlan();
    appendChatMessage("assistant", "I mapped the 4-year plan. Ask me about prerequisites, lighter semesters, gen ed placement, or when to take a specific course.");
  } catch (error) {
    setDegreeMapStatus(`Degree map upload failed: ${error.message}`, "error");
  } finally {
    state.degreePlanUploading = false;
    degreeMapButton.disabled = false;
    degreeMapButton.textContent = state.degreePlan ? "Upload New Degree Map" : "Upload Degree Map";
  }
}

function renderDegreePlan() {
  if (!degreePlanSummary || !degreePlanGrid) {
    return;
  }

  degreePlanGrid.replaceChildren();

  if (!state.degreePlan) {
    degreePlanSummary.hidden = true;
    return;
  }

  const plan = state.degreePlan;
  degreePlanSummary.hidden = false;
  degreePlanSummary.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = plan.programName || "Degree plan";

  const meta = document.createElement("span");
  const totalCredits = plan.totalCredits ? `${plan.totalCredits} credits` : "credits pending";
  meta.textContent = `${totalCredits} across ${plan.semesters.length} semesters`;

  const strategy = document.createElement("p");
  strategy.textContent = plan.strategy || "Balanced pacing with prerequisites kept ahead of upper-level courses.";

  degreePlanSummary.append(title, meta, strategy);

  plan.semesters.forEach((semester, semesterIndex) => {
    const card = document.createElement("article");
    card.className = "degree-semester-card";

    const head = document.createElement("div");
    head.className = "degree-semester-head";

    const headingWrap = document.createElement("div");
    const label = document.createElement("span");
    label.className = "degree-term-label";
    label.textContent = `Year ${semester.year || Math.floor(semesterIndex / 2) + 1}`;

    const heading = document.createElement("h3");
    heading.textContent = semester.term || semester.title || `Semester ${semesterIndex + 1}`;
    headingWrap.append(label, heading);

    const risk = document.createElement("span");
    risk.className = "degree-risk";
    risk.style.setProperty("--risk-color", scoreColor(Math.ceil((semester.burnoutScore || 40) / 10)));
    risk.textContent = `${semester.burnoutScore || 40}%`;

    head.append(headingWrap, risk);

    const focus = document.createElement("p");
    focus.className = "degree-focus";
    focus.textContent = semester.focus || "Balanced course pacing";

    const courses = document.createElement("ul");
    courses.className = "degree-course-list";
    semester.courses.forEach((course) => {
      const item = document.createElement("li");
      const code = document.createElement("strong");
      code.textContent = course.code || "GEN";
      const name = document.createElement("span");
      name.textContent = `${course.title || course.name || "Course"} (${course.credits || 3} cr)`;
      const tag = document.createElement("em");
      tag.textContent = course.category || "Course";
      item.append(code, name, tag);
      courses.append(item);
    });

    const notes = document.createElement("p");
    notes.className = "degree-note";
    notes.textContent = semester.notes?.[0] || `${semester.credits || semesterCreditTotal(semester)} credits planned.`;

    const genEdButton = document.createElement("button");
    genEdButton.className = "secondary-button full-width";
    genEdButton.type = "button";
    genEdButton.textContent = semester.genEdLoading ? "Finding Gen Eds..." : "Recommend Gen Eds";
    genEdButton.disabled = Boolean(semester.genEdLoading);
    genEdButton.addEventListener("click", () => {
      recommendGeneralEducation(semesterIndex);
    });

    const genEdList = document.createElement("div");
    genEdList.className = "gened-list";
    renderGenEdRecommendations(semester, genEdList);

    card.append(head, focus, courses, notes, genEdButton, genEdList);
    degreePlanGrid.append(card);
  });
}

function renderGenEdRecommendations(semester, container) {
  container.replaceChildren();

  const recommendations = Array.isArray(semester.genEdRecommendations) ? semester.genEdRecommendations : [];
  if (recommendations.length) {
    recommendations.forEach((recommendation) => {
      const item = document.createElement("div");
      item.className = "gened-item";
      const title = document.createElement("strong");
      title.textContent = `${recommendation.code || "GEN"} - ${recommendation.title || "General education option"}`;
      const detail = document.createElement("span");
      detail.textContent = `${recommendation.area || "Gen Ed"}: ${recommendation.reason || "Good fit for this semester."}`;
      item.append(title, detail);
      container.append(item);
    });
    return;
  }

  if (semester.genEdSlots?.length) {
    const slots = document.createElement("p");
    slots.className = "gened-slots";
    slots.textContent = `Open Gen Ed slots: ${semester.genEdSlots.map((slot) => slot.area || "General Education").slice(0, 3).join(", ")}`;
    container.append(slots);
  }
}

async function recommendGeneralEducation(semesterIndex) {
  if (!state.degreePlan?.semesters?.[semesterIndex]) {
    return;
  }

  const semester = state.degreePlan.semesters[semesterIndex];
  semester.genEdLoading = true;
  renderDegreePlan();

  try {
    const data = await postJson("/api/degree-map/gened", {
      profile: {
        university: currentUniversity(),
        major: document.querySelector("#major")?.value?.trim() || "",
        creditsCompleted: Number(document.querySelector("#creditsCompleted")?.value || 0)
      },
      degreePlan: degreePlanForAi(),
      semesterIndex,
      semester: compactDegreeSemester(semester)
    });

    semester.genEdRecommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
    semester.genEdNote = data.note || "";
  } catch (error) {
    semester.genEdRecommendations = [
      {
        code: "Advisor",
        title: "General education review",
        area: "Planning",
        reason: "Recommendation lookup failed. Compare this slot with your official catalog or advisor."
      }
    ];
  } finally {
    semester.genEdLoading = false;
    renderDegreePlan();
  }
}

function normalizeDegreePlan(plan = {}) {
  const semesters = Array.isArray(plan.semesters) ? plan.semesters : [];
  const cleanSemesters = semesters.slice(0, 8).map((semester, index) => ({
    year: Number(semester.year || Math.floor(index / 2) + 1),
    term: semester.term || semester.title || `Semester ${index + 1}`,
    title: semester.title || semester.term || `Semester ${index + 1}`,
    credits: Number(semester.credits || semesterCreditTotal(semester)),
    burnoutScore: Math.max(12, Math.min(88, Math.round(Number(semester.burnoutScore || 42)))),
    focus: semester.focus || "",
    courses: normalizeDegreeCourses(semester.courses),
    genEdSlots: normalizeGenEdSlots(semester.genEdSlots),
    genEdRecommendations: Array.isArray(semester.genEdRecommendations) ? semester.genEdRecommendations : [],
    notes: Array.isArray(semester.notes) ? semester.notes.filter(Boolean).slice(0, 3) : []
  }));

  return {
    programName: plan.programName || plan.program || "Degree plan",
    documentTitle: plan.documentTitle || "",
    totalCredits: Number(plan.totalCredits || cleanSemesters.reduce((sum, semester) => sum + Number(semester.credits || 0), 0)),
    strategy: plan.strategy || "",
    warnings: Array.isArray(plan.warnings) ? plan.warnings.filter(Boolean).slice(0, 6) : [],
    semesters: cleanSemesters
  };
}

function normalizeDegreeCourses(courses) {
  if (!Array.isArray(courses)) {
    return [];
  }

  return courses.slice(0, 8).map((course) => ({
    code: String(course.code || "").trim(),
    title: String(course.title || course.name || "").trim(),
    name: String(course.name || course.title || "").trim(),
    credits: Number(course.credits || 3),
    category: String(course.category || "Course").trim(),
    reason: String(course.reason || "").trim()
  }));
}

function normalizeGenEdSlots(slots) {
  if (!Array.isArray(slots)) {
    return [];
  }

  return slots.slice(0, 4).map((slot) => ({
    area: String(slot.area || "General Education").trim(),
    credits: Number(slot.credits || 3),
    recommendation: String(slot.recommendation || "").trim()
  }));
}

function semesterCreditTotal(semester = {}) {
  return (semester.courses || []).reduce((sum, course) => sum + Number(course.credits || 3), 0);
}

function degreePlanForAi() {
  if (!state.degreePlan) {
    return null;
  }

  return {
    programName: state.degreePlan.programName,
    totalCredits: state.degreePlan.totalCredits,
    strategy: state.degreePlan.strategy,
    warnings: state.degreePlan.warnings,
    semesters: state.degreePlan.semesters.map(compactDegreeSemester)
  };
}

function compactDegreeSemester(semester) {
  return {
    year: semester.year,
    term: semester.term,
    credits: semester.credits,
    burnoutScore: semester.burnoutScore,
    focus: semester.focus,
    courses: (semester.courses || []).map((course) => ({
      code: course.code,
      title: course.title || course.name,
      credits: course.credits,
      category: course.category
    })),
    genEdSlots: semester.genEdSlots || [],
    genEdRecommendations: semester.genEdRecommendations || [],
    notes: semester.notes || []
  };
}

function setDegreeMapStatus(text, mode = "local") {
  degreeMapStatus.textContent = text;
  degreeMapStatus.dataset.mode = mode;
}

function appendChatMessage(role, text) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function resetChatMessages() {
  chatMessages.replaceChildren();
  const prompt = state.degreePlan
    ? "Ask me about the current semester or the 4-year degree plan, including prerequisites, gen eds, burnout, and graduation timing."
    : "Ask me which class looks hardest, whether to change the schedule, or how to study for this load.";
  appendChatMessage("assistant", prompt);
}

async function generateAiScheduleAnswer(question) {
  const semester = state.semesters[state.selectedSemester] || state.semesters[0];
  const localRisk = calculateRisk(semester);
  const breakdown = buildSemesterBreakdown(semester, localRisk);
  const aiAnalysis = currentAiAnalysis(semester);
  const risk = aiAnalysis
    ? {
        ...localRisk,
        score: aiAnalysis.burnoutScore,
        label: aiAnalysis.burnoutLabel || localRisk.label
      }
    : localRisk;
  const data = await postJson("/api/ai/chat", {
    ...buildAiSchedulePayload(semester, risk, breakdown),
    conversation: recentChatHistory(),
    question
  });

  if (data.enabled === false) {
    reportGeminiFallback("chat", data.reason);
    return "";
  }

  setAiStatus("Using Gemini", "online");
  return cleanChatAnswer(data.answer);
}

function rememberChatExchange(question, answer) {
  state.chatHistory.push(
    { role: "user", text: question },
    { role: "assistant", text: answer }
  );
  state.chatHistory = state.chatHistory.slice(-10);
}

function recentChatHistory() {
  return state.chatHistory.slice(-10);
}

function cleanChatAnswer(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  if (looksLikeJsonFragment(text)) {
    try {
      const parsed = JSON.parse(text);
      return cleanChatAnswer(parsed.answer);
    } catch (error) {
      return "";
    }
  }

  return text;
}

function looksLikeJsonFragment(text) {
  const trimmed = text.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[") || /["']?answer["']?\s*:/i.test(trimmed.slice(0, 160));
}

function generateScheduleAnswer(question) {
  const degreePlanAnswer = generateDegreePlanAnswer(question);
  if (degreePlanAnswer) {
    return degreePlanAnswer;
  }

  const semester = state.semesters[state.selectedSemester] || state.semesters[0];
  const risk = calculateRisk(semester);
  const breakdown = buildSemesterBreakdown(semester, risk);
  const lower = question.toLowerCase();
  const classes = breakdown.classes;
  const hardest = [...classes].sort((a, b) => b.classScore - a.classScore)[0];
  const credits = classes.reduce((sum, item) => sum + item.credits, 0);

  if (!classes.length) {
    return "Add a few classes first and I can analyze the schedule.";
  }

  if (lower.includes("prereq") || lower.includes("prerequisite")) {
    const warnings = analyzePrerequisites();
    return warnings.length
      ? warnings.slice(0, 3).map((warning) => `${warning.course}: ${warning.message}`).join(" | ")
      : "I do not see prerequisite conflicts in the visible plan. Still verify catalog-specific rules with an advisor.";
  }

  if (lower.includes("backup") || lower.includes("alternative") || lower.includes("full") || lower.includes("unavailable")) {
    const backups = rankBackupCourses(semester, breakdown, risk).slice(0, 3);
    return backups.map((backup) => `${backup.code} - ${backup.title}: ${backup.reason}`).join(" | ");
  }

  if (lower.includes("life") || lower.includes("campus") || lower.includes("lunch") || lower.includes("commute") || lower.includes("balance")) {
    const balance = calculateLifeBalance(semester, breakdown, risk);
    return `Campus-life balance is ${balance.score}% (${balance.label}). Main reasons: ${balance.reasons.slice(0, 3).join(" | ")}`;
  }

  if (lower.includes("what if") || lower.includes("simulation") || lower.includes("simulate")) {
    return state.simulationBase
      ? "You are in a temporary simulation. Use Save to keep the changes or Discard to return to the original plan."
      : "Start Simulation, then add, remove, move, or swap classes. DegreeWise will recalculate burnout, credits, prereqs, backups, and life balance before you save.";
  }

  if (lower.includes("hard") || lower.includes("difficult") || lower.includes("tough")) {
    return `${hardest.course.name} currently looks hardest at ${hardest.classScore}/10. The biggest flags are subject difficulty ${hardest.scores.subject}/10 and labs/projects ${hardest.scores.labsProjects}/10.`;
  }

  if (lower.includes("professor") || lower.includes("teacher") || lower.includes("instructor")) {
    return classes.map((item) => {
      const signal = item.course.professorSignal || pendingProfessorSignal(item.course.professor || "Professor pending", item.course.professorStatus);
      const rating = signal.rating > 0 ? `${signal.rating.toFixed(1)}/5` : "pending";
      const difficulty = signal.difficulty ? `${signal.difficulty.toFixed(1)}/5 difficulty` : "pending difficulty";
      return `${item.course.professor || signal.name}: ${rating}, ${difficulty}`;
    }).join(" | ");
  }

  if (lower.includes("writing") || lower.includes("reading") || lower.includes("project") || lower.includes("lab")) {
    return `Brief breakdown: writing ${breakdown.scores.writing}/10, reading ${breakdown.scores.reading}/10, labs/projects ${breakdown.scores.labsProjects}/10. If projects feel heavy, start CY and CS work the week it opens.`;
  }

  if (lower.includes("drop") || lower.includes("redo") || lower.includes("change") || lower.includes("advisor") || lower.includes("switch") || lower.includes("swap") || lower.includes("replace")) {
    if (risk.score >= 72) {
      return `This is a high-load schedule at ${risk.score}%. I would talk to an advisor and consider moving ${hardest.course.name} to a later term, then replacing it with a lower-load 3-credit general education or elective course that still fits your degree plan.`;
    }
    if (risk.score >= 48) {
      return `This is workable but needs structure at ${risk.score}%. I would not redo the whole schedule yet, but I would protect weekly study blocks and watch ${hardest.course.name}.`;
    }
    return `I would keep the schedule as-is for now. The risk is ${risk.score}%, and the ${credits} credits look manageable if you stay consistent.`;
  }

  if (lower.includes("credit") || lower.includes("load") || lower.includes("burnout") || lower.includes("risk")) {
    return `You have ${credits} credits and a burnout risk of ${risk.score}%. The schedule is labeled ${risk.label}. The main pressure point is ${hardest.course.name}.`;
  }

  return `${semester.title} has ${classes.length} classes and ${credits} credits. Burnout risk is ${risk.score}% (${risk.label}). Ask me about professors, hardest class, writing/reading load, or whether to change the schedule.`;
}

function generateDegreePlanAnswer(question) {
  if (!state.degreePlan) {
    return "";
  }

  const lower = question.toLowerCase();
  const isPlanQuestion = [
    "4 year",
    "four year",
    "degree",
    "graduation",
    "graduate",
    "gen ed",
    "general education",
    "prereq",
    "prerequisite",
    "year",
    "plan"
  ].some((keyword) => lower.includes(keyword));

  if (!isPlanQuestion) {
    return "";
  }

  const plan = state.degreePlan;
  const semesters = plan.semesters || [];
  const sortedByBurnout = [...semesters].sort((a, b) => Number(b.burnoutScore || 0) - Number(a.burnoutScore || 0));
  const hardest = sortedByBurnout[0];
  const lightest = sortedByBurnout[sortedByBurnout.length - 1];
  const courseCode = extractDisplayedCourseCode(question);

  if (courseCode) {
    const match = semesters
      .flatMap((semester) => (semester.courses || []).map((course) => ({ semester, course })))
      .find((item) => item.course.code?.toUpperCase() === courseCode);
    if (match) {
      return `${match.course.code} is planned for ${match.semester.term} in year ${match.semester.year}. It is grouped there to keep prerequisites moving while holding the semester near ${match.semester.credits} credits.`;
    }
  }

  if (lower.includes("gen ed") || lower.includes("general education")) {
    const openSlots = semesters
      .filter((semester) => semester.genEdSlots?.length || semester.genEdRecommendations?.length)
      .slice(0, 4)
      .map((semester) => {
        const labels = (semester.genEdRecommendations?.length ? semester.genEdRecommendations : semester.genEdSlots)
          .slice(0, 2)
          .map((item) => item.code ? `${item.code} ${item.title || ""}`.trim() : item.area)
          .join(", ");
        return `${semester.term}: ${labels}`;
      });
    return openSlots.length
      ? `Gen eds are intentionally spread into lighter windows. ${openSlots.join(" | ")}. Use each semester's Recommend Gen Eds button for specific class options.`
      : "The plan has no open gen ed slots marked yet. Use the Recommend Gen Eds buttons to add lighter options around major courses.";
  }

  if (lower.includes("burnout") || lower.includes("hard") || lower.includes("light")) {
    return `${hardest.term} is the highest-load semester at ${hardest.burnoutScore}%, mostly because of ${hardest.focus || "stacked major requirements"}. ${lightest.term} is the lightest at ${lightest.burnoutScore}%, which is a good place for work, internships, or a tougher elective if needed.`;
  }

  if (lower.includes("prereq") || lower.includes("sequence") || lower.includes("order")) {
    return `The plan keeps foundations early, then moves into upper-level major courses after the first two years. The main sequencing idea is: intro programming and math first, systems/security core in the middle, then electives, internship, and capstone near the end.`;
  }

  return `${plan.programName} is mapped across ${semesters.length} semesters and about ${plan.totalCredits} credits. The pacing goal is efficient progress with lower burnout by keeping most terms near 14-15 credits and spreading gen eds around harder major courses.`;
}

function renderSuggestions(semester, risk, breakdown, aiAnalysis) {
  suggestionList.replaceChildren();

  const courses = semester?.courses || [];
  const heavyCourse = [...courses]
    .filter((course) => Number(course.credits) >= 4 || Number(course.professorSignal?.difficulty || 0) >= 3.4)
    .sort((a, b) => Number(b.credits) - Number(a.credits))[0];
  const apiAlternative = courses
    .flatMap((course) => course.courseAlternatives || [])
    .find((course) => course.credits <= 3);

  const suggestions = [];

  if (aiAnalysis?.recommendations?.length) {
    suggestions.push(...aiAnalysis.recommendations);
  }

  if (risk.score >= 78) {
    suggestions.push("Redo the schedule before registration if possible: move one high-difficulty class or project-heavy class to a lighter semester.");
  } else if (risk.score >= 62) {
    suggestions.push("Meet with an advisor before locking this in, especially if you work more than 10 hours per week.");
  }

  if (risk.totalCredits > 15) {
    suggestions.push(`Trim ${risk.totalCredits - 15} credits or move one lab into the next term.`);
  }

  if (heavyCourse?.name) {
    suggestions.push(`Pair ${heavyCourse.name} with two lower-intensity electives instead of another core class.`);
  }

  if (breakdown?.scores.labsProjects >= 7) {
    suggestions.push("Start projects the week they are assigned and reserve two fixed build/debug blocks each week.");
  }

  if (breakdown?.scores.reading >= 7 || breakdown?.scores.writing >= 7) {
    suggestions.push("Use a weekly reading and writing queue: skim early, mark deadlines, and draft before project-heavy days.");
  }

  if (breakdown?.scores.subject >= 8) {
    suggestions.push("Plan tutoring, office hours, or a study group during week one instead of waiting for the first difficult exam.");
  }

  if (apiAlternative?.name) {
    suggestions.push(`API match: ${apiAlternative.name} is a lighter option to compare with your plan.`);
  }

  if (risk.difficultyAverage >= 3.2) {
    suggestions.push("Balance tougher instructors with a lighter writing or general education course.");
  }

  if (suggestions.length < 3) {
    suggestions.push("Keep one open study block on heavy project weeks.");
    suggestions.push("Use a 12-15 credit target if adding work-study or athletics.");
    suggestions.push("Review the schedule again after professors are confirmed, since difficulty ratings can change the risk score.");
  }

  suggestions.slice(0, 4).forEach((suggestion) => {
    const item = document.createElement("li");
    item.textContent = suggestion;
    suggestionList.append(item);
  });
}

function syncLookupDetail(row, course) {
  const detail = row.querySelector(".lookup-detail");
  const parts = [];

  if (course.courseStatus === "loading" || course.courseStatus === "searching") {
    parts.push('<span class="lookup-chip muted">Course lookup...</span>');
  } else if (course.courseStatus === "not-found") {
    parts.push('<span class="lookup-chip warn">No course match</span>');
  } else if (course.courseStatus === "error") {
    parts.push('<span class="lookup-chip warn">Course lookup offline</span>');
  }

  if (course.courseInfo) {
    const info = course.courseInfo;
    const source = sourceLabel(info.source || course.courseProvider);
    const title = `${escapeHtml(info.code)} - ${escapeHtml(info.title || "Course title unavailable")}`;
    const credits = info.credits ? `<span class="source-tag">${escapeHtml(info.credits)} cr</span>` : "";
    const link = safeUrl(info.url)
      ? `<a href="${escapeAttribute(info.url)}" target="_blank" rel="noreferrer"><strong>${title}</strong></a>`
      : `<strong>${title}</strong>`;
    parts.push(`<span class="lookup-chip">${link}${credits}<span class="source-tag">${escapeHtml(source)}</span></span>`);
  }

  if (course.professorStatus === "loading" || course.professorStatus === "searching") {
    parts.push('<span class="lookup-chip muted">Professor lookup...</span>');
  } else if (course.professorStatus === "not-found") {
    parts.push('<span class="lookup-chip warn">No professor rating</span>');
  } else if (course.professorStatus === "error") {
    parts.push('<span class="lookup-chip warn">Professor lookup offline</span>');
  }

  if (course.professorSignal && course.professorSignal.rating > 0) {
    const signal = course.professorSignal;
    const source = sourceLabel(signal.source);
    parts.push(`<span class="lookup-chip"><strong>${escapeHtml(signal.name)}</strong><span class="source-tag">${escapeHtml(signal.rating.toFixed(1))}/5</span><span class="source-tag">${escapeHtml(signal.difficulty.toFixed(1))} diff</span><span class="source-tag">${escapeHtml(source)}</span></span>`);
  }

  detail.innerHTML = parts.join(" ");
  detail.classList.toggle("visible", parts.length > 0);
}

async function fetchJson(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request failed: ${response.status}. ${detail.slice(0, 500)}`);
  }

  return response.json();
}

async function postForm(path, formData) {
  const response = await fetch(path, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request failed: ${response.status}. ${detail.slice(0, 500)}`);
  }

  return response.json();
}

function buildAiSchedulePayload(semester, localRisk, breakdown) {
  return {
    profile: {
      university: currentUniversity(),
      major: document.querySelector("#major")?.value?.trim() || "",
      creditsCompleted: Number(document.querySelector("#creditsCompleted")?.value || 0)
    },
    semester: {
      title: semester?.title || "",
      courses: (semester?.courses || []).map((course) => ({
        name: course.name || "",
        credits: Number(course.credits || 0),
        professor: course.professor || "",
        courseInfo: compactCourseInfo(course.courseInfo),
        professorSignal: compactProfessorSignal(course.professorSignal)
      }))
    },
    localRisk,
    breakdown: compactBreakdownForAi(breakdown),
    degreePlan: degreePlanForAi(),
    lifeBalance: calculateLifeBalance(semester, breakdown, localRisk),
    prerequisiteWarnings: analyzePrerequisites(),
    backupPlans: rankBackupCourses(semester, breakdown, localRisk).slice(0, 4).map((backup) => ({
      code: backup.code,
      title: backup.title,
      reason: backup.reason,
      score: Math.round(backup.score)
    })),
    simulation: {
      active: Boolean(state.simulationBase),
      events: state.simulationEvents
    }
  };
}

function compactCourseInfo(info = {}) {
  info = info || {};
  return {
    code: info.code || "",
    title: info.title || "",
    credits: info.credits || "",
    description: info.description || "",
    prerequisites: info.prerequisites || "",
    source: info.source || "",
    workloadHours: info.workloadHours || ""
  };
}

function compactProfessorSignal(signal = {}) {
  signal = signal || {};
  return {
    name: signal.name || "",
    rating: Number(signal.rating || 0),
    difficulty: Number(signal.difficulty || 0),
    wouldTakeAgain: signal.wouldTakeAgain || "",
    numRatings: Number(signal.numRatings || 0),
    tags: Array.isArray(signal.tags) ? signal.tags.slice(0, 4) : [],
    source: signal.source || ""
  };
}

function compactBreakdownForAi(breakdown = {}) {
  return {
    scores: breakdown.scores || {},
    summary: breakdown.summary || "",
    classes: (breakdown.classes || []).map((item) => ({
      title: item.title || item.course?.name || "",
      credits: item.credits,
      classScore: item.classScore,
      burnoutPoints: item.burnoutPoints,
      scores: item.scores || {},
      note: item.note || "",
      course: {
        name: item.course?.name || "",
        professor: item.course?.professor || ""
      }
    }))
  };
}

function scheduleSignature(semester) {
  if (!semester) {
    return "";
  }

  return JSON.stringify({
    university: currentUniversity(),
    title: semester.title || "",
    courses: (semester.courses || []).map((course) => ({
      name: course.name || "",
      credits: Number(course.credits || 0),
      professor: course.professor || "",
      courseCode: course.courseInfo?.code || "",
      professorRating: Number(course.professorSignal?.rating || 0),
      professorDifficulty: Number(course.professorSignal?.difficulty || 0)
    }))
  });
}

function setCourseSuggestions(results) {
  courseSuggestions.replaceChildren();
  results.slice(0, 8).forEach((course) => {
    const option = document.createElement("option");
    option.value = course.name || `${course.code} - ${course.title}`;
    option.label = sourceLabel(course.source);
    courseSuggestions.append(option);
  });
}

function setProfessorSuggestions(results) {
  professorSuggestions.replaceChildren();
  results.slice(0, 8).forEach((professor) => {
    const option = document.createElement("option");
    option.value = professor.name;
    option.label = professor.department || sourceLabel(professor.source);
    professorSuggestions.append(option);
  });
}

function normalizeProfessorSignal(signal, provider, fallback) {
  return {
    name: signal.name || "Professor pending",
    department: signal.department || "Department unavailable",
    school: signal.school || currentUniversity(),
    rating: Number(signal.rating || 0),
    difficulty: Number(signal.difficulty || 2.5),
    wouldTakeAgain: signal.wouldTakeAgain,
    numRatings: Number(signal.numRatings || 0),
    tags: Array.isArray(signal.tags) && signal.tags.length ? signal.tags : ["Review ratings"],
    link: signal.link || "",
    source: fallback ? "Local sample professor data" : signal.source || provider || "Professor API"
  };
}

function pendingProfessorSignal(name, status) {
  return {
    name,
    rating: 0,
    difficulty: 2.5,
    tags: [status === "error" ? "Lookup offline" : "Pending lookup"],
    link: "",
    source: "Pending"
  };
}

function shouldAdoptCourseName(query, course) {
  const clean = query.trim().toLowerCase();
  return clean === course.code?.toLowerCase() || !clean.includes(" - ");
}

function clampCredits(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return Math.max(1, Math.min(4, Math.round(number)));
}

function clampScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 1;
  }
  return Math.max(1, Math.min(10, Math.round(number)));
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) {
    return 1;
  }
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function keywordScore(text, keywords) {
  return keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
}

function creditLoadScore(totalCredits, courseCount) {
  let score = 2;
  score += Math.max(0, totalCredits - 9) * 0.7;
  score += Math.max(0, courseCount - 4) * 0.8;
  if (totalCredits >= 15) {
    score += 1;
  }
  return clampScore(score);
}

function extractDisplayedCourseCode(value) {
  const match = String(value).match(/\b[A-Z]{2,4}\s+\d{3}[A-Z]?\b/i);
  return match ? match[0].toUpperCase().replace(/\s+/, " ") : "";
}

function scoreColor(score) {
  if (score >= 8) {
    return "var(--danger)";
  }
  if (score >= 6) {
    return "var(--warning)";
  }
  return "var(--accent)";
}

function summarizeSchedule(scores, risk, classDetails) {
  const highFactors = [
    ["writing", scores.writing],
    ["reading", scores.reading],
    ["labs/projects", scores.labsProjects],
    ["subject difficulty", scores.subject],
    ["professor difficulty", scores.professor],
    ["credit load", scores.creditLoad]
  ].filter(([, score]) => score >= 7);

  const heaviest = [...classDetails].sort((a, b) => b.classScore - a.classScore)[0];

  if (!classDetails.length) {
    return "Add classes to generate a real semester comment.";
  }

  if (risk.score >= 72) {
    return `This schedule is carrying high strain, mainly from ${highFactors.map(([label]) => label).slice(0, 2).join(" and ") || "stacked course demands"}. ${heaviest?.course.name || "The hardest class"} needs special attention.`;
  }

  if (risk.score >= 48) {
    return `This plan is workable but needs structure. The biggest pressure point is ${highFactors[0]?.[0] || "overall pacing"}, with ${heaviest?.course.name || "one course"} likely to set the weekly rhythm.`;
  }

  return `This looks balanced if you keep weekly work consistent. The main watch item is ${heaviest?.course.name || "your hardest class"}, but the overall load is manageable.`;
}

function classNote(scores, course, classScore) {
  const concerns = [];
  if (scores.labsProjects >= 7) {
    concerns.push("project or lab work");
  }
  if (scores.subject >= 7) {
    concerns.push("concept difficulty");
  }
  if (scores.reading >= 7) {
    concerns.push("reading load");
  }
  if (scores.writing >= 7) {
    concerns.push("writing load");
  }
  if (scores.professor >= 7) {
    concerns.push("instructor difficulty");
  }

  if (!concerns.length && classScore <= 4) {
    return "This should be one of the steadier parts of the schedule if assignments stay on pace.";
  }

  if (!concerns.length) {
    return "This class looks moderate: keep up with weekly work and avoid letting small assignments stack.";
  }

  return `Watch ${concerns.slice(0, 2).join(" and ")} here. Build recurring study time for ${course.name || "this class"} before the semester gets crowded.`;
}

function burnoutScoreExplanation(risk, breakdown) {
  const scores = breakdown.scores;
  const topFactor = [
    ["writing", scores.writing],
    ["reading", scores.reading],
    ["labs/projects", scores.labsProjects],
    ["subject difficulty", scores.subject],
    ["professor difficulty", scores.professor],
    ["credit load", scores.creditLoad]
  ].sort((a, b) => b[1] - a[1])[0];

  return `The burnout score combines credit load, number of classes, professor difficulty, project/lab pressure, reading and writing expectations, and subject complexity. Right now the strongest driver is ${topFactor[0]} at ${topFactor[1]}/10.`;
}

function sourceLabel(source = "") {
  const text = source.toLowerCase();
  if (text.includes("fireroad")) {
    return "FireRoad";
  }
  if (text.includes("semo")) {
    return "SEMO";
  }
  if (text.includes("rate my professor")) {
    return "RMP";
  }
  if (text.includes("local") || text.includes("generated")) {
    return "Sample";
  }
  if (text.includes("pending")) {
    return "Pending";
  }
  return source || "API";
}

function professorProfileUrl(signal, name) {
  if (safeUrl(signal?.link)) {
    return signal.link;
  }

  const query = encodeURIComponent(name);
  return `https://www.ratemyprofessors.com/search/professors/916?q=${query}`;
}

function currentUniversity() {
  return universityInput.value.trim() || defaultUniversity;
}

function setApiStatus(text, mode) {
  apiStatus.querySelector(".api-status-label").textContent = text;
  apiStatus.setAttribute("aria-label", text);
  apiStatus.title = text;
  const dot = apiStatus.querySelector(".status-dot");
  dot.classList.toggle("pending", mode === "pending");
  dot.classList.toggle("offline", mode === "offline");
  dot.classList.toggle("online", mode === "online");
}

function reportGeminiFallback(context, detail) {
  const message = detail || "No error detail was returned.";
  console.warn(`[DegreeWise] Gemini ${context} fallback: ${message}`);
  setAiStatus("Gemini error", "offline", `${context}: ${message}`);
}

function setAiStatus(text, mode, detail = "") {
  aiStatus.querySelector(".ai-status-label").textContent = text;
  const baseTitle = mode === "online"
    ? "Gemini is being used for AI analysis or chat"
    : mode === "pending"
      ? "Checking whether Gemini can answer this request"
      : "Using the local fallback analysis";
  aiStatus.title = detail ? `${baseTitle}. Last Gemini error: ${detail}` : baseTitle;
  aiStatus.setAttribute("aria-label", text);

  const dot = aiStatus.querySelector(".status-dot");
  dot.classList.toggle("pending", mode === "pending");
  dot.classList.toggle("offline", mode === "offline");
  dot.classList.toggle("local", mode === "local");
  dot.classList.toggle("online", mode === "online");
}

function clearRemoteSignals() {
  state.semesters.forEach((semester) => {
    semester.courses.forEach((course) => {
      course.courseInfo = null;
      course.courseAlternatives = [];
      course.professorSignal = null;
      course.lastCourseLookupQuery = "";
      course.lastProfessorLookupQuery = "";
    });
  });
}

function emptyState(message) {
  const item = document.createElement("div");
  item.className = "professor-card";
  item.textContent = message;
  return item;
}

function nextSemesterTitle(currentTitle) {
  const match = currentTitle.match(/\b(Fall|Spring|Summer)\s+(\d{4})\b/i);
  if (!match) {
    return `Semester ${state.semesters.length + 1}`;
  }

  const term = match[1].toLowerCase();
  const year = Number(match[2]);

  if (term === "fall") {
    return `Spring ${year + 1}`;
  }

  if (term === "spring") {
    return `Fall ${year}`;
  }

  return `Fall ${year}`;
}

function cloneDemoSemesters() {
  return JSON.parse(JSON.stringify(demoSemesters));
}

function demoCourseInfo(code, title, section, crn, instructor, options = {}) {
  return {
    code,
    title,
    name: `${code} - ${title}`,
    credits: 3,
    units: 9,
    level: "Undergraduate",
    offered: options.offered || ["Fall 2026"],
    instructors: [instructor],
    description: options.description || `Section ${section}. CRN ${crn}. Registered via web.`,
    prerequisites: options.prerequisites || "",
    workloadHours: options.workloadHours || 9,
    rating: null,
    url: "",
    source: "Registered SEMO schedule",
    school: "Southeast Missouri State University",
    section,
    campus: "",
    crn,
    days: options.days || "",
    time: options.time || "",
    session: options.session || "Registered via web"
  };
}

function demoProfessorSignal(name, department, rating, difficulty, wouldTakeAgain) {
  return {
    name,
    department,
    school: defaultUniversity,
    rating,
    difficulty,
    wouldTakeAgain,
    numRatings: 0,
    tags: ["Sample signal", "Verify rating", "Advisor review"],
    link: "",
    source: "Local sample professor data"
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch (error) {
    return false;
  }
}

checkApiHealth();
render();
