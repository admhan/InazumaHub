// Configuration des chemins JSON (relatifs à index.html)
const DATA_PATH = "data";

async function loadJson(file) {
  const res = await fetch(`${DATA_PATH}/${file}`);
  if (!res.ok) {
    console.error("Failed to load", file, res.status);
    return [];
  }
  return await res.json();
}

function buildMapById(arr, valueKey) {
  const map = {};
  arr.forEach(item => {
    if (!item.id) return;
    map[item.id] = valueKey ? item[valueKey] : item;
  });
  return map;
}

function mergeData(main, desc, obtain, images) {
  const descMap = buildMapById(desc, "description");
  const obtainMap = buildMapById(obtain, "how_to_obtain");
  // image key may be 'image', 'img' or 'image_url' depending on your CSV
  const imgMap = {};
  images.forEach(it => {
    if (!it.id) return;
    const img =
      it.image ||
      it.img ||
      it.image_url ||
      "";
    imgMap[it.id] = img;
  });

  return main.map(ch => ({
    ...ch,
    description: descMap[ch.id] || "",
    how_to_obtain: obtainMap[ch.id] || "",
    image: imgMap[ch.id] || ""
  }));
}

let allPlayers = [];
let filteredPlayers = [];

function getFilters() {
  const search = document.getElementById("search-input").value.trim().toLowerCase();
  const pos = document.getElementById("position-filter").value;
  const elem = document.getElementById("element-filter").value;
  const game = document.getElementById("game-filter").value;
  return { search, pos, elem, game };
}

function applyFilters() {
  const { search, pos, elem, game } = getFilters();

  filteredPlayers = allPlayers.filter(p => {
    if (pos && p.position !== pos) return false;
    if (elem && p.element !== elem) return false;
    if (game && (!p.game || !p.game.startsWith(game))) return false;

    if (search) {
      const full = (p.full_name || "").toLowerCase();
      const f = (p.first_name || "").toLowerCase();
      const l = (p.last_name || "").toLowerCase();
      if (!full.includes(search) && !f.includes(search) && !l.includes(search)) {
        return false;
      }
    }

    return true;
  });

  renderPlayers();
}

function createPlayerCard(player) {
  const card = document.createElement("a");
  card.className = "player-card";
  card.href = `player.html?id=${encodeURIComponent(player.id)}`;

  const header = document.createElement("div");
  header.className = "player-card-header";

  const img = document.createElement("img");
  img.className = "player-card-img";
  if (player.image) {
    img.src = player.image;
  } else {
    img.style.display = "none";
  }

  const nameDiv = document.createElement("div");
  const name = document.createElement("div");
  name.className = "player-card-name";
  name.textContent = player.first_name && player.last_name
    ? `${player.first_name} ${player.last_name}`
    : (player.full_name || "Unknown");

  const meta = document.createElement("div");
  meta.className = "player-card-meta";
  meta.textContent = player.game || "";

  nameDiv.appendChild(name);
  nameDiv.appendChild(meta);

  header.appendChild(img);
  header.appendChild(nameDiv);

  const tagsRow = document.createElement("div");
  tagsRow.className = "player-card-tag-row";

  const posTag = document.createElement("span");
  posTag.className = "tag tag-pos";
  posTag.textContent = player.position || "?";

  const elemTag = document.createElement("span");
  elemTag.className = "tag tag-elem";
  elemTag.textContent = player.element || "?";

  const gameTag = document.createElement("span");
  gameTag.className = "tag tag-game";
  if (player.game_code) {
    gameTag.textContent = `Game ${player.game_code}`;
  } else {
    gameTag.textContent = "Game ?";
  }

  tagsRow.appendChild(posTag);
  tagsRow.appendChild(elemTag);
  tagsRow.appendChild(gameTag);

  const statsMeta = document.createElement("div");
  statsMeta.className = "player-card-meta";
  const total =
    (player.stat_kick || 0) +
    (player.stat_control || 0) +
    (player.stat_technique || 0) +
    (player.stat_pressure || 0) +
    (player.stat_physical || 0) +
    (player.stat_agility || 0) +
    (player.stat_intelligence || 0);
  statsMeta.textContent = `Total stats: ${total}`;

  card.appendChild(header);
  card.appendChild(tagsRow);
  card.appendChild(statsMeta);

  return card;
}

function renderPlayers() {
  const container = document.getElementById("players-container");
  const countSpan = document.getElementById("results-count");
  container.innerHTML = "";

  countSpan.textContent = `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? "s" : ""}`;

  filteredPlayers
    .sort((a, b) => {
      const aName = (a.full_name || "").toLowerCase();
      const bName = (b.full_name || "").toLowerCase();
      return aName.localeCompare(bName);
    })
    .forEach(p => {
      container.appendChild(createPlayerCard(p));
    });
}

async function init() {
  try {
    const [main, desc, obtain, images] = await Promise.all([
      loadJson("characters_main.json"),
      loadJson("characters_description.json"),
      loadJson("characters_obtain.json"),
      loadJson("characters_images.json")
    ]);

    allPlayers = mergeData(main, desc, obtain, images);
    filteredPlayers = [...allPlayers];

    document.getElementById("search-input").addEventListener("input", applyFilters);
    document.getElementById("position-filter").addEventListener("change", applyFilters);
    document.getElementById("element-filter").addEventListener("change", applyFilters);
    document.getElementById("game-filter").addEventListener("change", applyFilters);

    renderPlayers();
  } catch (e) {
    console.error("Error initializing InazumaHub:", e);
  }
}

document.addEventListener("DOMContentLoaded", init);