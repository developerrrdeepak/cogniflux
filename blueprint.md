# Project Blueprint

## Overview
This project is a Next.js application integrated with Google Cloud Gemini, ElevenLabs, Confluent Cloud (Kafka), and Datadog. It aims to provide an interactive AI experience with voice capabilities and real-time event streaming.

## Project History
- **Initial Setup:** Project structure established with Next.js App Router, Firebase configuration, and basic integrations.
- **API Key Security Enhancement:** Modified `app/lib/gemini.ts` to fetch the GEMINI_API_KEY from environment variables to prevent public exposure on GitHub. The `apphosting.yaml` file is configured to use a Firebase App Hosting secret for this variable.

## Current Plan: Environment Configuration
**Goal:** Ensure secure handling and proper configuration of API keys for both local development and Firebase App Hosting deployment.

**Steps:**
1.  **Local Development:** Create a `.env.local` file in the project root and add your `GEMINI_API_KEY` (e.g., `GEMINI_API_KEY=your_gemini_api_key_here`) and other API keys if needed.
2.  **Firebase App Hosting:** Set `AIzaSyBEIqDVBNr378CmfCTY6KOTS0EFYG_it8Edo` as a secret named `GEMINI_API_KEY` in your Firebase App Hosting project settings. This will ensure the key is securely used during deployment without being exposed in your codebase.
