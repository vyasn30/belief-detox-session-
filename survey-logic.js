const TOTAL_QUESTIONS = SECTIONS.reduce((sum, s) => sum + s.questions.length, 0);

function renderScaleList() {
  const list = document.getElementById("scale-list");
  OPTIONS.forEach(opt => {
    const li = document.createElement("li");
    li.textContent = opt;
    list.appendChild(li);
  });
}

function renderSections() {
  const container = document.getElementById("sections-container");
  SECTIONS.forEach((section, idx) => {
    const sectionEl = document.createElement("section");
    sectionEl.className = "section-block";
    if (idx > 0) sectionEl.classList.add("locked");

    const titleEl = document.createElement("div");
    titleEl.className = "section-title";
    titleEl.textContent = section.title;
    sectionEl.appendChild(titleEl);

    section.questions.forEach(q => {
      const card = document.createElement("div");
      card.className = "question-card";
      card.dataset.qid = q.id;

      const qText = document.createElement("div");
      qText.className = "question-text";
      qText.innerHTML = `<span class="qnum">${q.id}.</span>${q.text}`;
      card.appendChild(qText);

      const optionsEl = document.createElement("div");
      optionsEl.className = "options";

      const questionOptions = q.options || section.options || OPTIONS;
      questionOptions.forEach((optText, idx2) => {
        const value = idx2 + 1;
        const label = document.createElement("label");
        label.className = "option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${q.id}`;
        input.value = value;

        input.addEventListener("change", () => {
          optionsEl.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
          label.classList.add("selected");
          card.classList.remove("unanswered-flag");
          updateProgress();
        });

        label.appendChild(input);
        const span = document.createElement("span");
        span.textContent = optText;
        label.appendChild(span);
        optionsEl.appendChild(label);
      });

      card.appendChild(optionsEl);

      if (q.trigger_box) {
        const triggerWrap = document.createElement("div");
        triggerWrap.className = "trigger-box";
        const triggerLabel = document.createElement("label");
        triggerLabel.setAttribute("for", `trigger-text-${q.id}`);
        triggerLabel.textContent = "તમારા સૌથી શક્તિશાળી triggers લખો (વૈકલ્પિક):";
        const triggerTextarea = document.createElement("textarea");
        triggerTextarea.id = `trigger-text-${q.id}`;
        triggerTextarea.name = `trigger${q.id}`;
        triggerWrap.appendChild(triggerLabel);
        triggerWrap.appendChild(triggerTextarea);
        card.appendChild(triggerWrap);
      }

      sectionEl.appendChild(card);
    });

    if (section.reflection) {
      section.reflection.forEach(r => {
        const rCard = document.createElement("div");
        rCard.className = "reflect-card";

        const badge = document.createElement("span");
        badge.className = "not-scored";
        badge.textContent = "સ્કોર થતું નથી";
        rCard.appendChild(badge);

        const label = document.createElement("label");
        label.setAttribute("for", `reflect-${r.id}`);
        label.textContent = r.label;
        rCard.appendChild(label);

        const textarea = document.createElement("textarea");
        textarea.id = `reflect-${r.id}`;
        textarea.name = r.id;
        textarea.placeholder = r.placeholder || "";
        rCard.appendChild(textarea);

        sectionEl.appendChild(rCard);
      });
    }

    const isLast = idx === SECTIONS.length - 1;
    const footer = document.createElement("div");
    footer.className = "section-footer";

    const validationMsg = document.createElement("div");
    validationMsg.className = "validation-msg";
    validationMsg.textContent = "કૃપા કરીને બધા પ્રશ્નોના જવાબ આપો — ઉપર લાલ બોર્ડરવાળા પ્રશ્નો બાકી છે.";
    footer.appendChild(validationMsg);

    const completeBtn = document.createElement("button");
    completeBtn.type = "button";
    completeBtn.className = "submit-btn complete-btn";
    completeBtn.textContent = "આ વિભાગ પૂરો કરો";
    footer.appendChild(completeBtn);

    const evalContainer = document.createElement("div");
    evalContainer.className = "section-eval";
    footer.appendChild(evalContainer);

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "submit-btn next-btn";
    nextBtn.textContent = isLast ? "પૂર્ણ કરો" : "આગળનો વિભાગ →";
    footer.appendChild(nextBtn);

    completeBtn.addEventListener("click", () => {
      const missing = section.questions
        .filter(q => !sectionEl.querySelector(`input[name="q${q.id}"]:checked`))
        .map(q => q.id);
      sectionEl.querySelectorAll(".question-card").forEach(c => c.classList.remove("unanswered-flag"));

      if (missing.length > 0) {
        missing.forEach(id => {
          const card = sectionEl.querySelector(`.question-card[data-qid="${id}"]`);
          if (card) card.classList.add("unanswered-flag");
        });
        validationMsg.style.display = "block";
        const firstCard = sectionEl.querySelector(`.question-card[data-qid="${missing[0]}"]`);
        if (firstCard) firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      validationMsg.style.display = "none";
      const answers = collectAnswers();
      const reflections = collectReflections();
      const summary = computeSectionSummary(section, answers);
      evalContainer.innerHTML = buildResultCardHTML(section, summary, reflections);
      evalContainer.style.display = "block";
      completeBtn.style.display = "none";
      nextBtn.style.display = "inline-block";
      evalContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    nextBtn.addEventListener("click", () => {
      if (isLast) {
        document.getElementById("all-done").style.display = "block";
        document.getElementById("all-done").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const blocks = document.querySelectorAll(".section-block");
      const nextSection = blocks[idx + 1];
      if (nextSection) {
        nextSection.classList.remove("locked");
        nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    sectionEl.appendChild(footer);
    container.appendChild(sectionEl);
  });
}

function updateProgress() {
  const form = document.getElementById("survey-form");
  let answered = 0;
  SECTIONS.forEach(section => {
    section.questions.forEach(q => {
      if (form.querySelector(`input[name="q${q.id}"]:checked`)) answered++;
    });
  });
  const pct = Math.round((answered / TOTAL_QUESTIONS) * 100);
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-label").textContent = `${answered} / ${TOTAL_QUESTIONS} જવાબ આપ્યા`;
}

function collectAnswers() {
  const form = document.getElementById("survey-form");
  const answers = {};
  SECTIONS.forEach(section => {
    section.questions.forEach(q => {
      const checked = form.querySelector(`input[name="q${q.id}"]:checked`);
      answers[q.id] = checked ? parseInt(checked.value, 10) : null;
    });
  });
  return answers;
}

function collectReflections() {
  const form = document.getElementById("survey-form");
  const reflections = {};
  SECTIONS.forEach(section => {
    if (!section.reflection) return;
    section.reflection.forEach(r => {
      const el = form.querySelector(`textarea[name="${r.id}"]`);
      reflections[r.id] = el ? el.value.trim() : "";
    });
  });
  return reflections;
}

// Section-wise analytics are a mirror, not a verdict: every question is echoed back
// with the participant's own chosen wording, plus a plain average for their own
// tracking. No labels, no "this is a contradiction" framing — open prompts (where a
// section has them) invite the participant to notice things themselves.
function computeSectionSummary(section, answers) {
  const sectionOptions = section.options || OPTIONS;
  const qas = section.questions.map(q => {
    const questionOptions = q.options || sectionOptions;
    return {
      id: q.id,
      text: q.text,
      answerText: questionOptions[answers[q.id] - 1]
    };
  });
  const scores = section.questions.map(q => answers[q.id]);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { average, qas, optionsCount: sectionOptions.length };
}

function buildResultCardHTML(section, summary, reflections) {
  const qaListHtml = summary.qas.map(qa => `
    <div class="qa-item">
      <div class="qa-q"><span class="qnum">${qa.id}.</span>${qa.text}</div>
      <div class="qa-a">${qa.answerText}</div>
    </div>
  `).join("");

  let ponderHtml = "";
  if (section.ponder && section.ponder.length) {
    ponderHtml = `
      <div class="ponder">
        <div class="ponder-title">વિચારવા જેવા પ્રશ્નો</div>
        <ul class="ponder-list">
          ${section.ponder.map(p => `<li>${p}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  let reflectHtml = "";
  if (section.reflection) {
    reflectHtml = `<div class="reflect-recap">` + section.reflection.map(r => `
      <div class="reflect-q">${r.label}</div>
      <div class="reflect-a">${(reflections[r.id] || "").replace(/</g, "&lt;")}</div>
    `).join("") + `</div>`;
  }

  const markerPct = ((summary.average - 1) / (summary.optionsCount - 1)) * 100;

  return `
    <div class="result-card">
      <h3>${section.title} — તમારા જવાબો</h3>
      <div class="gauge-row">
        <div class="gauge-track"><div class="gauge-marker" style="left:${markerPct}%"></div></div>
        <div class="gauge-value">${summary.average.toFixed(1)}</div>
      </div>
      <div class="avg-line">સરેરાશ (${section.questions.length} પ્રશ્નો)</div>
      <div class="qa-list">${qaListHtml}</div>
      ${ponderHtml}
      ${reflectHtml}
    </div>
  `;
}

function init() {
  renderScaleList();
  renderSections();
  updateProgress();

  const form = document.getElementById("survey-form");

  document.getElementById("restart-btn").addEventListener("click", () => {
    form.reset();
    document.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
    document.querySelectorAll(".question-card").forEach(c => c.classList.remove("unanswered-flag"));
    document.querySelectorAll(".validation-msg").forEach(v => v.style.display = "none");
    document.querySelectorAll(".section-eval").forEach(e => { e.innerHTML = ""; e.style.display = "none"; });
    document.querySelectorAll(".complete-btn").forEach(b => b.style.display = "inline-block");
    document.querySelectorAll(".next-btn").forEach(b => b.style.display = "none");
    document.querySelectorAll(".section-block").forEach((b, i) => {
      if (i > 0) b.classList.add("locked");
      else b.classList.remove("locked");
    });
    document.getElementById("all-done").style.display = "none";
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

init();
