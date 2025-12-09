# RevoForms v1.0.0 "Genesis"

> AI-powered form platform with voice input, avatar assistant, and infinite canvas.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-production-success)

## ✨ Features

### 🤖 AI-Powered
- **Conversational Form Builder** - Create forms through natural language
- **Voice Input** - Speak to create and edit forms hands-free
- **AI Avatar Assistant** - Animated guide with real-time interactions
- **Smart Field Generation** - Auto-generate 30+ field types

### 🎨 Design
- **Infinite Canvas** - Figma-like drag-and-drop interface
- **Glassmorphism Theme** - Modern, futuristic aesthetic
- **Custom CSS** - 20+ targetable class names
- **Real-time Preview** - See changes instantly

### 📤 Export
- **Multiple Formats** - HTML, React, JSON, WordPress, PDF
- **Embed Options** - Popup, slide-in, inline
- **QR Code Sharing** - Instant form links

### 📊 Analytics
- **Response Collection** - Built-in submission backend
- **Basic Analytics** - Views, starts, completions
- **CSV/JSON Export** - Download response data

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/revoforms.git
cd revoforms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

## 🔧 Environment Variables

```env
# AI Provider (Z.ai recommended)
ZHIPU_API_KEY=your_zhipu_key

# Backup Provider (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_key

# Optional: Supabase for cloud storage
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 📁 Project Structure

```
revoforms/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   │   ├── ai/          # AI features
│   │   ├── avatar/      # Avatar components
│   │   ├── canvas/      # Infinite canvas
│   │   ├── form-builder/# Form components
│   │   └── ui/          # UI components
│   ├── store/           # Zustand stores
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
├── public/              # Static assets
└── LAUNCH_PLAN.md       # Launch documentation
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 18, Framer Motion
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **AI**: Z.ai GLM-4.6 / OpenRouter fallback
- **PDF**: pdf-lib
- **Voice**: Web Speech API

## 📈 Version History

### v1.0.0 "Genesis" (2024-12-10)
- Initial release
- AI conversational form builder
- Voice input support
- AI Avatar assistant
- Infinite canvas
- PDF export
- 10 templates

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Website](https://revoforms.com)
- [Documentation](https://docs.revoforms.com)
- [Discord Community](https://discord.gg/revoforms)
- [Twitter](https://twitter.com/revoforms)

---

**Built with ❤️ by the RevoForms Team**
