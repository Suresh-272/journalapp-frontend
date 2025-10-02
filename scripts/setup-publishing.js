#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 MyJournal App Publishing Setup\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupPublishing() {
  try {
    console.log('Please provide the following information for your app:\n');

    const expoUsername = await askQuestion('Your Expo username: ');
    const bundleIdentifier = await askQuestion('Bundle identifier (e.g., com.yourcompany.myjournal): ');
    const authorName = await askQuestion('Your name/company name: ');
    const appDescription = await askQuestion('App description (brief): ');

    // Read current app.json
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    // Update app.json
    appJson.expo.owner = expoUsername;
    appJson.expo.ios.bundleIdentifier = bundleIdentifier;
    appJson.expo.android.package = bundleIdentifier;
    appJson.expo.author = authorName;
    appJson.expo.description = appDescription;

    // Write updated app.json
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

    console.log('\n✅ App configuration updated successfully!');
    console.log('\nNext steps:');
    console.log('1. Create required assets (see STORE_ASSETS_GUIDE.md)');
    console.log('2. Set up Apple Developer Account ($99/year)');
    console.log('3. Set up Google Play Console Account ($25 one-time)');
    console.log('4. Install EAS CLI: npm install -g @expo/eas-cli');
    console.log('5. Login to EAS: eas login');
    console.log('6. Configure EAS build: eas build:configure');
    console.log('7. Follow the PUBLISHING_GUIDE.md for detailed steps');

    console.log('\n📋 Checklist:');
    console.log('□ Create app icons (1024x1024px)');
    console.log('□ Create screenshots for all required sizes');
    console.log('□ Write privacy policy');
    console.log('□ Write terms of service');
    console.log('□ Create app description and keywords');
    console.log('□ Test app thoroughly on physical devices');
    console.log('□ Set up Apple Developer Account');
    console.log('□ Set up Google Play Console Account');
    console.log('□ Configure EAS build');
    console.log('□ Build production versions');
    console.log('□ Submit to app stores');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

setupPublishing();
