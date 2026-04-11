# StoryVerse - Creative Blogging Platform

StoryVerse is a modern, full-stack creative blogging platform designed for storytellers. It provides a rich writing experience augmented by AI features, a dynamic feed, and robust community engagement tools.

## Features

### 📝 Core Writing & Reading
* **Rich Text Editor**: Craft stories with formatted text, including formatting options like fonts, sizing, colors, styles, and lists.
* **AI Writing Assistant (Powered by Gemini)**:
  * **AI Fix**: Automatically correct grammar and polish your narrative.
  * **AI Extend**: Need inspiration? Get intelligent suggestions to seamlessly continue your story based on your current draft.
* **Text-to-Speech (TTS) Integration**: Listen to any story on the platform with built-in read-aloud functionality via the Web Speech API.

### 🌐 Community & Engagement
* **Narrative Feed & Discovery**: Browse the global feed, discover hidden stories, and read content from creators.
* **Social Features**: Like, bookmark, share, and comment on stories.
* **Follow System**: Keep up with your favorite authors by following their profiles.
* **Curated Collections**: Manage your personal library with "My Narratives" (your published work) and "Saved Stories" (your bookmarks).

### 🔐 Authentication & Security
* **Google OAuth2 Login**: Seamless and secure sign-in experience.
* **OTP Verification**: Strict email verification using One-Time Passwords (OTP) via Nodemailer. (Note: Currently restricted to `@gmail.com` addresses for security).
* **Moderation Tools**: Built-in reporting system for inappropriate stories or comments, with support for account suspensions.

### 🎨 Personalization & UX
* **Dynamic Profiles**: User profiles dynamically update with avatars, total likes, follow counts, and badge tiers (e.g., "Novice").
* **Dark Mode Support**: Deep integration with Tailwind CSS for a seamless dark/light mode toggle.
* **Real-Time Toasts**: Instant notification system for interactions such as new followers, likes, comments, and system alerts.

### 💻 Tech Stack
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS.
* **Backend**: Node.js, Express, TypeScript.
* **Database**: MongoDB (Mongoose ODMs).
* **AI Integration**: `@google/genai` (Gemini API).

---

## Getting Started

### Prerequisites
* Node.js
* MongoDB Atlas Cluster (or local instance)
* Google Cloud OAuth Credentials
* Gemini API Key

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (`.env`):
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_ID=your_google_client_id
   MONGODB_URI=your_mongodb_connection_string
   EMAIL_USER=your_gmail_address
   EMAIL_PASS=your_gmail_app_password
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Run the development server (Frontend + Backend):
   ```bash
   npm run dev
   ```

4. Build for Production:
   ```bash
   npm run build
   ```
