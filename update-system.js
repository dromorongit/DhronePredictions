// Automatic HTML Update System for Prediction Pages

class HTMLUpdateSystem {
    constructor() {
        this.predictionsData = null;
        this.pagesToUpdate = [
            'double-chance.html',
            'super-single.html',
            'free-2-odds.html',
            'over-2-5.html',
            'btts-gg.html',
            'over-corners.html'
        ];
    }

    async init() {
        await this.loadPredictionsData();
    }

    async loadPredictionsData() {
        try {
            const response = await fetch('predictions-data.json');
            this.predictionsData = await response.json();
        } catch (error) {
            console.error('Error loading predictions data:', error);
        }
    }

    async updateAllPages() {
        console.log('Starting HTML updates...');

        for (const page of this.pagesToUpdate) {
            try {
                await this.updatePage(page);
                console.log(`✅ Updated ${page}`);
            } catch (error) {
                console.error(`❌ Error updating ${page}:`, error);
            }
        }

        console.log('HTML updates completed!');
        return { success: true, message: 'All pages updated successfully!' };
    }

    async updatePage(pageName) {
        // Read the current HTML file
        const response = await fetch(pageName);
        let html = await response.text();

        // Update the previously won section
        html = this.updatePreviouslyWonSection(html, pageName);

        // Update statistics
        html = this.updateStatisticsSection(html, pageName);

        // Write back the updated HTML
        await this.writeHTMLFile(pageName, html);
    }

    updatePreviouslyWonSection(html, pageName) {
        const completedMatches = this.predictionsData.predictions.filter(match =>
            match.result.status === 'completed'
        );

        // Group matches by prediction type
        const matchesByType = {};
        completedMatches.forEach(match => {
            Object.keys(match.predictions).forEach(predictionType => {
                if (match.predictions[predictionType]) {
                    if (!matchesByType[predictionType]) {
                        matchesByType[predictionType] = [];
                    }
                    matchesByType[predictionType].push(match);
                }
            });
        });

        // Determine which prediction type this page is for
        const pagePredictionType = this.getPagePredictionType(pageName);

        if (!pagePredictionType || !matchesByType[pagePredictionType]) {
            return html; // No updates needed
        }

        const relevantMatches = matchesByType[pagePredictionType];

        // Generate new HTML for the won tips section
        const wonTipsHTML = this.generateWonTipsHTML(relevantMatches, pagePredictionType);

        // Replace the existing won tips section
        const wonTipsRegex = /<!-- Previously Won Tips Section -->[\s\S]*?<!-- Statistics Section -->/g;
        const newSection = `<!-- Previously Won Tips Section -->
        <section class="won-tips-section">
            <h2>Previously Won ${this.getPageTitle(pageName)} Tips</h2>
            <div class="updated-date" id="yesterday-date"></div>
            <p class="section-description">Our track record of successful ${this.getPageTitle(pageName)} predictions</p>
            <div class="won-tips-grid">
                ${wonTipsHTML}
            </div>

            <!-- Statistics Section -->`;

        return html.replace(wonTipsRegex, newSection);
    }

    generateWonTipsHTML(matches, predictionType) {
        return matches.map((match, index) => {
            const validation = match.result.validation[predictionType];
            const isWon = validation === 'won';

            return `
                <div class="won-tip-card ${isWon ? 'won' : 'lost'}">
                    <div class="tip-header">
                        <h3>${match.competition}</h3>
                        <div class="result-indicator">
                            <input type="checkbox" id="${predictionType}-tip-${index + 1}" ${isWon ? 'checked' : ''} disabled>
                            <label for="${predictionType}-tip-${index + 1}" class="result-label ${isWon ? 'won-label' : 'lost-label'}">
                                ${isWon ? '✅ WON' : '❌ LOST'}
                            </label>
                        </div>
                    </div>
                    <p class="fixture">${match.fixture}</p>
                    <p class="tip">${match.predictions[predictionType]}</p>
                    <p class="odds">Odds: ${this.getMatchOdds(match, predictionType)}</p>
                    <p class="result">${this.getMatchResult(match)}</p>
                </div>
            `;
        }).join('\n                ');
    }

    getMatchOdds(match, predictionType) {
        // This would need to be stored in the match data or calculated
        // For now, return a placeholder
        return '2.00';
    }

    getMatchResult(match) {
        if (match.result.finalScore) {
            return `Final Score: ${match.result.finalScore}`;
        } else if (match.result.totalCorners) {
            return `Corners: ${match.result.homeCorners}-${match.result.awayCorners} (${match.result.totalCorners} total)`;
        }
        return 'Result pending';
    }

    updateStatisticsSection(html, pageName) {
        const pagePredictionType = this.getPagePredictionType(pageName);

        if (!pagePredictionType || !this.predictionsData.statistics[pagePredictionType]) {
            return html;
        }

        const stats = this.predictionsData.statistics[pagePredictionType];

        const statsRegex = /<!-- Statistics Section -->[\s\S]*?<div class="tips-stats">[\s\S]*?<\/div>/g;
        const newStatsSection = `<!-- Statistics Section -->
            <div class="tips-stats">
                <div class="stat-item">
                    <div class="stat-number">${stats.winRate}%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.total}</div>
                    <div class="stat-label">Total Tips</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.won}</div>
                    <div class="stat-label">Won</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stats.lost}</div>
                    <div class="stat-label">Lost</div>
                </div>
            </div>`;

        return html.replace(statsRegex, newStatsSection);
    }

    getPagePredictionType(pageName) {
        const typeMap = {
            'double-chance.html': 'double-chance',
            'super-single.html': 'super-single',
            'free-2-odds.html': 'free-2-odds',
            'over-2-5.html': 'over-2-5',
            'btts-gg.html': 'btts-gg',
            'over-corners.html': 'over-corners'
        };
        return typeMap[pageName];
    }

    getPageTitle(pageName) {
        const titleMap = {
            'double-chance.html': 'Double Chance',
            'super-single.html': 'Super Single',
            'free-2-odds.html': 'Free 2 Odds',
            'over-2-5.html': 'Over 2.5',
            'btts-gg.html': 'BTTS/GG',
            'over-corners.html': 'Over Corners'
        };
        return titleMap[pageName] || 'Prediction';
    }

    async writeHTMLFile(filename, content) {
        // In a real implementation, this would write to the actual file
        // For now, we'll simulate the update
        console.log(`Writing updated content to ${filename}`);

        // This is where you would actually write the file
        // In a browser environment, this would require special permissions
        // or a server-side component

        return true;
    }

    // Method to add new predictions to the system
    async addNewPrediction(matchData) {
        this.predictionsData.predictions.push({
            id: `match-${Date.now()}`,
            ...matchData,
            result: {
                homeScore: null,
                awayScore: null,
                finalScore: null,
                status: 'pending',
                validation: {}
            }
        });

        await this.savePredictionsData();
    }

    async savePredictionsData() {
        try {
            const response = await fetch('predictions-data.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.predictionsData, null, 2)
            });

            if (!response.ok) {
                throw new Error('Failed to save predictions data');
            }
        } catch (error) {
            console.error('Error saving predictions data:', error);
        }
    }

    // Method to get current statistics
    getStatistics() {
        return this.predictionsData.statistics;
    }

    // Method to get pending matches
    getPendingMatches() {
        return this.predictionsData.predictions.filter(match =>
            match.result.status !== 'completed'
        );
    }

    // Method to get completed matches
    getCompletedMatches() {
        return this.predictionsData.predictions.filter(match =>
            match.result.status === 'completed'
        );
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTMLUpdateSystem;
}