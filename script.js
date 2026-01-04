let currentQuestion = 0;
let timer = null;
let timeLeft = 30;

const scores = { D: 0, I: 0, S: 0, C: 0 };
const answers = [];

// ✅ 구글 웹앱 URL (유지)
const SHEET_URL = "https://script.google.com/macros/s/AKfycby5FRTa6jxwa6rPW47m8I2eSQWPCyWdXWm_E_GQBxMRM72DjZJbQdsZH7A89Rzcdal-/exec";

function validateAndStart() {
  const id = document.getElementById("studentId").value.trim();
  const name = document.getElementById("name").value.trim();
  const error = document.getElementById("errorText");

  if (!id || !name) {
    error.style.display = "block";
    return;
  }

  error.style.display = "none";
  document.getElementById("start-page").style.display = "none";
  document.getElementById("question-page").style.display = "block";

  currentQuestion = 0;
  scores.D = scores.I = scores.S = scores.C = 0;

  loadQuestion();
}

function loadQuestion() {
  clearInterval(timer);
  timeLeft = 30;
  updateTimerUI(false);

  const q = questions[currentQuestion];

  document.getElementById("progress-text").innerText =
    `${currentQuestion + 1}/${questions.length} ※ 가장 먼저 떠오르는 답 선택`;

  document.getElementById("question-text").innerText = q.q;

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  q.a.forEach(a => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.innerText = a.text;
    btn.onclick = () => selectAnswer(a.t);
    answersDiv.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    updateTimerUI(false);

    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerUI(isTimeout) {
  const percent = (timeLeft / 30) * 100;
  document.getElementById("timer-progress").style.width = percent + "%";

  const text = document.getElementById("timer-text");
  text.innerText = `00:${String(timeLeft).padStart(2, "0")}`;

  if (isTimeout) text.classList.add("timeout");
  else text.classList.remove("timeout");
}

function handleTimeout() {
  updateTimerUI(true);
  document.querySelectorAll(".answer-btn").forEach(b => b.classList.add("timeout"));
  document.getElementById("timeOverlay").style.display = "flex";
}

function closeOverlay() {
  document.getElementById("timeOverlay").style.display = "none";
}

function selectAnswer(type) {
  clearInterval(timer);
  scores[type]++;
  answers[currentQuestion] = type;
  currentQuestion++;

  if (currentQuestion >= questions.length) {
    document.getElementById("doneOverlay").style.display = "flex";
  } else {
    loadQuestion();
  }
}

function confirmDone() {
  document.getElementById("doneOverlay").style.display = "none";

  const studentId = document.getElementById("studentId").value.trim();
  const name = document.getElementById("name").value.trim();

  const order = ["D", "I", "S", "C"];
  const names = { D: "주도형", I: "사교형", S: "안정형", C: "신중형" };

  const max = Math.max(scores.D, scores.I, scores.S, scores.C);
  const result = order
    .filter(t => scores[t] === max)
    .map(t => `${t} (${names[t]})`)
    .join(", ");
  
  // 구글 시트 전송
  const formData = new FormData();
  formData.append("studentId", studentId);
  formData.append("name", name);
  formData.append("D", scores.D);
  formData.append("I", scores.I);
  formData.append("S", scores.S);
  formData.append("C", scores.C);
  formData.append("result", result);
  answers.forEach((ans, idx) => {
    formData.append(`q${idx + 1}`, ans);
  });

  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    body: formData
  });

  showResult();
}

function showResult() {
  document.getElementById("question-page").style.display = "none";
  const container = document.querySelector(".container");

  const order = ["D", "I", "S", "C"];
  const names = { D: "주도형", I: "사교형", S: "안정형", C: "신중형" };
  const colors = { D: "#d65a4a", I: "#e5c34d", S: "#6fbf73", C: "#5b8bd9" };

  const max = Math.max(scores.D, scores.I, scores.S, scores.C);
  const name = document.getElementById("name").value.trim();

  const topTypes = order
    .filter(t => scores[t] === max)
    .map(t => `${t} (${names[t]})`)
    .join(", ");

  // 1. 제목 수정: 한 줄로 표시 (br 태그 제거)
  let html = `<h1 style="margin-top:0; margin-bottom:20px; font-size: 22px; word-break: keep-all;">${name}님의 유형은 ${topTypes} 입니다.</h1>`;

  order.forEach(t => {
    const value = scores[t];
    const percent = (value / 25) * 100;

    html += `
      <div style="margin:7px 0;">
        <div style="font-weight:700; margin-bottom:1px; text-align:center;">${t} (${names[t]})</div>
        
        <div style="position:relative; width:88%; margin:0 auto; display:flex; align-items:center;">
          <div style="flex:1; position:relative;">
            <div style="height:10px; background:#eee; border-radius:6px;"></div>
            <div style="
              position:absolute;
              top:0;
              left:0;
              height:10px;
              width:${percent}%;
              background:${colors[t]};
              border-radius:6px;
            "></div>
            <div style="
              position:absolute;
              left:${percent}%;
              transform:translateX(-50%);
              top:10px;
              font-weight:700;
              font-size:14px;
              color:${colors[t]};
            ">${value}</div>
          </div>
          <div style="width:28px; text-align:right; font-size:14px; margin-left:1px;">25</div>
        </div>
      </div>
    `;
  });

  // 4. 이미지 출력 (2개 이상일 때 겹침 방지 처리)
  order.filter(t => scores[t] === max).forEach(t => {
    html += `
      <div style="width: 88%; margin: 20px auto;"> 
        <img
          src="images/${t}.png"
          style="
            width: 100%;
            display:block;
            margin:0 auto;
            border-radius: 8px;
            transform: scaleY(1.1); /* 세로로 1.1배 늘리기 */
            transform-origin: top;  /* 위에서부터 아래로 늘어남 */
          "
        >
      </div>
    `;
  });

  container.innerHTML = html;
}