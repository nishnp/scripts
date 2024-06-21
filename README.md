# scripts
necessary scripts


# Dependency Checker Script

This script checks dependencies across multiple `yarn.lock` and `package-lock.json` files, identifies dependencies with versions lower than specified, and logs the results.

## Prerequisites

- Node.js installed on your machine.
- `zx` (Zero-Dependency Cross-Platform Scripting) tool installed globally (`npm install -g zx`).

## Script Description

The script performs the following tasks:

1. **Parse Dependencies**: Recursively parses nested dependencies from JSON data.
2. **Execute npm List**: Executes `npm list` command to fetch the dependency tree for a specified package.
3. **Check Dependency Versions**: Compares the version of a specified package against a provided version and collects dependencies with versions lower than the specified.

## Steps to Run

```bash
git clone https://github.com/nishnp/scripts.git
cd scripts
npm install zx -g
```

Execute the script with the following command:

```bash
zx dependency-checker.mjs <package_name> <version>
```

example:
```bash
zx dependency-checker.mjs my-package 1.2.3
```

