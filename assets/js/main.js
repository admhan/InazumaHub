let playersData = [];
let filteredPlayers = [];

const searchInput = document.getElementById("search-input");
const positionFilter = document.getElementById("position-filter");
const elementFilter = document.getElementById("element-filter");
const gameFilter = document.getElementById("game-filter");

const sortStatSelect = document.getElementById("sort-stat");
const sortDirectionBtn = document.getElementById("sort-direction");

const resultsCount = document.getElementById("results-count");
const playersContainer = document.getElementById("players-container");

function loadAllData() {
  return Promise.all([
    fetch("data/characters_main.json").then(r => r.json()),
    fetch("data/characters_images.json").then(r => r.json()),
    fetch("data/characters_description.json").then(r => r.json()),
    fetch("data/characters_obtain.json").then(r => r.json())
  ]);
}

loadAllData().then(([main, images, desc, obtain]) => {

  playersData = main.map(p => ({
    ...p,
    image_url: images[p.full_name] || "assets/img/no_image.png",
    description: desc[p.full_name] || "",
    how_to_obtain: obtain[p.full_name] || ""
  }));

  filteredPlayers = playersData;
  applySorting();
  renderPlayers();
});

// --- FILTERING ---
function applyFilters() {
  const searchValue = searchInput.value.toLowerCase();
  const posValue = positionFilter.value;
  const elemValue = elementFilter.value;
  const gameValue = gameFilter.value;

  filteredPlayers = playersData.filter(p => {
    return (
      p.full_name.toLowerCase().includes(searchValue) &&
      (posValue === "" || p.position === posValue) &&
      (elemValue === "" || p.element === elemValue) &&
      (gameValue === "" || p.game === gameValue)
    );
  });

  applySorting();
}

// --- SORTING ---
function applySorting() {
  const stat = sortStatSelect.value;
  const order = sortDirectionBtn.dataset.order;

  if (stat) {
    filteredPlayers.sort((a, b) => {
      const valA = Number(a["stat_" + stat]);
      const valB = Number(b["stat_" + stat]);
      return order === "asc" ? valA - valB : valB - valA;
    });
  }

  renderPlayers();
}

// --- RENDER ---
function renderPlayers() {
  playersContainer.innerHTML = "";

  filteredPlayers.forEach(p => {
    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <img src="${p.image_url}" alt="${p.full_name}">
      <h3>${p.first_name} ${p.last_name}</h3>
      <p><strong>${p.position}</strong> — ${p.element}</p>
      <p class="stats-small">Kick: ${p.stat_kick} | Ctrl: ${p.stat_control}</p>
      <a class="btn" href="player.html?id=${p.id}">Details</a>
    `;

    playersContainer.appendChild(card);
  });

  resultsCount.textContent = `${filteredPlayers.length} players`;
}

// --- EVENTS ---
searchInput.addEventListener("input", applyFilters);
positionFilter.addEventListener("change", applyFilters);
elementFilter.addEventListener("change", applyFilters);
gameFilter.addEventListener("change", applyFilters);

sortStatSelect.addEventListener("change", applySorting);

sortDirectionBtn.addEventListener("click", () => {
  if (sortDirectionBtn.dataset.order === "asc") {
    sortDirectionBtn.dataset.order = "desc";
    sortDirectionBtn.textContent = "⬇ Descending";
  } else {
    sortDirectionBtn.dataset.order = "asc";
    sortDirectionBtn.textContent = "⬆ Ascending";
  }
  applySorting();
});
