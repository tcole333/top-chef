#!/bin/bash

# Create a backup directory
mkdir -p backup

# Check if root app directory exists and move its contents to src/app
if [ -d "app" ]; then
  echo "Moving files from root app directory to src/app..."
  
  # First, back up the root app directory
  cp -r app backup/app_root
  
  # Check if src/app exists
  if [ ! -d "src/app" ]; then
    mkdir -p src/app
  fi
  
  # Copy files from root app to src/app if they don't already exist
  for file in app/*; do
    filename=$(basename "$file")
    if [ ! -e "src/app/$filename" ]; then
      cp -r "$file" "src/app/"
    fi
  done
  
  # Remove the root app directory
  rm -rf app
fi

# Make sure firebase config is in the right place
if [ -d "app/firebase" ] && [ ! -d "src/firebase" ]; then
  mkdir -p src/firebase
  cp -r app/firebase/* src/firebase/
fi

echo "Project structure reorganization complete!"