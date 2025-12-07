#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`${step}. ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
  process.exit(1);
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Get version from package.json
function getVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    logError('Failed to read package.json version');
  }
}

// Clean and create release directory
function setupReleaseDir(releaseDir) {
  if (fs.existsSync(releaseDir)) {
    fs.rmSync(releaseDir, { recursive: true, force: true });
    log(`Cleaned existing ${releaseDir}`, 'yellow');
  }
  fs.mkdirSync(releaseDir, { recursive: true });
  logSuccess(`Created ${releaseDir}`);
}

// Copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    logError(`Source directory ${src} does not exist`);
  }
  
  fs.mkdirSync(dest, { recursive: true });
  
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Create ZIP file using built-in methods
function createZip(sourceDir, outputPath) {
  try {
    // Use system zip command
    execSync(`cd "${path.dirname(sourceDir)}" && zip -r "${outputPath}" "${path.basename(sourceDir)}"`, { stdio: 'inherit' });
    logSuccess(`Created ZIP: ${outputPath}`);
  } catch (error) {
    // Fallback: try different zip methods
    try {
      execSync(`zip -r "${outputPath}" "${sourceDir}"`, { stdio: 'inherit' });
      logSuccess(`Created ZIP: ${outputPath}`);
    } catch (fallbackError) {
      logError(`Failed to create ZIP file. Please install zip utility or create manually.`);
    }
  }
}

// Main build function
function buildRelease() {
  log(`${colors.bold}🚀 Building Digitalee Tab Manager Release${colors.reset}`);
  log('');

  const version = getVersion();
  const releaseDir = 'release';
  const extensionDir = path.join(releaseDir, 'digitalee-tab-manager');
  const zipName = `digitalee-tab-manager-v${version}.zip`;
  const zipPath = path.join(releaseDir, zipName);

  // Step 1: Build the extension
  logStep(1, 'Building extension...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Extension built successfully');
  } catch (error) {
    logError('Failed to build extension. Make sure to run "npm install" first.');
  }

  // Step 2: Check if dist directory exists
  if (!fs.existsSync('dist')) {
    logError('dist/ directory not found. Build may have failed.');
  }

  // Step 3: Setup release directory
  logStep(2, 'Setting up release directory...');
  setupReleaseDir(releaseDir);

  // Step 4: Copy built extension files
  logStep(3, 'Copying extension files...');
  copyDir('dist', extensionDir);
  logSuccess('Extension files copied');

  // Step 5: Copy documentation files
  logStep(4, 'Copying documentation files...');
  const docsToInclude = [
    'INSTALL.md',
    'QUICK_START.md', 
    'TROUBLESHOOTING.md',
    'README.md'
  ];

  for (const doc of docsToInclude) {
    if (fs.existsSync(doc)) {
      fs.copyFileSync(doc, path.join(releaseDir, doc));
      log(`  ✅ Copied ${doc}`);
    } else {
      logWarning(`${doc} not found, skipping...`);
    }
  }

  // Step 6: Create ZIP file
  logStep(5, 'Creating ZIP package...');
  createZip(releaseDir, zipPath);

  // Final success message
  log('');
  log(`${colors.bold}${colors.green}🎉 Release package created successfully!${colors.reset}`);
  log('');
  log(`📦 Package: ${zipName}`);
  log(`📍 Location: ${path.resolve(zipPath)}`);
  log(`📄 Version: ${version}`);
  log('');
  log('👥 Share this ZIP file with users for installation.');
  log('📖 Users should follow the instructions in INSTALL.md');
  log('');
}

// Run the build
if (require.main === module) {
  buildRelease();
}

module.exports = { buildRelease };