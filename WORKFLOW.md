# OpenCode Session Workflow

## Instructions
For each task, follow this workflow:

1. **Create a new branch** - Use format: `task/<short-description>-<date>`
2. **Execute the code** - Implement and run the solution
3. **Review with CodeRabbit** - Run `coderabbit` or similar review tool
4. **Push changes** - Push branch to remote
5. **Create PR** - Create pull request with description

## Git Commands
```bash
# Create and switch to new branch
git checkout -b task/description-date

# Add and commit changes
git add .
git commit -m "Description of changes"

# Push branch
git push -u origin task/description-date

# Create PR (using gh CLI)
gh pr create --title "Task: description" --body "Description"
```

## CodeRabbit Review
Run CodeRabbit review after completing the implementation.
