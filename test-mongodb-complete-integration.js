#!/usr/bin/env node

/**
 * MongoDB Integration Test Script
 * Tests all components of the MongoDB integration system
 */

const http = require('http');
const https = require('https');
const { MongoClient } = require('mongodb');

// Configuration
const config = {
    mongodbUrl: 'mongodb://mongo:wYzKHjSeLJOZJywivAbLzFXcjexLusLV@mongodb.railway.internal:27017',
    apiBase: 'https://dhronepredictions-production.up.railway.app/api', // Production API URL
    testUser: {
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullname: 'Test User',
        phone: '+1234567890'
    }
};

// Test results
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(testName, success, message = '') {
    const result = {
        name: testName,
        success,
        message,
        timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    
    if (success) {
        testResults.passed++;
        console.log(`✅ ${testName}: ${message}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: ${message}`);
    }
}

// Test MongoDB Connection
async function testMongoDBConnection() {
    try {
        const client = new MongoClient(config.mongodbUrl);
        await client.connect();
        await client.db().admin().ping();
        await client.close();
        logTest('MongoDB Connection', true, 'Successfully connected to MongoDB');
        return true;
    } catch (error) {
        logTest('MongoDB Connection', false, `Failed to connect: ${error.message}`);
        return false;
    }
}

// Test API Health Endpoint
async function testAPIHealth() {
    try {
        const response = await makeRequest(`${config.apiBase}/health`);
        if (response.statusCode === 200) {
            logTest('API Health Check', true, 'API server is running');
            return true;
        } else {
            logTest('API Health Check', false, `HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logTest('API Health Check', false, `Connection failed: ${error.message}`);
        return false;
    }
}

// Test User Registration
async function testUserRegistration() {
    try {
        const registrationData = {
            email: config.testUser.email,
            password: config.testUser.password,
            fullname: config.testUser.fullname,
            phone: config.testUser.phone
        };

        const response = await makeRequest(`${config.apiBase}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });

        const data = JSON.parse(response.body);

        if (response.statusCode === 201) {
            logTest('User Registration', true, 'User registered successfully');
            return data.token;
        } else {
            logTest('User Registration', false, `Registration failed: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        logTest('User Registration', false, `Request failed: ${error.message}`);
        return null;
    }
}

// Test User Login
async function testUserLogin() {
    try {
        const loginData = {
            email: config.testUser.email,
            password: config.testUser.password
        };

        const response = await makeRequest(`${config.apiBase}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const data = JSON.parse(response.body);

        if (response.statusCode === 200 && data.token) {
            logTest('User Login', true, 'Login successful');
            return data.token;
        } else {
            logTest('User Login', false, `Login failed: ${data.error || 'Unknown error'}`);
            return null;
        }
    } catch (error) {
        logTest('User Login', false, `Request failed: ${error.message}`);
        return null;
    }
}

// Test Protected Endpoint
async function testProtectedEndpoint(token) {
    try {
        const response = await makeRequest(`${config.apiBase}/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.statusCode === 200) {
            logTest('Protected Endpoint (Profile)', true, 'Profile data retrieved successfully');
            return true;
        } else {
            logTest('Protected Endpoint (Profile)', false, `HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logTest('Protected Endpoint (Profile)', false, `Request failed: ${error.message}`);
        return false;
    }
}

// Test Subscription Endpoint
async function testSubscriptionEndpoint(token) {
    try {
        const response = await makeRequest(`${config.apiBase}/subscription`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.statusCode === 200) {
            logTest('Subscription Endpoint', true, 'Subscription data retrieved successfully');
            return true;
        } else {
            logTest('Subscription Endpoint', false, `HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logTest('Subscription Endpoint', false, `Request failed: ${error.message}`);
        return false;
    }
}

// Test Access Codes Endpoint
async function testAccessCodesEndpoint(token) {
    try {
        const response = await makeRequest(`${config.apiBase}/access-codes`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.statusCode === 200) {
            logTest('Access Codes Endpoint', true, 'Access codes retrieved successfully');
            return true;
        } else {
            logTest('Access Codes Endpoint', false, `HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logTest('Access Codes Endpoint', false, `Request failed: ${error.message}`);
        return false;
    }
}

// Test User Stats Endpoint
async function testUserStatsEndpoint(token) {
    try {
        const response = await makeRequest(`${config.apiBase}/user-stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.statusCode === 200) {
            logTest('User Stats Endpoint', true, 'User stats retrieved successfully');
            return true;
        } else {
            logTest('User Stats Endpoint', false, `HTTP ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logTest('User Stats Endpoint', false, `Request failed: ${error.message}`);
        return false;
    }
}

// Test Invalid Token
async function testInvalidToken() {
    try {
        const response = await makeRequest(`${config.apiBase}/profile`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer invalid-token' }
        });

        if (response.statusCode === 401) {
            logTest('Invalid Token Protection', true, 'Invalid token correctly rejected');
            return true;
        } else {
            logTest('Invalid Token Protection', false, `Expected 401, got ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logTest('Invalid Token Protection', false, `Request failed: ${error.message}`);
        return false;
    }
}

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = lib.request(requestOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

// Test Database Collections
async function testDatabaseCollections() {
    try {
        const client = new MongoClient(config.mongodbUrl);
        await client.connect();
        
        const db = client.db();
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        const expectedCollections = ['users', 'subscriptions', 'access_codes', 'website_users'];
        const missingCollections = expectedCollections.filter(name => !collectionNames.includes(name));
        
        if (missingCollections.length === 0) {
            logTest('Database Collections', true, 'All expected collections found');
        } else {
            logTest('Database Collections', false, `Missing collections: ${missingCollections.join(', ')}`);
        }
        
        await client.close();
        return missingCollections.length === 0;
    } catch (error) {
        logTest('Database Collections', false, `Error checking collections: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🧪 Starting MongoDB Integration Tests...\n');

    // Wait for API server to be ready
    console.log('⏳ Waiting for API server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run tests
    const dbConnected = await testMongoDBConnection();
    if (!dbConnected) {
        console.log('\n❌ MongoDB connection failed. Cannot continue with other tests.');
        printSummary();
        return;
    }

    await testDatabaseCollections();
    const apiHealthy = await testAPIHealth();
    if (!apiHealthy) {
        console.log('\n❌ API server is not responding. Cannot continue with API tests.');
        printSummary();
        return;
    }

    // Test user flow
    const registrationToken = await testUserRegistration();
    const loginToken = await testUserLogin();

    if (loginToken) {
        await testProtectedEndpoint(loginToken);
        await testSubscriptionEndpoint(loginToken);
        await testAccessCodesEndpoint(loginToken);
        await testUserStatsEndpoint(loginToken);
    }

    await testInvalidToken();

    printSummary();
}

// Print test summary
function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.tests
            .filter(test => !test.success)
            .forEach(test => {
                console.log(`  • ${test.name}: ${test.message}`);
            });
    }

    console.log('\n📋 Next Steps:');
    if (testResults.failed === 0) {
        console.log('  ✅ All tests passed! Your MongoDB integration is working correctly.');
        console.log('  🔄 Deploy to Railway and update API URLs in HTML files.');
    } else {
        console.log('  ⚠️  Some tests failed. Check the issues above and fix them before deploying.');
        console.log('  🔧 Make sure your API server is running and MongoDB is accessible.');
    }

    console.log('\n📖 For detailed setup instructions, see:');
    console.log('   MONGODB_COMPLETE_INTEGRATION_GUIDE.md');
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runTests,
    testMongoDBConnection,
    testAPIHealth,
    testUserRegistration,
    testUserLogin,
    testProtectedEndpoint
};