#!/bin/bash

# Navigate to the top_chef_website directory
cd top_chef_website

# Check if there's a nested top_chef_website directory and move its contents up
if [ -d "top_chef_website" ]; then
  echo "Moving files from nested top_chef_website directory..."
  mv top_chef_website/* .
  rm -rf top_chef_website
fi

# Check if there's a nested top-chef-fantasy directory and move its contents up
if [ -d "top-chef-fantasy" ]; then
  echo "Moving files from nested top-chef-fantasy directory..."
  
  # Move package.json, package-lock.json, and other config files
  if [ -f "top-chef-fantasy/package.json" ]; then
    mv top-chef-fantasy/package.json .
  fi
  
  if [ -f "top-chef-fantasy/package-lock.json" ]; then
    mv top-chef-fantasy/package-lock.json .
  fi
  
  if [ -f "top-chef-fantasy/next.config.ts" ]; then
    mv top-chef-fantasy/next.config.ts .
  fi
  
  if [ -f "top-chef-fantasy/tsconfig.json" ]; then
    mv top-chef-fantasy/tsconfig.json .
  fi
  
  if [ -f "top-chef-fantasy/postcss.config.mjs" ]; then
    mv top-chef-fantasy/postcss.config.mjs .
  fi
  
  if [ -f "top-chef-fantasy/eslint.config.mjs" ]; then
    mv top-chef-fantasy/eslint.config.mjs .
  fi
  
  # Move node_modules if it exists
  if [ -d "top-chef-fantasy/node_modules" ]; then
    mv top-chef-fantasy/node_modules .
  fi
  
  # Move public directory if it exists
  if [ -d "top-chef-fantasy/public" ]; then
    mv top-chef-fantasy/public .
  fi
  
  # Move src directory if it exists
  if [ -d "top-chef-fantasy/src" ]; then
    # If we already have an app directory, we need to be careful
    if [ -d "app" ] && [ -d "top-chef-fantasy/src/app" ]; then
      # Move contents of src/app to app if they don't already exist
      for file in top-chef-fantasy/src/app/*; do
        filename=$(basename "$file")
        if [ ! -e "app/$filename" ]; then
          mv "$file" "app/"
        fi
      done
    else
      # If no app directory exists, just move the src directory
      mv top-chef-fantasy/src .
    fi
  fi
  
  # Remove the now-empty top-chef-fantasy directory
  rm -rf top-chef-fantasy
fi

# Make sure we have a proper app directory structure
if [ -d "src/app" ] && [ ! -d "app" ]; then
  mv src/app .
  # Remove src directory if it's empty
  if [ -z "$(ls -A src)" ]; then
    rm -rf src
  fi
fi

echo "Project structure reorganization complete!"