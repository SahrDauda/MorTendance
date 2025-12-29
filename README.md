# 🌉 The Bridge Platform

> **Connecting students to careers through verified credentials and AI-powered guidance.**

---

## 👋 Welcome to The Bridge

**What is this?**
Imagine a professional network (like LinkedIn) designed specifically for students, but smarter. The Bridge Platform isn't just about who you know; it's about **proving what you know**. It connects students, educational institutions, and employers in a trusted ecosystem.

**Who is it for?**
*   **Students**: To build a verified portfolio, find career paths, and get hired.
*   **Employers**: To find talent with verified skills (no more guessing if a resume is true).
*   **Institutions**: To issue digital credentials that actually mean something in the job market.

---

## 🚀 Key Features (What can you do?)

### 1. 🎓 Smart Dashboard
Think of this as your career command center. Instead of a feed of random posts, you get:
*   **Personalized Job Matches**: Jobs that actually fit your skills.
*   **Trending Skills**: See what skills are hot in the market right now (e.g., "Quantum Computing is up 42%").

### 2. 🎒 Credential Wallet
A digital backpack for your achievements.
*   **Blockchain Verification**: When you earn a certificate, it's "stamped" digitally on the Solana blockchain. This means it's impossible to fake. Employers can scan a QR code to instantly verify you really earned that degree or certificate.
*   **On-Chain Verification**: Every credential hash is stored on Solana blockchain, making verification instant and tamper-proof.
*   **Issuer Management**: Institutions can issue, verify, and revoke credentials with full blockchain transparency.

### 3. 🧭 Career Navigator
A GPS for your professional life.
*   **Pathfinding**: Want to be a "Senior AI Engineer"? The system looks at where you are now and draws a map of exactly what skills, courses, and roles you need to get there.
*   **Skill Gap Analysis**: It tells you, "You're great at Python, but you need to learn TensorFlow to get this job."

### 4. 📂 Project Portfolio
Show, don't just tell.
*   Upload your actual work (videos, code, designs).
*   Tag collaborators (who you worked with).
*   Get endorsements from mentors.

### 5. 🤖 AI-Powered Features
Intelligent assistance powered by OpenAI.
*   **Resume Parsing**: Upload your PDF resume and watch it auto-fill your profile. The AI extracts your skills, experience, and education automatically.
*   **Semantic Search**: Find opportunities using natural language. Search for "React developer" and find jobs mentioning "Frontend engineer" or "JavaScript specialist" - the AI understands meaning, not just keywords.
*   **Match Explanations**: Get AI-generated explanations for why a job matches your profile. "This role matches because you have 3+ years of React experience and the company values full-stack developers."
*   **Skill Verification Quizzes**: Prove your skills with AI-generated quizzes tailored to your expertise level (beginner, intermediate, advanced).

### 6. ⛓️ Blockchain Integration
Tamper-proof credential verification on Solana.
*   **Automatic Anchoring**: Credentials are automatically anchored on Solana blockchain when issued by institutions.
*   **Public Verification**: Anyone can verify a credential's authenticity by scanning a QR code - no login required.
*   **Low Cost**: Anchoring costs ~$0.000002 per credential (extremely affordable).
*   **Wallet Monitoring**: Automatic balance checks ensure credentials can always be anchored.

---

## 🛠️ For Developers: Technical Deep Dive

This section explains how the system is built.

### 🏗️ Architecture Overview

The application is **in active development** with partial backend integration.
*   **Frontend**: Modern Next.js 16 App Router with TypeScript
*   **Backend**: REST API with Next.js API routes (partially implemented)
*   **Database**: PostgreSQL with Prisma ORM (27+ tables)
*   **Authentication**: NextAuth.js v5 (beta) with credentials provider
*   **Data**: Mix of real database persistence and mock data

### 💻 Technology Stack

We use modern, industry-standard tools:

**Core Framework:**
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router) - The engine running the website.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - Adds strict rules to JavaScript to prevent bugs.
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - For rapid, beautiful design.
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Reusable, accessible interface elements.
*   **Icons**: [Lucide React](https://lucide.dev/) - Clean, consistent icons.

**AI & Machine Learning:**
*   **OpenAI**: GPT-4o-mini for text generation, text-embedding-3-small for semantic search
*   **Vector Database**: PostgreSQL with pgvector extension for similarity search
*   **PDF Parsing**: pdf-parse for resume extraction

**Blockchain:**
*   **Solana**: Blockchain for credential anchoring and verification
*   **Web3.js**: @solana/web3.js for blockchain interactions
*   **Base58**: bs58 for key encoding/decoding

**Additional Tools:**
*   **QR Codes**: qrcode for credential verification QR codes
*   **Form Validation**: Zod for schema validation
*   **Authentication**: NextAuth.js v5 for secure user sessions

### 📂 Project Structure

Here is how the code is organized:

```
bridge-platform/
├── app/                    # The main application code (Next.js App Router)
│   ├── (dashboard)/        # Pages you see after logging in (Dashboard, Profile, etc.)
│   ├── api/                # Backend API routes (REST API)
│   │   ├── ai/             # AI endpoints (parse-resume, match-explanation, quiz)
│   │   ├── credentials/     # Credential management with blockchain integration
│   │   └── ...              # Other API routes
│   ├── auth/               # Authentication pages (sign in, sign up)
│   └── globals.css         # Global styles and design tokens
├── components/             # Reusable building blocks
│   ├── ui/                 # Buttons, Inputs, Cards (Basic elements)
│   ├── dashboard/          # Complex blocks like "JobCard" or "SkillChart"
│   ├── ai/                 # AI-powered components (resume-upload, match-explanation)
│   ├── dialogs/            # Modal dialogs for forms
│   └── providers/          # React context providers
├── lib/                    # Helper functions and utilities
│   ├── db.ts               # Prisma database client
│   ├── auth.ts             # NextAuth configuration
│   ├── api-client.ts       # API request utilities
│   ├── middleware.ts       # Authentication middleware
│   ├── openai.ts           # OpenAI client wrapper with retry logic
│   ├── ai/                 # AI services
│   │   ├── config.ts       # OpenAI configuration & validation
│   │   ├── embeddings.ts   # Vector embedding generation
│   │   ├── search.ts       # Semantic search with pgvector
│   │   ├── resume-parser.ts # PDF resume parsing
│   │   ├── match-explanations.ts # Job match explanations
│   │   ├── rate-limiter.ts # API rate limiting
│   │   └── feature-flags.ts # Feature flag management
│   ├── blockchain/         # Blockchain services
│   │   ├── config.ts       # Solana configuration
│   │   ├── solana.ts       # Solana anchoring service
│   │   ├── hash.ts         # Credential hashing
│   │   ├── verification.ts # On-chain verification
│   │   ├── wallet-monitor.ts # Wallet balance monitoring
│   │   └── issuers.ts      # Issuer registry
│   └── hooks/              # Custom React hooks
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Prisma schema definition (with vector embeddings)
├── scripts/                # Utility scripts
│   ├── migrate-credentials-to-blockchain.ts # Batch credential anchoring
│   └── check-solana-balance.ts # Wallet balance checker
├── types/                  # TypeScript definitions (The "Shape" of our data)
└── public/                 # Images and static files
```

### 💾 Data Model (The "Brain")

The system uses a comprehensive database schema with **27+ tables** covering:
*   **Users & Profiles** - Authentication, learner profiles, user settings
*   **Skills & Trending** - Skills management with trending data
*   **Credentials** - Credential management with verification requests
*   **Projects** - Portfolio projects with media, skills, and collaborators
*   **Opportunities** - Jobs/internships with AI-powered matching
*   **Applications** - Job application tracking
*   **Network** - Connections, connection requests, messaging
*   **Notifications** - User notifications and feed items
*   **Career Paths** - Career path generation with skill gaps
*   **Courses** - Course management with skill associations

*For the full database schema, read [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md).*

---

## ⚡ Getting Started

Follow these steps to run the project on your computer.

### Prerequisites
*   **Node.js** (Version 18 or higher) installed.
*   **PostgreSQL** database (local or cloud).
*   **Git** installed.

### Quick Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/TommyBangs/thebridgesl.git
    cd thebridgesl
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    ```bash
    cp .env.example .env
    # Edit .env with your database URL, NextAuth secret, OpenAI API key, and Solana configuration
    ```
    
    **Required Environment Variables:**
    *   `DATABASE_URL` - PostgreSQL connection string
    *   `NEXTAUTH_SECRET` - Secret for NextAuth.js sessions
    *   `OPENAI_API_KEY` - OpenAI API key (starts with `sk-`) for AI features
    *   `SOLANA_RPC_URL` - Solana RPC endpoint (default: `https://api.devnet.solana.com`)
    *   `SOLANA_PRIVATE_KEY` - Base58-encoded Solana private key for credential anchoring
    *   `SOLANA_CLUSTER` - `devnet` or `mainnet-beta`

4.  **Set up the database**:
    ```bash
    npm run db:generate
    npm run db:push
    ```
    
    **Enable pgvector extension** (for AI semantic search):
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    ```
    
    **Note:** If you encounter Prisma generation errors on Windows, close your IDE and run `npx prisma generate` in an Administrator PowerShell window.

5.  **Run the development server**:
    ```bash
    npm run dev
    ```

6.  **Open your browser**:
    Go to [http://localhost:3000](http://localhost:3000) and sign up for an account!

### Detailed Setup

For detailed setup instructions, including database configuration and troubleshooting, see **[SETUP.md](./SETUP.md)**.

**Note**: Currently experiencing database connectivity issues with Prisma. Ensure your `DATABASE_URL` is correctly configured before running the application.

---

## 🎯 Features

### ✅ Fully Implemented (Real API Integration)
- **Home Dashboard** - Trending skills, opportunities, user profile
- **User Profiles** - Edit profile, download profile, public profiles
- **Projects Portfolio** - Full CRUD with media support
- **Career Navigator** - Path generation, skill gap analysis
- **Job Opportunities** - Listing with AI matching scores and match explanations
- **User Authentication** - Sign up, sign in with NextAuth.js (with validation)
- **Skills Management** - Skills with trending data
- **Credentials Management** - Full CRUD with blockchain anchoring
- **Job Applications** - Application tracking (API exists)
- **AI Resume Parsing** - PDF upload and automatic profile filling
- **Semantic Search** - AI-powered search with vector embeddings
- **Match Explanations** - AI-generated job match explanations
- **Skill Verification Quizzes** - AI-generated skill assessment quizzes
- **Blockchain Verification** - Solana-based credential anchoring and verification
- **QR Code Verification** - Public credential verification via QR codes
- **Wallet Monitoring** - Automatic Solana wallet balance checks

### ⚠️ Partially Implemented (Using Mock Data)
- **Discover Page** - Search supports semantic search but some features still use mock data
- **Network Pages** - Connections, requests, suggestions (mock data)
- **Notifications** - Mock data, no real-time updates
- **Settings** - Not persisted to database
- **Skills Detail** - Uses mock data
- **Credentials Detail** - Uses mock data
- **Job Detail** - Uses mock data (but match explanations are real)


## 📊 Current Status

- **Pages Created**: 18/22 (82%)
- **Pages with Real API**: 5/18 (28%)
- **API Routes Created**: 12/25 (48%)
- **Overall Completion**: ~45%

### Critical Issues
1. **Database Connectivity** - Prisma connection issues (blocker)
2. **Mock Data** - Many pages still use mock data
3. **Missing API Endpoints** - Network, notifications, search need completion
4. **Real-time Features** - WebSocket not implemented

*For detailed status, see [APP_COMPLETION_STATUS.md](./APP_COMPLETION_STATUS.md)*

## 🤝 Contributing

We welcome contributions!
1.  **Found a bug?** Open an issue.
2.  **Want to add a feature?** Fork the repo, make changes, and open a Pull Request (PR).
3.  **Need help?** Check [SETUP.md](./SETUP.md) or [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## 📄 License

Proprietary and Confidential.
© 2025 The Bridge Platform.
# MorTendance
#   M o r T e n d a n c e  
 