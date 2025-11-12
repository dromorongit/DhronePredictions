#!/usr/bin/env node

/**
 * Comprehensive Bot Testing and Debugging Tool
 * Tests all aspects of the Telegram bot system
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class BotDiagnostics {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
        
        // Test configuration
        this.BOT_TOKEN = process.env.BOT_TOKEN || '8284449243:AAGIVO5aVfo1LAcQ29wXxHJoY3Pq4QqVOZ0';
        this.ADMIN_USER_ID = process.env.ADMIN_USER_ID || '83222398921';
        this.testTimeout = 10000; // 10 seconds
    }

    logTest(name, status, message, details = {}) {
        const test = {
            name,
            status, // 'passed', 'failed', 'warning'
            message,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(test);
        this.results.summary.total++;
        
        switch (status) {
            case 'passed':
                this.results.summary.passed++;
                console.log(`✅ ${name}: ${message}`);
                break;
            case 'failed':
                this.results.summary.failed++;
                console.log(`❌ ${name}: ${message}`);
                break;
            case 'warning':
                this.results.summary.warnings++;
                console.log(`⚠️ ${name}: ${message}`);
                break;
        }
        
        if (details && Object.keys(details).length > 0) {
            console.log(`   Details:`, JSON.stringify(details, null, 2));
        }
    }

    async testBotTokenValidity() {
        console.log('\n🔐 Testing Bot Token Validity...');
        
        try {
            const bot = new TelegramBot(this.BOT_TOKEN, { polling: false });
            const botInfo = await bot.getMe();
            
            this.logTest(
                'Bot Token Validity',
                'passed',
                `Valid bot token for @${botInfo.username}`,
                {
                    botName: botInfo.first_name,
                    username: botInfo.username,
                    botId: botInfo.id,
                    canJoinGroups: botInfo.can_join_groups,
                    canReadAllGroupMessages: botInfo.can_read_all_group_messages
                }
            );
            
            return { bot, botInfo, valid: true };
        } catch (error) {
            this.logTest(
                'Bot Token Validity',
                'failed',
                `Invalid bot token: ${error.message}`,
                { errorCode: error.code, errorResponse: error.response?.body }
            );
            return { bot: null, botInfo: null, valid: false };
        }
    }

    async testAdminUserAccess(bot) {
        console.log('\n👤 Testing Admin User Access...');
        
        if (!bot) {
            this.logTest(
                'Admin User Access',
                'failed',
                'Cannot test admin access - bot not available'
            );
            return;
        }
        
        try {
            const adminInfo = await bot.getChat(this.ADMIN_USER_ID);
            
            this.logTest(
                'Admin User Access',
                'passed',
                `Admin user ${adminInfo.first_name} (@${adminInfo.username || 'no_username'}) accessible`,
                {
                    userId: adminInfo.id,
                    firstName: adminInfo.first_name,
                    username: adminInfo.username,
                    type: adminInfo.type
                }
            );
        } catch (error) {
            this.logTest(
                'Admin User Access',
                'warning',
                `Admin user might be inaccessible: ${error.message}`,
                { userId: this.ADMIN_USER_ID }
            );
        }
    }

    testEnvironmentVariables() {
        console.log('\n🌍 Testing Environment Variables...');
        
        const envVars = {
            BOT_TOKEN: process.env.BOT_TOKEN,
            ADMIN_USER_ID: process.env.ADMIN_USER_ID,
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DAILY_GROUP_ID: process.env.DAILY_GROUP_ID,
            MONTHLY_GROUP_ID: process.env.MONTHLY_GROUP_ID,
            YEARLY_GROUP_ID: process.env.YEARLY_GROUP_ID
        };
        
        const required = ['BOT_TOKEN', 'ADMIN_USER_ID'];
        const optional = ['NODE_ENV', 'PORT', 'DAILY_GROUP_ID', 'MONTHLY_GROUP_ID', 'YEARLY_GROUP_ID'];
        
        // Check required variables
        required.forEach(varName => {
            if (envVars[varName]) {
                this.logTest(
                    `Required Var: ${varName}`,
                    'passed',
                    `${varName} is set`
                );
            } else {
                this.logTest(
                    `Required Var: ${varName}`,
                    'failed',
                    `${varName} is missing`
                );
            }
        });
        
        // Check optional variables
        optional.forEach(varName => {
            if (envVars[varName]) {
                this.logTest(
                    `Optional Var: ${varName}`,
                    'passed',
                    `${varName} is set (${envVars[varName]})`
                );
            } else {
                this.logTest(
                    `Optional Var: ${varName}`,
                    'warning',
                    `${varName} is not set (optional)`
                );
            }
        });
        
        return envVars;
    }

    testFileSystem() {
        console.log('\n📁 Testing File System...');
        
        const requiredFiles = [
            'bot-production.js',
            'package.json',
            'railway.toml'
        ];
        
        const dataFiles = [
            'data/pendingUsers.json',
            'data/usedCodes.json',
            'data/activeSubscriptions.json',
            'data/userHistory.json'
        ];
        
        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                this.logTest(
                    `File: ${file}`,
                    'passed',
                    'File exists'
                );
            } else {
                this.logTest(
                    `File: ${file}`,
                    'failed',
                    'File missing'
                );
            }
        });
        
        dataFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                this.logTest(
                    `Data File: ${file}`,
                    'passed',
                    `File exists (${stats.size} bytes)`
                );
            } else {
                this.logTest(
                    `Data File: ${file}`,
                    'warning',
                    'File missing (will be created on first run)'
                );
            }
        });
    }

    async testRailwayDeployment() {
        console.log('\n🚂 Testing Railway Deployment...');
        
        return new Promise((resolve) => {
            // This would require Railway CLI to be installed
            const { exec } = require('child_process');
            
            exec('railway --version', (error, stdout, stderr) => {
                if (error) {
                    this.logTest(
                        'Railway CLI',
                        'warning',
                        'Railway CLI not installed',
                        { installCommand: 'npm install -g @railway/cli' }
                    );
                    resolve(false);
                    return;
                }
                
                this.logTest(
                    'Railway CLI',
                    'passed',
                    'Railway CLI available',
                    { version: stdout.trim() }
                );
                
                // Check if logged in
                exec('railway whoami', (error, stdout, stderr) => {
                    if (error) {
                        this.logTest(
                            'Railway Login',
                            'failed',
                            'Not logged into Railway',
                            { loginCommand: 'railway login' }
                        );
                        resolve(false);
                    } else {
                        this.logTest(
                            'Railway Login',
                            'passed',
                            `Logged in as: ${stdout.trim()}`
                        );
                        resolve(true);
                    }
                });
            });
        });
    }

    async testWebEndpoints() {
        console.log('\n🌐 Testing Web Endpoints...');
        
        // Check if we can reach common health endpoints
        const endpoints = [
            'http://localhost:3000/health',
            'https://api.telegram.org'
        ];
        
        for (const endpoint of endpoints) {
            try {
                await this.testEndpoint(endpoint);
            } catch (error) {
                // Endpoint test handled in testEndpoint method
            }
        }
    }

    testEndpoint(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const startTime = Date.now();
            
            const req = client.get(url, { timeout: 5000 }, (res) => {
                const responseTime = Date.now() - startTime;
                
                this.logTest(
                    `Endpoint: ${url}`,
                    'passed',
                    `Reachable (${responseTime}ms, status: ${res.statusCode})`,
                    { statusCode: res.statusCode, responseTime }
                );
                
                resolve();
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                
                this.logTest(
                    `Endpoint: ${url}`,
                    'warning',
                    `Not reachable: ${error.message}`,
                    { error: error.message, responseTime }
                );
                
                reject(error);
            });
            
            req.on('timeout', () => {
                const responseTime = Date.now() - startTime;
                
                this.logTest(
                    `Endpoint: ${url}`,
                    'warning',
                    `Timeout after ${responseTime}ms`,
                    { responseTime }
                );
                
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    testBotCommands(bot) {
        console.log('\n🤖 Testing Bot Command Handlers...');
        
        if (!bot) {
            this.logTest(
                'Bot Commands',
                'failed',
                'Cannot test commands - bot not available'
            );
            return;
        }
        
        // Check if bot-production.js has command handlers
        try {
            const botFile = fs.readFileSync('bot-production.js', 'utf8');
            const commands = ['/start', '/help', '/status', '/getchatid', '/checkbotadmin'];
            
            commands.forEach(command => {
                if (botFile.includes(command)) {
                    this.logTest(
                        `Command Handler: ${command}`,
                        'passed',
                        'Handler found in bot file'
                    );
                } else {
                    this.logTest(
                        `Command Handler: ${command}`,
                        'warning',
                        'Handler not found in bot file'
                    );
                }
            });
        } catch (error) {
            this.logTest(
                'Bot Commands',
                'failed',
                `Cannot read bot file: ${error.message}`
            );
        }
    }

    testDataIntegrity() {
        console.log('\n📊 Testing Data Integrity...');
        
        try {
            // Load data files and check for basic integrity
            const dataDir = 'data';
            if (!fs.existsSync(dataDir)) {
                this.logTest(
                    'Data Directory',
                    'warning',
                    'Data directory does not exist (will be created)'
                );
                return;
            }
            
            const dataFiles = ['pendingUsers.json', 'usedCodes.json', 'activeSubscriptions.json', 'userHistory.json'];
            
            dataFiles.forEach(file => {
                const filePath = path.join(dataDir, file);
                if (fs.existsSync(filePath)) {
                    try {
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        this.logTest(
                            `Data File: ${file}`,
                            'passed',
                            `Valid JSON (${Object.keys(content).length} entries)`,
                            { entries: Object.keys(content).length }
                        );
                    } catch (parseError) {
                        this.logTest(
                            `Data File: ${file}`,
                            'failed',
                            `Invalid JSON: ${parseError.message}`
                        );
                    }
                } else {
                    this.logTest(
                        `Data File: ${file}`,
                        'warning',
                        'File does not exist (will be created)'
                    );
                }
            });
        } catch (error) {
            this.logTest(
                'Data Integrity',
                'failed',
                `Cannot test data integrity: ${error.message}`
            );
        }
    }

    generateReport() {
        console.log('\n📋 Generating Diagnostic Report...');
        
        const report = {
            ...this.results,
            recommendations: this.generateRecommendations(),
            nextSteps: this.generateNextSteps()
        };
        
        // Save report to file
        const reportFile = `bot-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`📄 Report saved to: ${reportFile}`);
        
        // Print summary
        console.log('\n📊 DIAGNOSTIC SUMMARY');
        console.log('====================');
        console.log(`Total Tests: ${this.results.summary.total}`);
        console.log(`✅ Passed: ${this.results.summary.passed}`);
        console.log(`❌ Failed: ${this.results.summary.failed}`);
        console.log(`⚠️ Warnings: ${this.results.summary.warnings}`);
        
        const successRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.summary.failed > 0) {
            recommendations.push('🔧 Fix failed tests before deploying to production');
        }
        
        if (this.results.summary.warnings > 0) {
            recommendations.push('⚠️ Address warnings to ensure optimal performance');
        }
        
        // Check for specific issues
        const failedTests = this.results.tests.filter(t => t.status === 'failed');
        const botTokenTest = failedTests.find(t => t.name.includes('Bot Token'));
        
        if (botTokenTest) {
            recommendations.push('🔐 Get a new bot token from @BotFather if token is invalid');
        }
        
        const envTest = failedTests.find(t => t.name.includes('Required Var'));
        if (envTest) {
            recommendations.push('🌍 Set missing environment variables in Railway dashboard');
        }
        
        return recommendations;
    }

    generateNextSteps() {
        const steps = [];
        
        if (this.results.summary.failed === 0) {
            steps.push('🚀 Ready to deploy! Run: ./railway-deploy.sh');
            steps.push('🤖 Test bot on Telegram with: @dhronepredictionsbot /start');
        } else {
            steps.push('🛠️ Fix failed tests before proceeding with deployment');
            steps.push('📚 Check diagnostic report for detailed error information');
        }
        
        steps.push('🔍 Monitor Railway logs after deployment');
        steps.push('📊 Check bot health at: https://your-domain.railway.app/health');
        
        return steps;
    }

    async runFullDiagnostics() {
        console.log('🔍 Starting Comprehensive Bot Diagnostics...');
        console.log('=============================================');
        
        // Test 1: Environment Variables
        this.testEnvironmentVariables();
        
        // Test 2: File System
        this.testFileSystem();
        
        // Test 3: Bot Token
        const botTest = await this.testBotTokenValidity();
        
        // Test 4: Admin User Access
        await this.testAdminUserAccess(botTest.bot);
        
        // Test 5: Bot Commands
        this.testBotCommands(botTest.bot);
        
        // Test 6: Data Integrity
        this.testDataIntegrity();
        
        // Test 7: Railway Deployment
        await this.testRailwayDeployment();
        
        // Test 8: Web Endpoints
        await this.testWebEndpoints();
        
        // Generate Report
        const report = this.generateReport();
        
        console.log('\n🎯 RECOMMENDATIONS');
        console.log('==================');
        report.recommendations.forEach(rec => console.log(rec));
        
        console.log('\n🚀 NEXT STEPS');
        console.log('=============');
        report.nextSteps.forEach(step => console.log(step));
        
        return report;
    }
}

// Run diagnostics if called directly
if (require.main === module) {
    const diagnostics = new BotDiagnostics();
    diagnostics.runFullDiagnostics().catch(error => {
        console.error('💀 Diagnostic tool failed:', error);
        process.exit(1);
    });
}

module.exports = BotDiagnostics;