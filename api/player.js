// FF Lookup API — Developed by Sazid 17k
const https = require("https");

const API_KEYS = [
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
  process.env.API_KEY_4,
  process.env.API_KEY_5,
  process.env.API_KEY_6,
  process.env.API_KEY_7,
  process.env.API_KEY_8,
  process.env.API_KEY_9,
  process.env.API_KEY_10,
].filter(Boolean);

function randomKey() {
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

function httpGet(url, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { "x-api-key": apiKey },
      timeout: 15000,
    };
    https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: {} });
        }
      });
    }).on("error", reject).on("timeout", () => reject(new Error("timeout")));
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { uid, region } = req.query;

  if (!uid) return res.status(400).json({ error: "UID দাও!" });
  if (!/^\d{8,13}$/.test(uid)) return res.status(400).json({ error: "UID সঠিক না!" });
  if (API_KEYS.length === 0) return res.status(500).json({ error: "API Key নেই!" });

  const tried = new Set();

  for (let i = 0; i < Math.min(3, API_KEYS.length); i++) {
    let key = randomKey();
    let t = 0;
    while (tried.has(key) && t++ < API_KEYS.length) key = randomKey();
    tried.add(key);

    let url = `https://api.gameskinbo.com/ff-info/get?uid=${uid}`;
    if (region) url += `&region=${region}`;

    try {
      const r = await httpGet(url, key);

      if (r.status === 200) return res.status(200).json(r.body);
      if (r.status === 429) { await sleep(600); continue; }
      if (r.status === 402 || r.status === 404) {
        return res.status(404).json({ error: "UID পাওয়া যায়নি!" });
      }
    } catch (e) {
      await sleep(500);
    }
  }

  return res.status(503).json({ error: "সার্ভার সমস্যা! আবার চেষ্টা করো।" });
};
