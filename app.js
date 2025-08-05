let data = [];
let currentIndex = 0;
let mode = "flashcard";
let showingStep = 0;

function setMode(m) {
  mode = m;
  showingStep = 0;
  render();
}

function loadCSV() {
  fetch("data.csv")
    .then(res => res.text())
    .then(text => {
      const rows = text.split("\n").slice(1).filter(Boolean);
      data = rows.map(row => {
        const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, ''));
        return {
          aws_service_name: cols[0],
          key_word: cols[1],
          what_it_is: cols[2],
          use_case: cols[3],
          note_1: cols[4]
        };
      });
      populateDropdown();
      render();
    });
}

function populateDropdown() {
  const select = document.getElementById("serviceFilter");
  const services = Array.from(new Set(data.map(d => d.aws_service_name)));
  select.innerHTML = '<option value="All">All Services</option>' +
    services.map(s => `<option value="${s}">${s}</option>`).join('');
  select.onchange = render;
}

function getFilteredData() {
  const selected = document.getElementById("serviceFilter").value;
  return selected === "All" ? data : data.filter(d => d.aws_service_name === selected);
}

function render() {
  const filtered = getFilteredData();
  const container = document.getElementById("app");
  container.innerHTML = "";

  if (mode === "flashcard") {
    document.getElementById("flashcard-nav").style.display = "block";
    const item = filtered[currentIndex % filtered.length];
    const card = document.createElement("div");
    card.className = "card";
    card.onclick = () => {
      showingStep = (showingStep + 1) % 3;
      render();
    };

    let content = `<strong>Keyword:</strong> ${item.key_word}`;
    if (showingStep >= 1) content += `<br><strong>What it is:</strong> ${item.what_it_is}<br><strong>Note:</strong> ${item.note_1}`;
    if (showingStep === 2) content += `<br><strong>Use Case:</strong> ${item.use_case}`;
    card.innerHTML = content;
    container.appendChild(card);
  } else {
    document.getElementById("flashcard-nav").style.display = "none";
    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <strong>Service:</strong> ${item.aws_service_name}<br>
        <strong>Keyword:</strong> ${item.key_word}<br>
        <strong>What it is:</strong> ${item.what_it_is}<br>
        <strong>Note:</strong> ${item.note_1}<br>
        <strong>Use Case:</strong> ${item.use_case}`;
      container.appendChild(card);
    });
  }
}

function nextCard() {
  const filtered = getFilteredData();
  currentIndex = (currentIndex + 1) % filtered.length;
  showingStep = 0;
  render();
}

function prevCard() {
  const filtered = getFilteredData();
  currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
  showingStep = 0;
  render();
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const filtered = getFilteredData();

  let y = 10;
  filtered.forEach((item, i) => {
    const lines = [
      `Service: ${item.aws_service_name}`,
      `Keyword: ${item.key_word}`,
      `What it is: ${item.what_it_is}`,
      `Note: ${item.note_1}`,
      `Use Case: ${item.use_case}`
    ];
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 7;
    });
    y += 5;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save("cheatsheet.pdf");
}

loadCSV();