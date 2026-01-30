# Development Guide

Complete guide for setting up and developing Focal locally.

## Prerequisites

- **Node.js** 18+ (recommend LTS version)
- **pnpm** 8+ - Install: `npm install -g pnpm`
- **Wrangler CLI** - Install: `pnpm add -g wrangler`
- **Cloudflare account** (free tier available)
- **Google AI Studio account** (for Gemini API key)

## Initial Setup

### 1. Clone and Install

```bash
git clone https://github.com/mou514/FinanceMate.git
cd Focal
pnpm install
```

### 2. Environment Configuration

Create `.dev.vars` in the project root and add the following secrets. You can use `openssl rand -base64 32` to generate secure random strings for the secrets.

```bash
# Security (Required)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
ENCRYPTION_KEY="your-encryption-key-min-32-chars"
NODE_ENV="development"

# AI Providers (Required)
# Choose a default provider and provide the necessary API keys.
# All keys are required for the user selection feature to work.
AI_PROVIDER="gemini" # 'gemini' | 'openai' | 'nvidia' | 'groq'
GEMINI_API_KEY="your-google-gemini-api-key"
GITHUB_TOKEN="your-github-token"  # For OpenAI via GitHub Models
NVIDIA_API_KEY="your-nvidia-api-key"
GROQ_API_KEY="your-groq-api-key"

# Azure Computer Vision (Required for Groq provider only)
AZURE_VISION_ENDPOINT="https://your-resource.cognitiveservices.azure.com/"
AZURE_VISION_KEY="your-azure-vision-key"

# Email Service (Optional, for email verification/password reset)
BREVO_API_KEY="your-brevo-api-key"
EMAIL_FROM="your-sender-email@example.com"
```

### 3. Database Setup

Run all migrations to set up your local D1 database schema.

```bash
pnpm db:migrate && pnpm db:migrate:002 && pnpm db:migrate:003 && pnpm db:migrate:004 && pnpm db:migrate:005 && pnpm db:migrate:006
```

## Running the Application

### Development Servers

Run both the frontend and backend servers concurrently:

```bash
pnpm dev:full
```

Or run them in separate terminals:

```bash
# Terminal 1: Frontend (Vite)
pnpm dev

# Terminal 2: Backend (Wrangler)
pnpm dev:worker
```

Access the application at `http://localhost:3000`. The backend API will be available at `http://localhost:8787`.

### First Account Setup

1. Navigate to `http://localhost:3000/login`.
2. Click "Register" to create a new account.
3. Once logged in, you can start tracking expenses. The default AI provider (Gemini) will be used for receipt scanning.
4. To change the AI provider, go to the Settings page.

## AI Provider Management

Focal supports multiple AI providers for receipt scanning. The system is configured to use a default provider, but users can select their preferred provider in the settings.

### Supported Providers

- **Google Gemini** (`gemini`) - Vision AI, fast and accurate
- **OpenAI GPT-4o** (`openai`) - Vision AI via GitHub Models, high accuracy
- **Nvidia NIM** (`nvidia`) - Vision AI, experimental
- **Groq (OCR + LLM)** (`groq`) - Uses Azure Computer Vision for OCR + Groq's small LLM for structuring, cost-effective

### Configuration

- The default provider for new users is set by the `AI_PROVIDER` environment variable in `.dev.vars`.
- All API keys must be configured in `.dev.vars` for the provider selection to work correctly:
  - `GEMINI_API_KEY` - For Google Gemini
  - `GITHUB_TOKEN` - For OpenAI via GitHub Models
  - `NVIDIA_API_KEY` - For Nvidia NIM
  - `GROQ_API_KEY` - For Groq
  - `AZURE_VISION_ENDPOINT` and `AZURE_VISION_KEY` - For Groq provider (OCR component)
- In production, these are set as secrets in your Cloudflare worker.

### User Selection

Users can override the default provider by choosing one in the **Settings** page. This choice is stored per-user in the database.

## Rate Limiting

To prevent abuse and control costs, AI receipt scanning is rate-limited.

- **Limit**: 10 receipt scans per user per day.
- **Window**: The limit is based on a rolling 24-hour window.
- **Shared Quota**: The quota is shared across all AI providers. Switching providers does not reset the daily limit.
- **Error**: When the limit is exceeded, the API will return an HTTP 429 `Too Many Requests` error.

You can check your current usage via the `GET /api/receipts/quota` endpoint.

## Available Scripts

```bash
# Development
pnpm dev              # Frontend dev server
pnpm dev:worker       # Backend dev server
pnpm dev:full         # Both servers concurrently

# Building
pnpm build            # Production build
pnpm preview          # Preview production build

# Database
pnpm db:migrate       # Run all local migrations
pnpm db:migrate:prod  # Run all production migrations

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript type checking

# Deployment
pnpm deploy           # Deploy to Cloudflare
```

## Project Structure

```
focal/
├── src/                    # Frontend React app
│   ├── components/         # UI components
│   ├── pages/              # Route pages
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   └── lib/                # Utilities & API client
├── worker/                 # Backend Cloudflare Worker
│   ├── handlers/           # Route handlers
│   ├── services/           # Business logic (DB, AI, etc.)
│   ├── middleware/         # Auth, CORS, Rate Limiting
│   └── utils/              # Helpers & validation
├── migrations/             # Database schemas (D1)
├── public/                 # Static assets
└── docs/                   # Project documentation
```

## Development Tips

### Hot Module Replacement (HMR)

Both the Vite frontend and Wrangler backend support HMR, providing instant feedback on your changes without a full server restart.

### Database Operations

You can interact with your local or remote D1 database using Wrangler commands.

```bash
# Query local database
wrangler d1 execute focal_expensi_db --local --command="SELECT * FROM expenses"

# Query production database
wrangler d1 execute focal_expensi_db --remote --command="SELECT * FROM users"
```

### View Logs

Stream logs from your production worker to debug issues.

```bash
# Stream production logs
wrangler tail

# Filter by status (e.g., 'error')
wrangler tail --status error
```

### API Interaction

The backend runs on port 8787 during development. The Vite frontend is configured to proxy all requests from `/api` to the backend, so you can make API calls like `fetch('/api/expenses')` directly from the frontend code.

## Troubleshooting

### Port Already in Use

If a port is already in use, you can specify a different one:

```bash
# Use a different port for the frontend
pnpm dev -- --port 3001

# Use a different port for the backend
pnpm dev:worker --port 8788
```

### Database Issues

If you encounter problems with your local database, you can reset it.

```bash
# Reset local database state
rm -rf .wrangler/state

# Re-run all migrations
pnpm db:migrate && pnpm db:migrate:002 && pnpm db:migrate:003 && pnpm db:migrate:004 && pnpm db:migrate:005 && pnpm db:migrate:006
```

### Build Errors

If you face persistent build errors, try clearing all caches and reinstalling dependencies.

```bash
# Clear caches and installed packages
rm -rf node_modules dist .wrangler
pnpm install
pnpm build
```

## Tech Stack

### Frontend

- React 18, TypeScript, Vite
- TailwindCSS, shadcn/ui
- React Router, React Query
- React Hook Form, Zod

### Backend

- Cloudflare Workers, Hono.js
- Cloudflare D1 (SQLite)
- AI Providers: Google Gemini, OpenAI, Nvidia NIM

### Tools

- ESLint, TypeScript
- Wrangler, pnpm

## Security Best Practices

- Never commit `.dev.vars` or other files containing secrets to version control.
- Use environment variables for all sensitive data.
- Validate all user inputs on the server-side using Zod.
- Keep all dependencies up-to-date to avoid known vulnerabilities.

## Testing

The project currently relies on manual testing. Contributions for automated tests (e.g., using Vitest) are welcome!

## Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.
- See [API.md](API.md) for detailed API documentation.
- Open an issue on GitHub if you have questions or find a bug.
