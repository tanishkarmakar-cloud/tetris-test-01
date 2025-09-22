const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Route for the main game page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint for Heroku
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Tetris game server is running',
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🎮 Tetris game server running on port ${PORT}`);
    console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
});
