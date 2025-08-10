import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/pdf.min.js";

const fileInput = document.getElementById('fileInput');
const quizDiv = document.getElementById('quiz');
const topicDiv = document.getElementById('topic');
const questionText = document.getElementById('questionText');
const optionsDiv = document.getElementById('options');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const resultDiv = document.getElementById('result');
const explanationDiv = document.getElementById('explanation');

let questions = [];
let currentQ = 0;
let selectedAnswer = null;
let answered = false;

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return alert('Please select a PDF file.');
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
  const pdf = await loadingTask.promise;

  let fullText = '';
  for(let i=1; i<=pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join('\n') + '\n\n';
  }

  questions = parsePDFText(fullText);
  if (questions.length === 0) return alert('No questions found or bad format.');
  currentQ = 0;
  selectedAnswer = null;
  answered = false;
  showQuestion(currentQ);
  quizDiv.style.display = 'block';
  fileInput.value = '';
});

function parsePDFText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
  let topic = '';
  const qs = [];
  let qObj = null;

  for(let line of lines) {
    if (/^Topic:/i.test(line)) {
      topic = line.replace(/^Topic:\s*/i, '');
    }
    else if (/^Q\d+:/i.test(line)) {
      if (qObj) qs.push(qObj);
      qObj = {topic, question: line.replace(/^Q\d+:\s*/i, ''), options: {}, answer: null, explanation: ''};
    }
    else if (/^[A-Z]\)/.test(line)) {
      const key = line[0];
      const val = line.slice(2).trim();
      if (qObj) qObj.options[key] = val;
    }
    else if (/^Answer:/i.test(line)) {
      if (qObj) qObj.answer = line.replace(/^Answer:\s*/i, '').toUpperCase();
    }
    else if (/^Explanation:/i.test(line)) {
      if (qObj) qObj.explanation = line.replace(/^Explanation:\s*/i, '');
    }
    else {
      if (qObj && qObj.explanation) qObj.explanation += ' ' + line;
    }
  }
  if (qObj) qs.push(qObj);
  return qs;
}

function showQuestion(index) {
  const q = questions[index];
  topicDiv.textContent = q.topic ? `Topic: ${q.topic}` : '';
  questionText.textContent = `${index + 1}. ${q.question}`;
  optionsDiv.innerHTML = '';
  resultDiv.textContent = '';
  explanationDiv.textContent = '';
  submitBtn.style.display = 'inline-block';
  nextBtn.style.display = 'none';
  selectedAnswer = null;
  answered = false;

  for (const [key, val] of Object.entries(q.options)) {
    const label = document.createElement('label');
    label.className = 'option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'option';
    radio.value = key;
    radio.onclick = () => {
      selectedAnswer = key;
      resultDiv.textContent = '';
      explanationDiv.textContent = '';
    };

    label.appendChild(radio);
    label.append(` ${key}) ${val}`);
    optionsDiv.appendChild(label);
  }
}

submitBtn.addEventListener('click', () => {
  if (answered) return;
  if (!selectedAnswer) return alert('Please select an answer.');

  const q = questions[currentQ];
  answered = true;
  submitBtn.style.display = 'none';
  nextBtn.style.display = 'inline-block';

  if (selectedAnswer === q.answer) {
    resultDiv.textContent = 'Correct! ✅';
    resultDiv.style.color = 'green';
  } else {
    resultDiv.textContent = `Wrong! ❌ Correct answer: ${q.answer}) ${q.options[q.answer]}`;
    resultDiv.style.color = 'red';
  }

  if (q.explanation) {
    explanationDiv.textContent = `Explanation: ${q.explanation}`;
  }
});

nextBtn.addEventListener('click', () => {
  currentQ++;
  if (currentQ < questions.length) {
    showQuestion(currentQ);
  } else {
    alert('Quiz finished!');
    quizDiv.style.display = 'none';
  }
});
