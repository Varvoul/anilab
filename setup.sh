#!/bin/bash

# Create folder and initialize
mkdir quravel-movies
cd quravel-movies

# Initialize project
npm init -y

# Install 11ty
npm install @11ty/eleventy

# Create minimal structure
mkdir src
echo '<!DOCTYPE html>
<html>
<head><title>Quravel Movies</title></head>
<body>
  <h1>🎬 Welcome to Quravel!</h1>
  <p>Movie streaming site coming soon.</p>
</body>
</html>' > src/index.html

# Initialize Git
git init

# Add .gitignore
echo "node_modules/\n_site/" > .gitignore

# Create README
echo "# Quravel Movies
Movie streaming site built with 11ty

## Local Development
\`\`\`bash
npm start
\`\`\`

## Build for Production
\`\`\`bash
npm run build
\`\`\`" > README.md

# Commit
git add .
git commit -m "Initial 11ty movie site"
git branch -M main

echo "✅ Project created successfully!"
echo "📁 Go to: quravel-movies/"
echo "🚀 Run: npm start"
echo ""
echo "📝 Next steps:"
echo "1. Create a new repository on GitHub.com"
echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/quravel-movies.git"
echo "3. Run: git push -u origin main"
