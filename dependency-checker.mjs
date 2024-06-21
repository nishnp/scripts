#!/usr/bin/env zx

import 'zx/globals';
import { exec } from 'child_process';
import { readFile } from 'fs/promises';

async function readRegistryFromNpmrc() {
    try {
        // Read .npmrc file
        const npmrcPath = './.npmrc'; // Replace with your actual path
        const data = await readFile(npmrcPath, 'utf8');

        // Parse the content
        const lines = data.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('registry=')) {
                const registryUrl = line.substring('registry='.length);
                return registryUrl;
            }
        }

        // If registry URL is not found
        throw new Error('Registry URL not found in .npmrc');
    } catch (error) {
        console.error('Error reading .npmrc:', error);
    }
}
// Function to parse dependencies
const parseDependencies = (json, parent = '') => {
    const result = [];
    const dependencies = json.dependencies || {};

    for (const [name, value] of Object.entries(dependencies)) {
        const version = value.version;
        const current = parent ? `${parent}#${name}@${version}` : `${name}@${version}`;

        if (value.dependencies) {
            const subResult = parseDependencies({ dependencies: value.dependencies }, current);
            result.push(...subResult);
        } else {
            result.push(current);
        }
    }

    return result;
};

// Function to execute npm list command
const npmList = (lockDir, packageToCheck) => {
    return new Promise((resolve, reject) => {
        exec(`npm --prefix ${lockDir} list -a ${packageToCheck} --json`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
};

// Main execution
const main = async () => {
    // Find all yarn.lock files excluding node_modules directory
    const yarnLockPaths = (await $`find . -type f -name "yarn.lock" -not -path "**/node_modules/*"`).stdout.trim().split('\n');
    // Find all package-lock.json files excluding node_modules directory
    const packageLockPaths = (await $`find . -type f -name "package-lock.json" -not -path "**/node_modules/*"`).stdout.trim().split('\n');
    const packageToCheck = process.argv[3];
    const version = process.argv[4];
    const registry = process.arv[5] || await readRegistryFromNpmrc();
    const erroneousValues = [];

    const completeArray = packageLockPaths.length > 0 && packageLockPaths[0] !== '' && yarnLockPaths.length > 0 && yarnLockPaths[0] !== ''
        ? [...packageLockPaths, ...yarnLockPaths]
        : packageLockPaths.length > 0 && packageLockPaths[0] !== ''
        ? packageLockPaths
        : yarnLockPaths.length > 0 && yarnLockPaths[0] !== ''
        ? yarnLockPaths
        : [];

    for (const lock of completeArray) {
        let lockDir;
        if (lock.endsWith('yarn.lock')) {
            lockDir = lock.split('/yarn.lock')[0];
            console.log(await $`cd ${lockDir} && yarn install --silent --registry=${registry} --frozen-lockfile`);
        } else {
            lockDir = lock.split('/package-lock.json')[0];
            console.log(await $`cd ${lockDir} && npm install --silent --registry=${registry} --frozen-lockfile`);
        }

        console.log(`Installed packages at path ${lock}`);

        try {
            const npmListOutput = await npmList(lockDir, packageToCheck);
            const data = JSON.parse(npmListOutput);
            const dependenciesArray = parseDependencies(data);
            console.log(`Got dependency tree successfully for ${lock}`);

            dependenciesArray.forEach((f) => {
                const packageName = f.split(packageToCheck)[1].split('@')[1];
                if (packageName.localeCompare(version, undefined, { numeric: true, sensitivity: 'base' }) === -1) {
                    erroneousValues.push({ path: lock, package: f });
                }
            });
        } catch (error) {
            console.error(`Error while processing npm list for ${lock}:`, error);
        }
    }

    console.log('-------------------------------------- Lower Dependencies ---------------------------------');
    console.table(erroneousValues);
};

main();
