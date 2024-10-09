# create-rmv-project

A CLI tool to quickly set up a Kirby CMS project with Tailwind CSS, Typography plugin, jQuery, and Fancybox, just the way I like it.

## About

As a web developer who frequently works with Kirby CMS, Tailwind CSS, jQuery, and Fancybox, I (Ruby Morgan Voigt, RMV, you get it) created this tool to streamline my project setup process. This CLI tool automates the initial configuration, allowing you to jump straight into development with your preferred tech stack.

## Features

- Sets up a Kirby CMS project using the Plainkit
- Configures Tailwind CSS with the Typography plugin
- Includes jQuery for DOM manipulation
- Integrates Fancybox for lightweight and responsive lightboxes
- Initializes a Git repository for version control

## Installation

Install the CLI tool globally using npm:

```bash
npm install -g create-rmv-project
```

## Usage

To create a new project, run:

```bash
create-rmv-project
```

By default, this will create a new project in a directory named `my-rmv-project`.

### Options

- `-n, --name <name>`: Specify a custom project name

Example:

```bash
create-rmv-project -n my-awesome-website
```

This will create a new project in a directory named `my-awesome-website`.

## Post-Installation

After running the command, your project will be set up and ready to go. Here are some next steps:

1. Navigate to your project directory:
   ```bash
   cd your-project-name
   ```

2. Start the Tailwind CSS build process:
   ```bash
   npm run build
   ```

3. For development with live reloading of Tailwind CSS:
   ```bash
   npm run watch
   ```

4. Remember to include the generated CSS and JS files in your Kirby template:
   ```php
   <?= css('assets/css/tailwind.css') ?>
   <?= js('assets/js/main.js') ?>
   ```

5. To use the Typography plugin, add the "prose" class to your content container.

6. To use Fancybox, add the "data-fancybox" attribute to your lightbox elements:
   ```html
   <a href="large-image.jpg" data-fancybox>
     <img src="thumbnail.jpg" alt="Thumbnail">
   </a>
   ```

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/rmvdesign/create-rmv-project/issues).

## License

This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

## Author

**Ruby Morgan Voigt**

- Website: [rmv.fyi](https://rmv.fyi)
- Threads: [@1612elphi](https://threads.net/1612elphi)
- Github: [@rmvdesign](https://github.com/rmvdesign)
