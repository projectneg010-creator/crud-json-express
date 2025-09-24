// server.js
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your GitHub repo
const repo = "YOUR_USERNAME/YOUR_REPO"; // e.g. "michaeljamespombo/json-crud"
const filePath = "db.json";             // must exist in your repo
const githubApiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
const githubRawUrl = `https://raw.githubusercontent.com/${repo}/main/${filePath}`;

app.use(express.json());
app.use(express.static("public"));

/**
 * Read DB.json from GitHub
 */
async function readDB() {
  try {
    const res = await axios.get(githubRawUrl);
    return res.data;
  } catch (err) {
    console.error("❌ DB read error:", err.message);
    return [];
  }
}

/**
 * Write DB.json back to GitHub
 */
async function writeDB(data) {
  try {
    // Get current file SHA
    const file = await axios.get(githubApiUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    });

    const sha = file.data.sha;
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

    await axios.put(
      githubApiUrl,
      {
        message: "Update db.json via API",
        content,
        sha,
      },
      {
        headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
      }
    );

    console.log("✅ db.json updated on GitHub!");
  } catch (err) {
    console.error("❌ DB write error:", err.response?.data || err.message);
  }
}

// Routes
app.get("/items", async (req, res) => {
  const items = await readDB();
  res.json(items);
});

app.post("/items", async (req, res) => {
  const items = await readDB();
  const newItem = {
    id: Date.now(),
    name: req.body.name,
    quantity: req.body.quantity,
  };
  items.push(newItem);
  await writeDB(items);
  res.status(201).json(newItem);
});

app.put("/items/:id", async (req, res) => {
  let items = await readDB();
  const id = parseInt(req.params.id);
  items = items.map((item) =>
    item.id === id ? { ...item, ...req.body } : item
  );
  await writeDB(items);
  res.json({ success: true });
});

app.delete("/items/:id", async (req, res) => {
  let items = await readDB();
  const id = parseInt(req.params.id);
  items = items.filter((item) => item.id !== id);
  await writeDB(items);
  res.json({ success: true });
});

// Start
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
