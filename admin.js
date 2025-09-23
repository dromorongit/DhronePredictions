// Admin Panel JavaScript for Match Results Management

class PredictionManager {
    constructor() {
        this.data = null;
        this.currentMatch = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderPredictions();
        this.renderStatistics();
    }

    async loadData() {
        try {
            const response = await fetch('predictions-data.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = { predictions: [], statistics: {} };
        }
    }

    setupEventListeners() {
        const form = document.getElementById('matchResultForm');
        const fixtureSelect = document.getElementById('fixtureSelect');

        // Populate fixture dropdown
        this.populateFixtureDropdown();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleMatchResult();
        });

        fixtureSelect.addEventListener('change', (e) => {
            this.handleFixtureChange(e.target.value);
        });

        document.getElementById('updateAllPages').addEventListener('click', () => {
            this.updateAllPages();
        });
    }

    populateFixtureDropdown() {
        const select = document.getElementById('fixtureSelect');
        const pendingMatches = this.data.predictions.filter(match =>
            match.result.status !== 'completed'
        );

        console.log('Pending matches found:', pendingMatches.length);
        console.log('All matches:', this.data.predictions.length);

        select.innerHTML = '<option value="">Choose a match...</option>';

        if (pendingMatches.length === 0) {
            select.innerHTML += '<option value="" disabled>No pending matches available</option>';
            console.log('No pending matches to display');
            return;
        }

        pendingMatches.forEach(match => {
            const option = document.createElement('option');
            option.value = match.id;
            option.textContent = `${match.fixture} - ${match.competition}`;
            select.appendChild(option);
        });

        console.log('Dropdown populated with', pendingMatches.length, 'matches');
    }

    handleFixtureChange(matchId) {
        this.currentMatch = this.data.predictions.find(match => match.id === matchId);
        if (this.currentMatch) {
            this.showCornersInputs();
        } else {
            this.hideCornersInputs();
        }
    }

    showCornersInputs() {
        document.getElementById('cornersGroup').style.display = 'block';
        document.getElementById('awayCornersGroup').style.display = 'block';
    }

    hideCornersInputs() {
        document.getElementById('cornersGroup').style.display = 'none';
        document.getElementById('awayCornersGroup').style.display = 'none';
    }

    handleMatchResult() {
        if (!this.currentMatch) {
            alert('Please select a match first');
            return;
        }

        const homeScore = parseInt(document.getElementById('homeScore').value);
        const awayScore = parseInt(document.getElementById('awayScore').value);
        const homeCorners = document.getElementById('homeCorners').value ?
            parseInt(document.getElementById('homeCorners').value) : null;
        const awayCorners = document.getElementById('awayCorners').value ?
            parseInt(document.getElementById('awayCorners').value) : null;

        // Update match result
        this.currentMatch.result.homeScore = homeScore;
        this.currentMatch.result.awayScore = awayScore;
        this.currentMatch.result.finalScore = `${homeScore}-${awayScore}`;
        this.currentMatch.result.status = 'completed';

        // Handle corners for corner-based predictions
        if (homeCorners !== null && awayCorners !== null) {
            this.currentMatch.result.homeCorners = homeCorners;
            this.currentMatch.result.awayCorners = awayCorners;
            this.currentMatch.result.totalCorners = homeCorners + awayCorners;
        }

        // Validate predictions
        this.validatePredictions();

        // Update statistics
        this.updateStatistics();

        // Save data
        this.saveData();

        // Refresh display
        this.renderPredictions();
        this.renderStatistics();
        this.populateFixtureDropdown();

        alert('Match result updated successfully!');
    }

    validatePredictions() {
        const match = this.currentMatch;
        const homeScore = match.result.homeScore;
        const awayScore = match.result.awayScore;
        const totalGoals = homeScore + awayScore;
        const totalCorners = match.result.totalCorners;

        // Validate each prediction type
        Object.keys(match.predictions).forEach(predictionType => {
            const prediction = match.predictions[predictionType];

            if (!prediction) return;

            let result = 'lost'; // Default to lost

            switch (predictionType) {
                case 'double-chance':
                    result = this.validateDoubleChance(prediction, homeScore, awayScore);
                    break;
                case 'over-2-5':
                    result = totalGoals > 2.5 ? 'won' : 'lost';
                    break;
                case 'btts-gg':
                    result = (homeScore > 0 && awayScore > 0) ? 'won' : 'lost';
                    break;
                case 'super-single':
                case 'over-corners':
                    if (prediction.includes('Over') && totalCorners) {
                        const overValue = parseFloat(prediction.match(/Over (\d+\.?\d*)/)[1]);
                        result = totalCorners > overValue ? 'won' : 'lost';
                    }
                    break;
            }

            match.result.validation[predictionType] = result;
        });
    }

    validateDoubleChance(prediction, homeScore, awayScore) {
        switch (prediction) {
            case '1X':
                return homeScore >= awayScore ? 'won' : 'lost';
            case 'X2':
                return awayScore >= homeScore ? 'won' : 'lost';
            case '12':
                return homeScore !== awayScore ? 'won' : 'lost';
            default:
                return 'lost';
        }
    }

    async updateStatistics() {
        try {
            // Import and use the Statistics Calculator
            const { StatisticsCalculator } = await import('./statistics-calculator.js');
            const calculator = new StatisticsCalculator(this.data);
            this.data.statistics = calculator.calculateAllStatistics();
        } catch (error) {
            console.error('Error calculating statistics:', error);
            // Fallback to basic calculation
            this.calculateBasicStatistics();
        }
    }

    calculateBasicStatistics() {
        const stats = this.data.statistics;

        // Reset statistics
        Object.keys(stats).forEach(key => {
            stats[key] = { total: 0, won: 0, lost: 0, winRate: 0 };
        });

        // Calculate new statistics
        this.data.predictions.forEach(match => {
            if (match.result.status === 'completed') {
                Object.keys(match.predictions).forEach(predictionType => {
                    if (match.predictions[predictionType]) {
                        if (!stats[predictionType]) {
                            stats[predictionType] = { total: 0, won: 0, lost: 0, winRate: 0 };
                        }

                        stats[predictionType].total++;
                        const validation = match.result.validation[predictionType];
                        if (validation === 'won') {
                            stats[predictionType].won++;
                        } else {
                            stats[predictionType].lost++;
                        }
                    }
                });
            }
        });

        // Calculate win rates
        Object.keys(stats).forEach(key => {
            const stat = stats[key];
            if (stat.total > 0) {
                stat.winRate = Math.round((stat.won / stat.total) * 100);
            }
        });
    }

    async saveData() {
        try {
            const response = await fetch('predictions-data.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.data, null, 2)
            });

            if (!response.ok) {
                throw new Error('Failed to save data');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Error saving data. Please try again.');
        }
    }

    renderPredictions() {
        const grid = document.getElementById('predictionsGrid');
        grid.innerHTML = '';

        this.data.predictions.forEach(match => {
            const card = document.createElement('div');
            card.className = 'prediction-card';

            const status = match.result.status === 'completed' ? 'completed' : 'pending';
            const statusText = status === 'completed' ? '✅ Completed' : '⏳ Pending';

            card.innerHTML = `
                <h3>${match.competition}</h3>
                <p class="fixture"><strong>${match.fixture}</strong></p>
                <p><strong>Status:</strong> ${statusText}</p>
                ${match.result.finalScore ? `<p><strong>Score:</strong> ${match.result.finalScore}</p>` : ''}
                ${match.result.totalCorners ? `<p><strong>Corners:</strong> ${match.result.totalCorners} total</p>` : ''}
                <div class="predictions-list">
                    ${Object.entries(match.predictions).map(([type, prediction]) =>
                        prediction ? `<p><strong>${type}:</strong> ${prediction}</p>` : ''
                    ).join('')}
                </div>
                ${status === 'completed' ? `
                    <div class="result-indicator">
                        ${Object.entries(match.result.validation).map(([type, result]) =>
                            `<div>
                                <input type="checkbox" ${result === 'won' ? 'checked' : ''} disabled>
                                <label class="result-label ${result === 'won' ? 'won-label' : 'lost-label'}">
                                    ${result === 'won' ? '✅' : '❌'} ${type}
                                </label>
                            </div>`
                        ).join('')}
                    </div>
                ` : ''}
            `;

            grid.appendChild(card);
        });
    }

    renderStatistics() {
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = '';

        Object.entries(this.data.statistics).forEach(([type, stats]) => {
            const statDiv = document.createElement('div');
            statDiv.className = 'stat-item';
            statDiv.innerHTML = `
                <div class="stat-number">${stats.winRate}%</div>
                <div class="stat-label">${type.toUpperCase()}</div>
                <div>${stats.won}W - ${stats.lost}L (${stats.total} total)</div>
            `;
            statsGrid.appendChild(statDiv);
        });
    }

    async updateAllPages() {
        try {
            // Import and use the HTML Update System
            const { HTMLUpdateSystem } = await import('./update-system.js');
            const updateSystem = new HTMLUpdateSystem();
            await updateSystem.init();

            const result = await updateSystem.updateAllPages();

            if (result.success) {
                alert('✅ All pages updated successfully! The new match results and statistics have been applied to all prediction pages.');
            } else {
                alert('❌ Error updating pages. Please try again.');
            }

        } catch (error) {
            console.error('Error updating pages:', error);
            alert('Error updating pages. Please try again.');
        }
    }
}

// Initialize the admin panel when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PredictionManager();
});