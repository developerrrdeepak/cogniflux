
# Project Blueprint

## Overview
This project is a Next.js application integrated with Google Cloud Gemini, ElevenLabs, Confluent Cloud (Kafka), and Datadog. It aims to provide an interactive AI experience with voice capabilities and real-time event streaming.

## Project History
- **Initial Setup:** Project structure established with Next.js App Router, Firebase configuration, and basic integrations.
- **API Key Security Enhancement:** Modified `app/lib/gemini.ts` to fetch the GEMINI_API_KEY from environment variables to prevent public exposure on GitHub. The `apphosting.yaml` file is configured to use a Firebase App Hosting secret for this variable.
- **Bug Fix:** Corrected an import error in `app/components/ThemeToggle.tsx`. The `useTheme` hook was incorrectly imported from a local provider instead of the `next-themes` package, causing the build to fail.
- **Authentication:** Implemented user authentication using Firebase Authentication. Added sign-up, login, and profile pages.
- **Build Troubleshooting:** Addressed persistent build failures by correcting the Node.js engine version in `package.json` and ensuring a clean `npm install`.

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
