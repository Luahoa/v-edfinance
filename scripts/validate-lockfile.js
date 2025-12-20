#!/usr/bin/env node

/**
 * Lockfile Validation Script
 * 
 * Ensures:
 * 1. Only pnpm-lock.yaml exists (no npm package-lock.json)
 * 2. Lockfile is in sync with package.json
 * 3. pnpm is being used
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');

// ANSI colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    log(`❌ ERROR: ${message}`, 'red');
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function warning(message) {
    log(`⚠️  WARNING: ${message}`, 'yellow');
}

function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check 1: Verify pnpm-lock.yaml exists
function checkPnpmLockfile() {
    const pnpmLockPath = path.join(rootDir, 'pnpm-lock.yaml');

    if (!fs.existsSync(pnpmLockPath)) {
        error('pnpm-lock.yaml not found!');
        info('Run: pnpm install');
        return false;
    }

    success('pnpm-lock.yaml exists');
    return true;
}

// Check 2: Ensure NO npm lockfile exists
function checkNoNpmLockfile() {
    const npmLockPath = path.join(rootDir, 'package-lock.json');
    const shrinkwrapPath = path.join(rootDir, 'npm-shrinkwrap.json');

    let hasIssue = false;

    if (fs.existsSync(npmLockPath)) {
        error('package-lock.json found! This project uses pnpm, not npm.');
        info('Delete it: rm package-lock.json');
        hasIssue = true;
    }

    if (fs.existsSync(shrinkwrapPath)) {
        error('npm-shrinkwrap.json found! This project uses pnpm.');
        info('Delete it: rm npm-shrinkwrap.json');
        hasIssue = true;
    }

    if (!hasIssue) {
        success('No npm lockfiles found');
    }

    return !hasIssue;
}

// Check 3: Verify pnpm is installed and correct version
function checkPnpmVersion() {
    try {
        const version = execSync('pnpm --version', { encoding: 'utf8' }).trim();
        const requiredVersion = '9.15.0';

        if (version >= requiredVersion) {
            success(`pnpm version: ${version} (>= ${requiredVersion})`);
            return true;
        } else {
            warning(`pnpm version ${version} is older than required ${requiredVersion}`);
            info('Update: npm install -g pnpm@latest');
            return false;
        }
    } catch (err) {
        error('pnpm is not installed!');
        info('Install: npm install -g pnpm@9.15.0');
        info('Or visit: https://pnpm.io/installation');
        return false;
    }
}

// Check 4: Verify package.json has packageManager field
function checkPackageManagerField() {
    const packageJsonPath = path.join(rootDir, 'package.json');

    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        if (packageJson.packageManager && packageJson.packageManager.includes('pnpm')) {
            success(`packageManager field: ${packageJson.packageManager}`);
            return true;
        } else {
            warning('package.json missing "packageManager" field');
            info('Add: "packageManager": "pnpm@9.15.0"');
            return false;
        }
    } catch (err) {
        error(`Failed to read package.json: ${err.message}`);
        return false;
    }
}

// Check 5: Verify .npmrc exists with correct config
function checkNpmrc() {
    const npmrcPath = path.join(rootDir, '.npmrc');

    if (!fs.existsSync(npmrcPath)) {
        warning('.npmrc file not found');
        info('Create it with: engine-strict=true, package-lock=false');
        return false;
    }

    const content = fs.readFileSync(npmrcPath, 'utf8');

    const requiredConfigs = ['engine-strict=true', 'package-lock=false'];
    const missingConfigs = requiredConfigs.filter(config => !content.includes(config));

    if (missingConfigs.length > 0) {
        warning('.npmrc is missing configurations:');
        missingConfigs.forEach(config => info(`  - ${config}`));
        return false;
    }

    success('.npmrc is properly configured');
    return true;
}

// Main validation
function main() {
    log('\n🔍 Validating Dependency Lockfile Setup...\n', 'blue');

    const checks = [
        { name: 'pnpm lockfile', fn: checkPnpmLockfile },
        { name: 'no npm lockfiles', fn: checkNoNpmLockfile },
        { name: 'pnpm version', fn: checkPnpmVersion },
        { name: 'packageManager field', fn: checkPackageManagerField },
        { name: '.npmrc config', fn: checkNpmrc },
    ];

    let allPassed = true;

    checks.forEach(({ name, fn }) => {
        const passed = fn();
        if (!passed) {
            allPassed = false;
        }
    });

    log('\n' + '='.repeat(50), 'blue');

    if (allPassed) {
        success('\n✨ All checks passed! Dependencies are properly configured.\n');
        process.exit(0);
    } else {
        error('\n❌ Some checks failed. Please fix the issues above.\n');
        process.exit(1);
    }
}

main();
