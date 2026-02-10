# Contributing to WAR (Work Activity Report)

Thank you for your interest in contributing to WAR! This guide will help you understand how to make changes to the project, whether you're fixing a bug, adding a feature, or improving documentation.

## Table of Contents

- [Getting Started](#getting-started)
- [How to Edit Files on GitHub Directly](#how-to-edit-files-on-github-directly)
- [How to Commit Your Changes](#how-to-commit-your-changes)
- [Creating a Pull Request](#creating-a-pull-request)
- [Syncing Your Fork](#syncing-your-fork)
- [Local Development](#local-development)
- [Code Style Guidelines](#code-style-guidelines)

---

## Getting Started

There are two main ways to contribute to this project:

1. **Edit files directly on GitHub** (recommended for small changes like documentation)
2. **Clone the repository locally** (recommended for larger changes or feature development)

This guide covers both approaches.

---

## How to Edit Files on GitHub Directly

For small changes like fixing typos, updating documentation, or making minor code tweaks, you can edit files directly on GitHub's web interface:

### Step 1: Navigate to the File

1. Go to the [WAR repository](https://github.com/JasonC-M/WAR)
2. Browse to the file you want to edit (e.g., `README.md`, `script.js`, etc.)
3. Click on the file name to view its contents

### Step 2: Start Editing

1. Click the **pencil icon (✏️)** in the top-right corner of the file viewer
2. This will open the GitHub file editor
3. Make your changes directly in the editor
   - GitHub provides syntax highlighting for code files
   - You can use the "Preview" tab to see how Markdown files will render

### Step 3: Commit Your Changes

This is where many people get confused! Here's exactly what to do:

1. **Scroll down** to the bottom of the edit page
2. You'll see a section titled **"Commit changes"**
3. **Fill in the commit details:**
   - **Commit message** (required): Write a short, descriptive summary of your change
     - Good examples:
       - "Fix typo in README"
       - "Update date picker label"
       - "Add error handling for invalid JSON import"
   - **Extended description** (optional): Add more details if needed
     - Explain why the change was necessary
     - Reference any related issues (e.g., "Fixes #123")

4. **Choose how to commit:**
   
   **If you have write access to the repository:**
   - Select **"Commit directly to the `main` branch"** for minor fixes
   - Or select **"Create a new branch for this commit and start a pull request"** for larger changes
   
   **If you DON'T have write access (most contributors):**
   - GitHub will automatically create a fork of the repository in your account
   - Select **"Create a new branch for this commit and start a pull request"**
   - Suggested branch name format: `fix-typo-readme` or `update-import-feature`

5. **Click the green "Commit changes" button** (or "Propose changes" if you don't have write access)

**That's it!** Your changes are now committed. 

---

## Creating a Pull Request

If you committed to a new branch (which is the recommended approach for most changes):

1. After clicking "Commit changes," GitHub will automatically redirect you to the **"Open a pull request"** page
2. **Fill in the pull request details:**
   - **Title**: A clear, concise description of your change
   - **Description**: Explain what you changed and why
     - What problem does it solve?
     - How did you test it?
     - Are there any breaking changes?
3. Click **"Create pull request"**
4. The repository maintainers will be notified and will review your changes
5. Be prepared to make additional changes if requested during code review

### Pull Request Best Practices

- Keep pull requests focused on a single change or feature
- Write clear commit messages
- Test your changes before submitting (even for documentation changes)
- Respond to reviewer feedback promptly
- Be patient - maintainers may take time to review

---

## Syncing Your Fork

If you forked the repository and the original repository has been updated, you'll need to sync your fork:

### On GitHub (Web Interface):

1. Go to **your fork** of the repository
2. Click the **"Sync fork"** button (it appears when your fork is behind)
3. Click **"Update branch"**

### Using Git (Command Line):

```bash
# Add the original repository as a remote (one-time setup)
git remote add upstream https://github.com/JasonC-M/WAR.git

# Fetch the latest changes from the original repository
git fetch upstream

# Switch to your main branch
git checkout main

# Merge the changes from the original repository
git merge upstream/main

# Push the updates to your fork
git push origin main
```

---

## Local Development

For larger changes or feature development, you'll want to work locally:

### 1. Fork and Clone

1. **Fork** the repository by clicking the "Fork" button on GitHub
2. **Clone** your fork to your local machine:
   ```bash
   git clone https://github.com/YOUR-USERNAME/WAR.git
   cd WAR
   ```

### 2. Create a Branch

Always create a new branch for your changes:

```bash
git checkout -b feature/my-new-feature
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes

- Edit the files using your preferred code editor
- Test your changes by opening `index.html` in a web browser
- Since this is a static web app, no build process is required

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "Add feature: description of what you did"
```

### 5. Push to Your Fork

```bash
git push origin feature/my-new-feature
```

### 6. Create a Pull Request

1. Go to your fork on GitHub
2. Click **"Compare & pull request"**
3. Fill in the details and submit

---

## Code Style Guidelines

To keep the codebase consistent and maintainable:

### JavaScript (`script.js`)

- Use **camelCase** for variable and function names
- Use **const** for constants, **let** for variables that will change
- Add comments for complex logic
- Keep functions small and focused on a single task
- Use meaningful variable names (avoid single letters except for loop counters)

### HTML (`index.html`)

- Use **semantic HTML** elements where appropriate
- Maintain consistent indentation (2 spaces)
- Keep accessibility in mind (alt text, ARIA labels, etc.)

### CSS (`style.css`)

- Group related styles together
- Use meaningful class names
- Maintain consistent indentation (2 spaces)
- Avoid inline styles when possible

### Documentation

- Use clear, concise language
- Include examples where helpful
- Keep the README.md up to date with new features
- Check for typos and grammatical errors

---

## Testing Your Changes

Since WAR is a client-side application, testing is straightforward:

### For Code Changes:

1. Open `index.html` in your web browser
2. Test the specific functionality you modified
3. Try edge cases (empty inputs, invalid data, etc.)
4. Check the browser console for any errors (F12 → Console tab)
5. Test the import/export functionality to ensure data integrity
6. Verify that the charts still render correctly (if applicable)

### For Documentation Changes:

1. Preview Markdown files to ensure proper formatting
2. Click any links to verify they work
3. Read through your changes to check for clarity and accuracy

---

## Need Help?

- **Found a bug?** Open an [issue](https://github.com/JasonC-M/WAR/issues)
- **Have a question?** Open a [discussion](https://github.com/JasonC-M/WAR/discussions) (if enabled) or create an issue
- **Want to propose a feature?** Open an issue with the "Feature Request" label

---

## Code of Conduct

Please be respectful and professional in all interactions. We're all here to make WAR better!

---

## License

By contributing to WAR, you agree that your contributions will be licensed under the same license as the project (if specified in the repository).

---

**Thank you for contributing to WAR!** 🎉
