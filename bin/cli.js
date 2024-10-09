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
  .version('1.0.0')
  .description('Set up a Kirby CMS project with Tailwind CSS, Typography plugin, jQuery, and Fancybox, like Ruby likes it.')
  .option('-n, --name <name>', 'Project name', 'my-rmv-project')
  .parse(process.argv);

const options = program.opts();

async function npmInstall(packages, isDev = false) {
  const args = ['install', ...packages];
  if (isDev) args.push('--save-dev');
  return execa('npm', args);
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
  console.log(chalk.cyan(`Setting up Kirby project: ${options.name}`));

  // Clone Kirby Plainkit
  await simpleGit().clone('https://github.com/getkirby/plainkit.git', projectDir);

  // Remove .git directory
  await fs.remove(path.join(projectDir, '.git'));

  // Initialize new git repository
  const git = simpleGit(projectDir);
  await git.init();

  // Set up Tailwind CSS and dependencies
  console.log(chalk.cyan('Setting up Tailwind CSS and dependencies...'));
  
  // Create package.json if it doesn't exist
  const packageJsonPath = path.join(projectDir, 'package.json');
  if (!await fs.pathExists(packageJsonPath)) {
    await fs.writeJson(packageJsonPath, {
      name: options.name,
      version: '1.0.0',
      private: true,
      type: "module"
    });
  }

  // Install dependencies
  process.chdir(projectDir);
  await npmInstall([
    'tailwindcss@latest',
    'postcss@latest',
    'autoprefixer@latest',
    '@tailwindcss/typography',
    'jquery',
    '@fancyapps/ui'
  ], true);

  // Initialize Tailwind CSS
  await execa('npx', ['tailwindcss', 'init', '-p']);

  // Create Tailwind CSS file
  const tailwindCssContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Fancybox styles */
@import "@fancyapps/ui/dist/fancybox/fancybox.css";
`;

  // Ensure the assets/css directory exists
  const cssDirPath = path.join(projectDir, 'assets', 'css');
  await fs.ensureDir(cssDirPath);

  // Write the Tailwind CSS file
  await fs.writeFile(path.join(cssDirPath, 'processing.css'), tailwindCssContent);

  // Update tailwind.config.js
  const tailwindConfigPath = path.join(projectDir, 'tailwind.config.js');
  let tailwindConfig = await fs.readFile(tailwindConfigPath, 'utf8');
  tailwindConfig = tailwindConfig.replace(
    'module.exports = {',
    `export default {`
  );
  tailwindConfig = tailwindConfig.replace(
    'content: [],',
    `content: [
    './site/**/*.php',
    './site/**/*.js',
    './content/**/*.txt'
  ],`
  );
  tailwindConfig = tailwindConfig.replace(
    'plugins: [],',
    `plugins: [
    require('@tailwindcss/typography'),
  ],`
  );
  await fs.writeFile(tailwindConfigPath, tailwindConfig);

  // Add build script to package.json
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts = {
    ...packageJson.scripts,
    build: 'tailwindcss -i ./assets/css/processing.css -o ./assets/css/tailwind.css --minify',
    watch: 'tailwindcss -i ./assets/css/processing.css -o ./assets/css/tailwind.css --watch'
  };
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  // Create a JavaScript file to initialize jQuery and Fancybox
  const jsContent = `
import jQuery from 'jquery';
import { Fancybox } from "@fancyapps/ui";

window.$ = window.jQuery = jQuery;

// Initialize Fancybox
Fancybox.bind("[data-fancybox]", {
  // Your custom options
});

// Your custom JavaScript code here
`;

  const jsDirPath = path.join(projectDir, 'assets', 'js');
  await fs.ensureDir(jsDirPath);
  await fs.writeFile(path.join(jsDirPath, 'main.js'), jsContent);

  // Initial build
  await execa('npm', ['run', 'build']);

  // Commit changes
  await git.add('.');
  await git.commit('Initial setup with Kirby, Tailwind CSS, jQuery, and Fancybox');
  await git.branch(['-M', 'main']);

  console.log(chalk.green(`
Project setup complete! Ruby is very proud of you.
Your Kirby project with Tailwind CSS, Typography plugin, jQuery, and Fancybox is ready.

build and watch commands are provided for your convenience. Build to build, watch to watch.

Remember to include the CSS and JS files in your Kirby template, preferably a snippet:
<?= css('assets/css/tailwind.css') ?>
<?= js('assets/js/main.js') ?>

To use the Typography plugin, add the "prose" class to your content container.
To use Fancybox, add the "data-fancybox" attribute to your lightbox elements.
  `));
}

setupProject().catch(err => {
  console.error(chalk.red('An error occurred:'), err);
  process.exit(1);
});
