#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import simpleGit from 'simple-git';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .version('1.0.1') // Updated version slightly
  .description('Set up a Kirby CMS project with Tailwind CSS v4, Typography plugin, jQuery, and Fancybox, like Ruby likes it.')
  .option('-n, --name <name>', 'Project name', 'my-rmv-project')
  .parse(process.argv);

const options = program.opts();

async function npmInstall(packages, isDev = false) {
  const args = ['install', ...packages];
  if (isDev) args.push('--save-dev');
  console.log(chalk.blue(`Running: npm ${args.join(' ')}`)); // Log command
  // Run with stdio inherited to show npm output directly
  return execa('npm', args, { stdio: 'inherit' });
}

async function runNpx(command, args) {
  console.log(chalk.blue(`Running: npx ${command} ${args.join(' ')}`)); // Log command
  return execa('npx', [command, ...args], { stdio: 'inherit' });
}


async function setupProject() {
  const projectDir = path.join(process.cwd(), options.name);
  const art = `
   _____             __        ___  __  ____   __  _____ __
  / ___/______ ___ _/ /____   / _ \\/  |/  / | / / / __(_) /____
 / /__/ __/ -_) _ \`/ __/ -_) / , _/ /|_/ /| |/ / _\\ \\/ / __/ -_)
 \\___/_/  \\__/\\_,_/\\__/\\__/ /_/|_/_/  /_/ |___/ /___/_/\\__/\\__/
`;

  console.log(chalk.cyan(art));
  console.log(chalk.cyan(`Setting up Kirby project: ${options.name} in ${projectDir}`));

  // Clone Kirby Plainkit
  console.log(chalk.blue('Cloning Kirby Plainkit...'));
  await simpleGit().clone('https://github.com/getkirby/plainkit.git', projectDir);
  console.log(chalk.green('Kirby Plainkit cloned.'));

  // Remove .git directory
  console.log(chalk.blue('Removing Plainkit .git directory...'));
  await fs.remove(path.join(projectDir, '.git'));
  console.log(chalk.green('.git directory removed.'));

  // Initialize new git repository
  console.log(chalk.blue('Initializing new git repository...'));
  const git = simpleGit(projectDir);
  await git.init();
  console.log(chalk.green('New git repository initialized.'));

  // Set up Tailwind CSS and dependencies
  console.log(chalk.cyan('Setting up Tailwind CSS v4 and dependencies...'));

  // Create package.json if it doesn't exist
  const packageJsonPath = path.join(projectDir, 'package.json');
  if (!await fs.pathExists(packageJsonPath)) {
    console.log(chalk.blue('Creating package.json...'));
    await fs.writeJson(packageJsonPath, {
      name: options.name,
      version: '1.0.0',
      private: true,
      // type: "module" // Keep default CJS for wider compatibility unless specifically needed
    }, { spaces: 2 });
    console.log(chalk.green('package.json created.'));
  }

  // Change directory before running npm/npx
  const originalCwd = process.cwd();
  process.chdir(projectDir);
  console.log(chalk.blue(`Changed directory to: ${projectDir}`));

  try {
    // Install dependencies
    console.log(chalk.blue('Installing npm dependencies...'));
    await npmInstall([
      'tailwindcss@latest',     // Tailwind core
      '@tailwindcss/cli@latest', // Tailwind CLI (v4 requirement)
      '@tailwindcss/typography', // Typography plugin
      'jquery',                 // jQuery
      '@fancyapps/ui'           // Fancybox
    ], true); // Install as dev dependencies
    console.log(chalk.green('npm dependencies installed.'));

    // Initialize Tailwind CSS using the CLI
    console.log(chalk.blue('Initializing Tailwind CSS configuration...'));
    await runNpx('@tailwindcss/cli', ['init']);
    console.log(chalk.green('Tailwind CSS initialized (tailwind.config.js created).'));

    // Create Tailwind CSS input file
    const tailwindCssContent = `
@import "tailwindcss";

/* Fancybox styles */
@import "@fancyapps/ui/dist/fancybox/fancybox.css";
`;

    // Ensure the assets/css directory exists
    const cssDirPath = path.join(projectDir, 'assets', 'css');
    console.log(chalk.blue(`Ensuring directory exists: ${cssDirPath}`));
    await fs.ensureDir(cssDirPath);

    // Write the Tailwind CSS input file
    const inputCssPath = path.join(cssDirPath, 'processing.css');
    console.log(chalk.blue(`Creating Tailwind input CSS file: ${inputCssPath}`));
    await fs.writeFile(inputCssPath, tailwindCssContent.trim());
    console.log(chalk.green('Tailwind input CSS file created.'));


    // Update tailwind.config.js
    const tailwindConfigPath = path.join(projectDir, 'tailwind.config.js');
    console.log(chalk.blue(`Updating Tailwind config: ${tailwindConfigPath}`));
    if (await fs.pathExists(tailwindConfigPath)) {
        let tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');

        // Add content paths (targeting the default empty array)
        tailwindConfig = tailwindConfig.replace(
            /content:\s*\[\s*\]/g, // Regex to find content: []
            `content: [
    './site/**/*.php',
    './site/**/*.js',
    './content/**/*.txt'
  ]`
        );

        // Add typography plugin (targeting the default empty array)
        tailwindConfig = tailwindConfig.replace(
            /plugins:\s*\[\s*\]/g, // Regex to find plugins: []
            `plugins: [
    require('@tailwindcss/typography'),
  ]`
        );

        await fs.writeFile(tailwindConfigPath, tailwindConfig);
        console.log(chalk.green('Tailwind config updated with content paths and typography plugin.'));
    } else {
        console.log(chalk.yellow('Warning: tailwind.config.js not found after init. Skipping update.'));
    }


    // Add build/watch scripts to package.json
    console.log(chalk.blue('Updating package.json scripts...'));
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.scripts = {
      ...packageJson.scripts,
      // Use @tailwindcss/cli for build and watch
      "build": "npx @tailwindcss/cli -i ./assets/css/processing.css -o ./assets/css/tailwind.css --minify",
      "watch": "npx @tailwindcss/cli -i ./assets/css/processing.css -o ./assets/css/tailwind.css --watch"
    };
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    console.log(chalk.green('package.json scripts updated.'));

    // Create a JavaScript file to initialize jQuery and Fancybox
    const jsContent = `
import jQuery from 'jquery';
import { Fancybox } from "@fancyapps/ui";

window.$ = window.jQuery = jQuery;

// Initialize Fancybox
Fancybox.bind("[data-fancybox]", {
  // Your custom options here
});

console.log('jQuery and Fancybox initialized.');

// Your custom JavaScript code here
`;

    const jsDirPath = path.join(projectDir, 'assets', 'js');
    console.log(chalk.blue(`Ensuring directory exists: ${jsDirPath}`));
    await fs.ensureDir(jsDirPath);
    const mainJsPath = path.join(jsDirPath, 'main.js');
    console.log(chalk.blue(`Creating main JS file: ${mainJsPath}`));
    await fs.writeFile(mainJsPath, jsContent.trim());
    console.log(chalk.green('Main JS file created.'));


    // Initial build
    console.log(chalk.blue('Running initial Tailwind build...'));
    await runNpx('npm', ['run', 'build']);
    console.log(chalk.green('Initial Tailwind build complete.'));

    // Commit changes
    console.log(chalk.blue('Committing changes to git...'));
    await git.add('.');
    await git.commit('Initial setup with Kirby, Tailwind CSS v4, jQuery, and Fancybox');
    await git.branch(['-M', 'main']);
    console.log(chalk.green('Changes committed to main branch.'));

    console.log(chalk.green.bold(`
---------------------------------------------------------
 Project setup complete! Ruby is very proud of you.
---------------------------------------------------------

 Your Kirby project '${options.name}' with Tailwind CSS v4,
 Typography plugin, jQuery, and Fancybox is ready in:
 ${projectDir}

 Available npm scripts:
   - npm run build: Compile and minify CSS for production.
   - npm run watch: Watch for changes and recompile CSS automatically.

 Remember to include the generated CSS and your JS file
 in your Kirby templates (e.g., in a snippet):

 PHP Snippet:
   <?= css('assets/css/tailwind.css') ?>
   <?php /* Consider using a JS bundler like Vite or esbuild for production builds */ ?>
   <?= js('assets/js/main.js', ['type' => 'module']) ?>

 To use the Typography plugin, add the "prose" class to your content container.
 To use Fancybox, add the "data-fancybox" attribute to your lightbox elements (e.g., <a> tags).

 Next steps:
   1. cd ${options.name}
   2. npm run watch (to start developing)
   3. Configure Kirby (e.g., config.php, user accounts)
   4. Start building your awesome site!
    `));

  } catch (error) {
    console.error(chalk.red('An error occurred during setup:'), error);
    // Attempt to clean up the partially created directory
    console.log(chalk.yellow(`Attempting to clean up ${projectDir}...`));
    process.chdir(originalCwd); // Change back to original dir before removing
    await fs.remove(projectDir);
    console.log(chalk.yellow(`Directory ${projectDir} removed.`));
    process.exit(1);
  } finally {
    // Ensure we change back to the original directory even if there's an error
    if (process.cwd() !== originalCwd) {
        process.chdir(originalCwd);
        console.log(chalk.blue(`Changed directory back to: ${originalCwd}`));
    }
  }
}

setupProject();