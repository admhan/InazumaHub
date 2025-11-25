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

function mergeDataSingle(mainArr, descArr, obtainArr, imagesArr, id) {
  const descMap = buildMapById(descArr, "description");
  const obtainMap = buildMapById(obtainArr, "how_to_obtain");
  const imgMap = {};
  imagesArr.forEach(it => {
    if (!it.id) return;
    const img = it.image || it.img || it.image_url || "";
    imgMap[it.id] = img;
  });

  const base = mainArr.find(p => p.id === id);
  if (!base) return null;

  return {
    ...base,
    description: descMap[id] || "",
    how_to_obtain: obtainMap[id] || "",
    image: imgMap[id] || ""
  };
}

// Multiplicateurs par rareté
const RARITY_MULT = {
  "Normal": 1.0,
  "Grimpant": 1.2,
  "Experimente": 1.4,
  "Emerite": 1.6,
  "Legendaire": 1.8,
  "Heroique": 2.0
};

function applyRarityToStats(player, rarityKey) {
  const mult = RARITY_MULT[rarityKey] || 1.0;

  function scaled(val) {
    const n = Number(val) || 0;
    return Math.floor(n * mult);
  }

  return {
    kick: scaled(player.stat_kick),
    control: scaled(player.stat_control),
    technique: scaled(player.stat_technique),
    pressure: scaled(player.stat_pressure),
    physical: scaled(player.stat_physical),
    agility: scaled(player.stat_agility),
    intelligence: scaled(player.stat_intelligence)
  };
}

function getPlayerIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderPlayer(player, rarityKey) {
  const nameEl = document.getElementById("player-name");
  const gameEl = document.getElementById("player-game");
  const posElemEl = document.getElementById("player-position-element");
  const roleEl = document.getElementById("player-role");
  const ageSchoolEl = document.getElementById("player-age-school");
  const imgEl = document.getElementById("player-image");
  const descEl = document.getElementById("player-description");
  const obtainEl = document.getElementById("player-obtain");

  const fullName = player.first_name && player.last_name
    ? `${player.first_name} ${player.last_name}`
    : (player.full_name || "Unknown");

  nameEl.textContent = fullName;
  gameEl.textContent = player.game || "";
  posElemEl.textContent = `${player.position || "?"} · ${player.element || "?"}`;
  roleEl.textContent = `Role: ${player.character_role || "-"}`;
  ageSchoolEl.textContent = `${player.age_group || ""} – ${player.school_year || ""}`;

  if (player.image) {
    imgEl.src = player.image;
    imgEl.style.display = "block";
  } else {
    imgEl.style.display = "none";
  }

  descEl.textContent = player.description || "No description available.";
  obtainEl.textContent = player.how_to_obtain || "No information yet.";

  const stats = applyRarityToStats(player, rarityKey);

  document.getElementById("stat-kick").textContent = stats.kick;
  document.getElementById("stat-control").textContent = stats.control;
  document.getElementById("stat-technique").textContent = stats.technique;
  document.getElementById("stat-pressure").textContent = stats.pressure;
  document.getElementById("stat-physical").textContent = stats.physical;
  document.getElementById("stat-agility").textContent = stats.agility;
  document.getElementById("stat-intelligence").textContent = stats.intelligence;
}

async function initPlayerPage() {
  const id = getPlayerIdFromUrl();
  if (!id) {
    alert("No player id provided.");
    return;
  }

  try {
    const [main, desc, obtain, images] = await Promise.all([
      loadJson("characters_main.json"),
      loadJson("characters_description.json"),
      loadJson("characters_obtain.json"),
      loadJson("characters_images.json")
    ]);

    const player = mergeDataSingle(main, desc, obtain, images, id);
    if (!player) {
      alert("Player not found.");
      return;
    }

    const raritySelect = document.getElementById("rarity-select");
    const defaultRarity = "Normal";
    raritySelect.value = defaultRarity;
    renderPlayer(player, defaultRarity);

    raritySelect.addEventListener("change", () => {
      const rarity = raritySelect.value;
      renderPlayer(player, rarity);
    });
  } catch (e) {
    console.error("Error loading player page:", e);
  }
}

document.addEventListener("DOMContentLoaded", initPlayerPage);