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
  const imageMap = Object.fromEntries(images.map((item) => [item.full_name, item.image_url]));
  const descMap = Object.fromEntries(desc.map((item) => [item.full_name, item.description]));
  const obtainMap = Object.fromEntries(obtain.map((item) => [item.full_name, item.how_to_obtain]));

  playersData = main.map(p => ({
    ...p,
    image_url: imageMap[p.full_name] || "assets/img/no_image.png",
    description: descMap[p.full_name] || "",
    how_to_obtain: obtainMap[p.full_name] || ""
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
      const valA = Number(a[stat]);
      const valB = Number(b[stat]);
      return order === "asc" ? valA - valB : valB - valA;
    });
  }

  renderPlayers();
}

// --- RENDER ---
function renderPlayers() {
  playersContainer.innerHTML = "";

  filteredPlayers.forEach(p => {
    const row = document.createElement("tr");
    const detailUrl = `player.html?id=${encodeURIComponent(p.id)}`;

    row.innerHTML = `
      <td><img src="${p.image_url}" alt="${p.full_name}" class="player-photo"></td>
      <td><a href="${detailUrl}">${p.first_name}</a></td>
      <td><a href="${detailUrl}">${p.last_name}</a></td>
      <td>${p.element}</td>
      <td>${p.position}</td>
      <td>${p.stat_kick}</td>
      <td>${p.stat_control}</td>
      <td>${p.stat_technique}</td>
      <td>${p.stat_pressure}</td>
      <td>${p.stat_physical}</td>
      <td>${p.stat_agility}</td>
      <td>${p.stat_intelligence}</td>
    `;

    row.addEventListener("click", () => {
      window.location.href = detailUrl;
    });

    row.style.cursor = "pointer";

    playersContainer.appendChild(row);
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
