const { execSync } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Function to connect to database
async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/apartment_management';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Function to run a script and log its execution
function runScript(scriptPath) {
    console.log(`\n=== Running ${scriptPath} ===\n`);
    try {
        execSync(`node ${path.join(__dirname, scriptPath)}`, { 
            stdio: 'inherit',
            env: { 
                ...process.env, 
                MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
                MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI
            }
        });
        console.log(`\n=== Successfully completed ${scriptPath} ===\n`);
    } catch (error) {
        console.error(`\nError running ${scriptPath}:`, error.message);
        process.exit(1);
    }
}

// Main setup function
async function setupAll() {
    console.log('Starting complete setup process...\n');

    // Connect to database first
    await connectDB();

    // Run scripts in the correct order
    runScript('setup/clearDatabase.js');
    runScript('setup/setupDatabase.js');
    runScript('seed/seedFacilities.js');
    runScript('seed/setHouseholdHeads.js');
    runScript('seed/addAreaBasedFees.js');
    runScript('seed/addAreaBasedPayments.js');
    runScript('seed/addMoreAreaPayments.js');
    runScript('seed/addTempStatusToResidents.js');
    runScript('maintenance/paymentStats.js');
    runScript('seed/createHygieneFee.js');
    runScript('maintenance/updateVoluntaryFeeStatus.js');

    console.log('\n=== All setup scripts completed successfully! ===\n');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
}

// Run the setup
setupAll().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
}); 