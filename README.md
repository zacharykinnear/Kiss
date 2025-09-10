# MailMate - Modern Email App

A beautiful, modern email application with Gmail integration and intelligent email management. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Multiple Gmail Account Support** - Connect and manage multiple Gmail accounts
- 🎨 **Beautiful Dark UI** - Modern, responsive design with smooth animations
- 📧 **Smart Categorization** - Automatic email categorization (Priority, Active, Internal, Partners, News)
- 🔍 **Advanced Search** - Search across all connected accounts
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Real-time Sync** - Live email synchronization with Gmail
- 🎯 **Smart Actions** - Promote, snooze, and manage emails efficiently
- 🔄 **Account Switching** - Seamlessly switch between connected accounts

## Screenshots

The app features a beautiful dark theme with:
- Left navigation rail with account switcher
- Category sidebar with smart filtering
- Message list with rich previews
- Detailed message view with action buttons
- Compose interface for new emails

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand with persistence
- **Authentication**: Google OAuth 2.0
- **Email API**: Gmail API
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Console account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mailmate
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
7. Copy the Client ID and Client Secret

### 4. Configure Environment Variables

Copy the example environment file and fill in your Google OAuth credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Connecting Gmail Accounts

1. Click "Connect Gmail Account" on the welcome screen
2. Sign in with your Google account
3. Grant necessary permissions for Gmail access
4. Your account will be connected and emails will start syncing

### Managing Multiple Accounts

- Use the account switcher in the left rail to switch between accounts
- Each account maintains its own email state and categories
- Add more accounts using the "+" button in the account switcher

### Email Categories

The app automatically categorizes emails into:
- **Priority**: Important emails requiring immediate attention
- **Active**: Current conversations and active threads
- **Internal**: Company/internal communications
- **Partners**: Partner and vendor communications
- **News**: Newsletters and updates

### Keyboard Shortcuts

- `P` - Promote email
- `S` - Snooze email
- `#` - Mark as spam
- `↑/↓` - Navigate messages
- `Enter` - Open message
- `⌘K` - Open shortcuts panel

## Project Structure

```
mailmate/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── auth/          # Authentication endpoints
│   ├── auth/              # OAuth callback pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main app page
├── components/             # Reusable components
├── services/               # Business logic services
│   ├── authService.ts     # Google OAuth handling
│   └── gmailService.ts    # Gmail API integration
├── store/                  # State management
│   └── emailStore.ts      # Zustand store
├── types/                  # TypeScript type definitions
│   └── email.ts           # Email-related types
├── .env.local.example     # Environment variables template
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## API Endpoints

- `POST /api/auth/google/callback` - Exchange OAuth code for tokens
- `POST /api/auth/refresh` - Refresh expired access tokens

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/mailmate/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error messages

## Roadmap

- [ ] Email composition with rich text editor
- [ ] Attachment handling and file uploads
- [ ] Email templates and signatures
- [ ] Advanced filtering and rules
- [ ] Email analytics and insights
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Team collaboration features
- [ ] Integration with other email providers

## Acknowledgments

- [Gmail API](https://developers.google.com/gmail/api) for email integration
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Lucide](https://lucide.dev/) for beautiful icons

