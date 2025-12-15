# Project Blueprint

## Overview
This project is a Next.js application integrated with Google Cloud Gemini, ElevenLabs, Confluent Cloud (Kafka), and Datadog. It aims to provide an interactive AI experience with voice capabilities and real-time event streaming.

## Project History
- **Initial Setup:** Project structure established with Next.js App Router, Firebase configuration, and basic integrations.
- **API Key Security Enhancement:** Modified `app/lib/gemini.ts` to fetch the GEMINI_API_KEY from environment variables to prevent public exposure on GitHub. The `apphosting.yaml` file is configured to use a Firebase App Hosting secret for this variable.
- **Bug Fix:** Corrected an import error in `app/components/ThemeToggle.tsx`. The `useTheme` hook was incorrectly imported from a local provider instead of the `next-themes` package, causing the build to fail.

## Current Plan: Redeploy with Bug Fix
**Goal:** Deploy the application to Firebase App Hosting with the theme toggle bug fixed.

**Steps:**
1.  **Commit and Push:** Commit the fix for `app/components/ThemeToggle.tsx` to the `main` branch on GitHub.
2.  **Monitor Deployment:** The push will automatically trigger a new build and deployment on Firebase App Hosting. Monitor the build process to ensure it completes successfully.
