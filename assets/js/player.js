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
  const posEl = document.getElementById("info-position");
  const elemEl = document.getElementById("info-element");
  const roleEl = document.getElementById("info-role");
  const ageEl = document.getElementById("info-age");
  const schoolEl = document.getElementById("info-school-year");
  const gameInfoEl = document.getElementById("info-game");
  const imgEl = document.getElementById("player-image");
  const descEl = document.getElementById("player-description");
  const obtainEl = document.getElementById("player-obtain");

  const fullName = player.first_name && player.last_name
    ? `${player.first_name} ${player.last_name}`
    : (player.full_name || "Unknown");

  nameEl.textContent = fullName;
  gameEl.textContent = player.game || "";
  posEl.textContent = player.position || "-";
  elemEl.textContent = player.element || "-";
  roleEl.textContent = player.character_role || "-";
  ageEl.textContent = player.age_group || "-";
  schoolEl.textContent = player.school_year || "-";
  gameInfoEl.textContent = player.game || "-";

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

  renderRadar(stats, fullName);
}

let radarChart;

function renderRadar(stats, fullName) {
  const ctx = document.getElementById("stats-radar");
  if (!ctx) return;

  const dataPoints = [
    stats.kick,
    stats.control,
    stats.technique,
    stats.pressure,
    stats.physical,
    stats.agility,
    stats.intelligence
  ];

  const labels = [
    "Kick",
    "Control",
    "Technique",
    "Pressure",
    "Physical",
    "Agility",
    "Intelligence"
  ];

  if (!radarChart) {
    radarChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels,
        datasets: [
          {
            label: fullName,
            data: dataPoints,
            fill: true,
            backgroundColor: "rgba(255, 212, 71, 0.2)",
            borderColor: "#ffd447",
            pointBackgroundColor: "#ffd447"
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            angleLines: {
              color: "rgba(255,255,255,0.1)"
            },
            grid: {
              color: "rgba(255,255,255,0.15)"
            },
            pointLabels: {
              color: "#e5e7eb",
              font: {
                size: 12
              }
            },
            ticks: {
              color: "#94a3b8",
              backdropColor: "transparent"
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: "#e5e7eb"
            }
          }
        }
      }
    });
  } else {
    radarChart.data.datasets[0].data = dataPoints;
    radarChart.data.datasets[0].label = fullName;
    radarChart.update();
  }
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