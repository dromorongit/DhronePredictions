// Advanced Statistics Calculator for Prediction System

class StatisticsCalculator {
    constructor(predictionsData) {
        this.data = predictionsData;
        this.statistics = {};
    }

    calculateAllStatistics() {
        // Reset statistics
        this.statistics = {};

        // Calculate statistics for each prediction type
        const predictionTypes = this.getAllPredictionTypes();

        predictionTypes.forEach(type => {
            this.statistics[type] = this.calculateTypeStatistics(type);
        });

        return this.statistics;
    }

    getAllPredictionTypes() {
        const types = new Set();

        this.data.predictions.forEach(match => {
            Object.keys(match.predictions).forEach(type => {
                if (match.predictions[type]) {
                    types.add(type);
                }
            });
        });

        return Array.from(types);
    }

    calculateTypeStatistics(type) {
        const matches = this.data.predictions.filter(match =>
            match.predictions[type] && match.result.status === 'completed'
        );

        const won = matches.filter(match =>
            match.result.validation[type] === 'won'
        ).length;

        const lost = matches.filter(match =>
            match.result.validation[type] === 'lost'
        ).length;

        const total = won + lost;
        const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

        return {
            total,
            won,
            lost,
            winRate,
            averageOdds: this.calculateAverageOdds(matches, type),
            streak: this.calculateCurrentStreak(matches, type),
            monthlyStats: this.calculateMonthlyStats(matches, type)
        };
    }

    calculateAverageOdds(matches, type) {
        const odds = matches
            .map(match => this.extractOddsFromMatch(match, type))
            .filter(odds => odds > 0);

        if (odds.length === 0) return 0;

        return Math.round((odds.reduce((sum, odd) => sum + odd, 0) / odds.length) * 100) / 100;
    }

    extractOddsFromMatch(match, type) {
        // This would need to be stored in the match data
        // For now, return a default value
        return 2.00;
    }

    calculateCurrentStreak(matches, type) {
        if (matches.length === 0) return { current: 0, type: 'none' };

        // Sort matches by date (newest first)
        const sortedMatches = matches.sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        let streak = 0;
        let streakType = 'none';

        for (const match of sortedMatches) {
            const result = match.result.validation[type];
            if (result === 'won') {
                streak++;
                streakType = 'won';
            } else if (result === 'lost') {
                if (streakType === 'won') break;
                streak++;
                streakType = 'lost';
            }
        }

        return { current: streak, type: streakType };
    }

    calculateMonthlyStats(matches, type) {
        const monthlyData = {};

        matches.forEach(match => {
            const date = new Date(match.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { total: 0, won: 0, lost: 0 };
            }

            monthlyData[monthKey].total++;
            const result = match.result.validation[type];
            if (result === 'won') {
                monthlyData[monthKey].won++;
            } else {
                monthlyData[monthKey].lost++;
            }
        });

        // Calculate win rates for each month
        Object.keys(monthlyData).forEach(month => {
            const data = monthlyData[month];
            data.winRate = data.total > 0 ? Math.round((data.won / data.total) * 100) : 0;
        });

        return monthlyData;
    }

    // Advanced analytics methods
    calculateProfitability(matches, type) {
        const profitable = matches.filter(match => {
            const result = match.result.validation[type];
            const odds = this.extractOddsFromMatch(match, type);
            return result === 'won' && odds > 1;
        }).length;

        const unprofitable = matches.filter(match => {
            const result = match.result.validation[type];
            return result === 'lost';
        }).length;

        return {
            profitable,
            unprofitable,
            profitabilityRate: matches.length > 0 ? Math.round((profitable / matches.length) * 100) : 0
        };
    }

    calculateRiskMetrics(matches, type) {
        const oddsArray = matches
            .map(match => this.extractOddsFromMatch(match, type))
            .filter(odds => odds > 0);

        if (oddsArray.length === 0) {
            return { averageOdds: 0, riskLevel: 'unknown' };
        }

        const avgOdds = oddsArray.reduce((sum, odds) => sum + odds, 0) / oddsArray.length;

        let riskLevel = 'medium';
        if (avgOdds < 1.5) riskLevel = 'low';
        if (avgOdds > 2.5) riskLevel = 'high';

        return {
            averageOdds: Math.round(avgOdds * 100) / 100,
            riskLevel,
            variance: this.calculateVariance(oddsArray, avgOdds)
        };
    }

    calculateVariance(values, mean) {
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return Math.round((squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length) * 100) / 100;
    }

    generatePerformanceReport() {
        const report = {
            summary: {},
            detailed: {},
            recommendations: []
        };

        Object.keys(this.statistics).forEach(type => {
            const stats = this.statistics[type];
            const matches = this.data.predictions.filter(match =>
                match.predictions[type] && match.result.status === 'completed'
            );

            report.summary[type] = {
                winRate: stats.winRate,
                totalPredictions: stats.total,
                performance: this.getPerformanceRating(stats.winRate)
            };

            report.detailed[type] = {
                ...stats,
                profitability: this.calculateProfitability(matches, type),
                riskMetrics: this.calculateRiskMetrics(matches, type),
                streak: stats.streak
            };

            // Generate recommendations
            if (stats.winRate < 50) {
                report.recommendations.push(`${type}: Consider reviewing strategy - win rate below 50%`);
            }
            if (stats.winRate > 75) {
                report.recommendations.push(`${type}: Excellent performance! Consider increasing stakes`);
            }
        });

        return report;
    }

    getPerformanceRating(winRate) {
        if (winRate >= 75) return 'Excellent';
        if (winRate >= 65) return 'Good';
        if (winRate >= 55) return 'Average';
        return 'Needs Improvement';
    }

    // Export statistics for external use
    exportStatistics(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.statistics, null, 2);
        }

        if (format === 'csv') {
            let csv = 'Type,Total,Won,Lost,Win Rate\n';
            Object.entries(this.statistics).forEach(([type, stats]) => {
                csv += `${type},${stats.total},${stats.won},${stats.lost},${stats.winRate}%\n`;
            });
            return csv;
        }

        return this.statistics;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatisticsCalculator;
}

// ES6 export for modern browsers
export { StatisticsCalculator };