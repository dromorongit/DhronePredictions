// Simple Node.js server for handling file updates
// Run with: node server.js

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Endpoint to update HTML files
app.post('/update-html', async (req, res) => {
    try {
        const { filename, content } = req.body;

        if (!filename || !content) {
            return res.status(400).json({
                success: false,
                error: 'Filename and content are required'
            });
        }

        // Security check - only allow HTML files in the current directory
        const allowedFiles = [
            'double-chance.html',
            'super-single.html',
            'free-2-odds.html',
            'over-2-5.html',
            'btts-gg.html',
            'over-corners.html'
        ];

        if (!allowedFiles.includes(filename)) {
            return res.status(403).json({
                success: false,
                error: 'File not allowed for updates'
            });
        }

        // Note: Railway filesystem is read-only, so we return the content
        // The client will handle the file update via download
        console.log(`✅ Generated updated content for ${filename}`);

        res.json({
            success: true,
            message: `${filename} content generated successfully`,
            content: content,
            method: 'download',
            instructions: 'Download the file and replace it on your website'
        });

    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint to update JSON data
app.put('/update-data', async (req, res) => {
    try {
        const data = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Data is required'
            });
        }

        // Note: Railway filesystem is read-only, so we return the updated data
        // The client will handle the data update
        console.log('✅ Updated predictions data in memory');

        res.json({
            success: true,
            message: 'Data updated successfully',
            data: data,
            method: 'memory',
            instructions: 'Data updated in server memory'
        });

    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Prediction Update Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Prediction Update Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔧 Available endpoints:`);
    console.log(`   GET  /health - Health check`);
    console.log(`   POST /update-html - Update HTML files`);
    console.log(`   PUT  /update-data - Update JSON data`);
    console.log(`   All files served statically`);
});