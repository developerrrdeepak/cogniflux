
# Project Blueprint

## Overview
This project is a Next.js application integrated with Google Cloud Gemini, ElevenLabs, Confluent Cloud (Kafka), and Datadog. It aims to provide an interactive AI experience with voice capabilities and real-time event streaming.

## Project History
- **Initial Setup:** Project structure established with Next.js App Router, Firebase configuration, and basic integrations.
- **API Key Security Enhancement:** Modified `app/lib/gemini.ts` to fetch the GEMINI_API_KEY from environment variables to prevent public exposure on GitHub. The `apphosting.yaml` file is configured to use a Firebase App Hosting secret for this variable.
- **Bug Fix:** Corrected an import error in `app/components/ThemeToggle.tsx`. The `useTheme` hook was incorrectly imported from a local provider instead of the `next-themes` package, causing the build to fail.
- **Authentication:** Implemented user authentication using Firebase Authentication. Added sign-up, login, and profile pages.
- **Build Troubleshooting:** Addressed persistent build failures by correcting the Node.js engine version in `package.json` and ensuring a clean `npm install`.
- **Firebase Initialization Fix:** Corrected the Firebase initialization logic in `app/firebase/config.ts` to prevent build failures caused by an undefined `app` variable.

## Features

### Authentication
- **Firebase Authentication:** User authentication is handled by Firebase, providing a secure and scalable solution.
- **Email/Password Sign-up:** New users can create an account using their email and a password.
- **Login/Logout:** Existing users can sign in and out of the application.
- **Protected Routes:** The profile page is a protected route, accessible only to authenticated users.
- **Session Management:** Firebase automatically manages user sessions, providing a seamless user experience.

#### Authentication Components:
- **`app/signup/page.tsx`:** The UI and logic for the user sign-up page.
- **`app/login/page.tsx`:** The UI and logic for the user login page.
- **`app/profile/page.tsx`:** A simple profile page that displays the user's email and a logout button.
- **`app/firebase/config.ts`:** The Firebase configuration file, which initializes the Firebase app and exports the necessary services.

## New Features Plan

### 1. Real-time Chat Interface
- **Create Chat Page:** A new page will be created at `/chat` to house the chat interface.
- **Chat UI:** The interface will include a message input for users and a display area for the conversation history.
- **Gemini Integration:** The chat will be powered by the Gemini API, allowing for natural and intelligent conversations.
- **Real-time Updates:** The chat will update in real-time as the user and the AI exchange messages.

### 2. Text-to-Speech (TTS)
- **ElevenLabs Integration:** The ElevenLabs API will be used to convert the AI's text responses into high-quality audio.
- **Audio Playback:** A button or an automatic playback feature will be added to allow users to listen to the AI's responses.

### 3. UI/UX Overhaul
- **Modern Design:** The entire application will be redesigned with a modern and visually appealing aesthetic.
- **New Landing Page:** The landing page will be revamped to be more engaging and informative.
- **Improved Navigation:** The navigation will be made more intuitive and user-friendly.
- **Responsive Design:** The application will be fully responsive, providing a seamless experience across all devices.
