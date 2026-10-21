# Seph AI ✦

A polished, minimalist AI chatbot web application inspired by Grok's clean aesthetics, powered by the official Puter.js SDK. Client-side, serverless, and private by default.

![Seph AI Screenshot](public/logo.svg)

## Highlights

- **Direct AI Access via Puter.js**: Connects to leading LLMs (Claude 3.7 Sonnet, Claude 3.5 Sonnet, GPT-4o, GPT-4o Mini, DeepSeek Chat, DeepSeek R1, Gemini 2.0 Flash) without requiring manual API key configuration.
- **Real-Time Streaming**: Responsive, chunk-by-chunk streaming responses with animated blinking cursor.
- **Grok-Inspired Dark UI**: Pitch-black and charcoal palette, crisp monochrome typography, distraction-free composer, and responsive drawer navigation.
- **Persistent Local History**: Full conversation management (new chat, rename, delete, search, export) stored strictly in `localStorage`.
- **Markdown & Syntax Highlighting**: Full GitHub Flavored Markdown support, tables, math-friendly layout, and syntax-highlighted code blocks with one-click copy.
- **Honest Quotas & State Handling**: Clear sign-in prompts, quota limits, model availability indicators, and non-faked responses.
- **Stop, Regenerate & Retry**: Cancel generation mid-stream with `AbortController`, or regenerate responses on demand.
- **Zero Tracking**: Zero ads, zero cookies, zero telemetry.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown & Code**: [React Markdown](https://github.com/remarkjs/react-markdown), [remark-gfm](https://github.com/remarkjs/remark-gfm), [rehype-highlight](https://github.com/rehypejs/rehype-highlight)
- **AI Gateway**: [Puter.js v2](https://js.puter.com/v2/)

## Getting Started

### Local Development

1. Clone repository:
   ```bash
   git clone https://github.com/VenZ9/SephAI.git
   cd SephAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Deployment

Automated GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys the application directly to GitHub Pages on every push to the `main` branch.

- **Live URL**: [https://VenZ9.github.io/SephAI/](https://VenZ9.github.io/SephAI/)
