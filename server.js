const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;
const SCORES_FILE = path.join(__dirname, 'scores.json');

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Initialize scores file if it doesn't exist
if (!fs.existsSync(SCORES_FILE)) {
    fs.writeFileSync(SCORES_FILE, JSON.stringify([]));
}

// Get top 10 leaderboard
app.get('/api/leaderboard', (req, res) => {
    try {
        const data = fs.readFileSync(SCORES_FILE, 'utf8');
        let scores = JSON.parse(data);
        // Sort descending
        scores.sort((a, b) => b.score - a.score);
        // Return top 10
        res.json(scores.slice(0, 10));
    } catch (e) {
        res.status(500).json({ error: 'Failed to read scores' });
    }
});

// Submit a new score
app.post('/api/score', (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        const data = fs.readFileSync(SCORES_FILE, 'utf8');
        let scores = JSON.parse(data);

        scores.push({ name, score, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);

        fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
