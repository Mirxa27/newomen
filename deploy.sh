#!/bin/bash

# Exit on error
set -e

# Install dependencies
npm install

# Build the project
npm run build

# Deploy Supabase functions
supabase functions deploy
