# UnifiedHQ - Team Activity Dashboard

<div align="center">
  <img src="public/placeholder-logo.svg" alt="UnifiedHQ Logo" width="120" height="120">
  
  **One dashboard to see everything your team did today**
  
  Connect Slack, GitHub, and more — get a unified feed and daily AI summary.
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.17.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
</div>

## 🚀 Features

### 🔗 **Integrations**
- **GitHub** - Track commits, pull requests, and repository activity
- **Slack** - Monitor messages, channels, and team communications
- **Coming Soon** - Microsoft Teams, Google Workspace, Jira, Trello, Discord, Linear, Asana

### 🤖 **AI-Powered Insights**
- Daily team activity summaries
- Intelligent activity categorization
- Productivity insights and trends
- Smart notifications and alerts

### 📊 **Real-time Dashboard**
- Live activity feed with real-time updates
- Customizable repository and channel selection
- Responsive design for all devices
- Dark/light theme support

### 🔐 **Authentication & Security**
- OAuth integration with GitHub and Slack
- Secure session management
- Rate limiting and API protection
- User preferences and settings

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with OAuth providers
- **Real-time**: WebSocket connections
- **AI**: OpenAI integration for summaries
- **Analytics**: PostHog for user analytics
- **Monitoring**: Sentry for error tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- GitHub OAuth App
- Slack App (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/unifiedhq.git
   cd unifiedhq
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/unifiedhq"
   
   # GitHub OAuth
   GH_CLIENT_ID="your-github-client-id"
   GH_CLIENT_SECRET="your-github-client-secret"
   
   # Slack Integration
   SLACK_CLIENT_ID="your-slack-client-id"
   SLACK_CLIENT_SECRET="your-slack-client-secret"
   
   # AI Services
   OPENAI_API_KEY="your-openai-api-key"
   
   # Analytics
   POSTHOG_KEY="your-posthog-key"
   POSTHOG_HOST="https://app.posthog.com"
   
   # Monitoring
   SENTRY_DSN="your-sentry-dsn"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- [GitHub Integration Setup](docs/GITHUB_INTEGRATION_SETUP.md)
- [Slack Integration Setup](docs/SLACK_INTEGRATION_SETUP.md)
- [AI Summary Setup](docs/AI_SUMMARY_SETUP.md)
- [Performance Optimizations](docs/PERFORMANCE_OPTIMIZATIONS.md)
- [Accessibility Implementation](docs/ACCESSIBILITY_IMPLEMENTATION.md)

## 🎯 Project Status

- **Overall Progress**: ~65% complete
- **GitHub Integration**: 95% complete ✅
- **Slack Integration**: 100% complete ✅
- **AI Features**: 10% complete 🚧
- **UI/UX**: 90% complete ✅

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Database
```bash
npx prisma migrate dev    # Run database migrations
npx prisma generate       # Generate Prisma client
npx prisma studio         # Open Prisma Studio
```

### Branch Management
```bash
npm run branch:create     # Create new feature branch
npm run branch:list       # List all branches
npm run branch:cleanup    # Clean up merged branches
npm run branch:health     # Check branch health
```

### Release Management
```bash
npm run release:create    # Create new release
npm run release:bump      # Bump version
npm run release:changelog # Generate changelog
```

### Performance
```bash
npm run perf:monitor      # Monitor performance
npm run perf:analyze      # Analyze performance
npm run perf:compare      # Compare performance metrics
```

## 🏗️ Architecture

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Main dashboard
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── ...            # Feature components
├── lib/               # Utility libraries
│   ├── integrations/  # Integration services
│   └── ...           # Other utilities
├── hooks/             # Custom React hooks
└── types/             # TypeScript type definitions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `npm run branch:create`
3. Make your changes
4. Run tests: `npm run review:check`
5. Commit your changes
6. Push to your fork
7. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Prisma](https://www.prisma.io/) - Database toolkit
- [Radix UI](https://www.radix-ui.com/) - Component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Better Auth](https://www.better-auth.com/) - Authentication library

## 📞 Support

- 📧 Email: support@unifiedhq.com
- 💬 Discord: [Join our community](https://discord.gg/unifiedhq)
- 📖 Documentation: [docs.unifiedhq.com](https://docs.unifiedhq.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/unifiedhq/issues)

---

<div align="center">
  Made with ❤️ by the UnifiedHQ Team
</div>