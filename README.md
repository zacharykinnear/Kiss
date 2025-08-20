# MailMate - AI-Powered Email Assistant

MailMate is a modern email application that connects to Gmail via API and processes emails using ChatGPT's AI capabilities. It provides intelligent email management with features like summarization, categorization, smart replies, and sentiment analysis.

## Features

### 🔐 Gmail Integration
- Secure OAuth2 authentication with Gmail
- Read, search, and send emails through Gmail API
- Automatic token refresh and management

### 🤖 AI-Powered Email Processing
- **Email Summarization**: Get concise summaries of long emails
- **Smart Categorization**: Automatically categorize emails into work, personal, marketing, etc.
- **Intelligent Reply Generation**: Generate contextual and professional replies
- **Action Item Extraction**: Extract tasks, deadlines, and action items from emails
- **Sentiment Analysis**: Analyze the emotional tone and urgency of emails

### 🎨 Modern User Interface
- Clean, responsive design with modern UI/UX
- Real-time email loading and processing
- Modal-based email viewing with AI actions
- Search functionality across all emails
- Mobile-responsive design

## Prerequisites

Before running MailMate, you'll need:

1. **Node.js** (v14 or higher)
2. **Gmail API Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API
   - Create OAuth2 credentials
   - Download the credentials JSON file

3. **ChatGPT API Key**:
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Get your API key from the dashboard

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd MailMate
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Gmail API Configuration
   GMAIL_CLIENT_ID=your_gmail_client_id_here
   GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
   GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

   # ChatGPT API Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the application**:
   ```bash
   npm start
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3000`

## Gmail API Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project

### Step 2: Create OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/gmail/callback` (for development)
   - Your production URL (for deployment)
5. Download the JSON file with your credentials

### Step 3: Configure Environment Variables
Update your `.env` file with the credentials from the downloaded JSON file:
```env
GMAIL_CLIENT_ID=your_client_id_from_json
GMAIL_CLIENT_SECRET=your_client_secret_from_json
```

## Usage

### 1. Connect Gmail Account
- Click the "Connect Gmail" button in the sidebar
- Authorize MailMate to access your Gmail account
- You'll be redirected back to the application

### 2. View Emails
- Your inbox emails will be displayed automatically
- Click on any email to view its full content
- Use the search bar to find specific emails

### 3. Use AI Features
- **In Email View**: Click on any AI action button (Summarize, Categorize, etc.)
- **In AI Tools View**: Use the tool cards to process multiple emails
- **Generate Replies**: Use the "Generate Reply" feature to create contextual responses

### 4. Search Emails
- Use the search bar in the header to search across all emails
- Search results are displayed in a dedicated view

## API Endpoints

### Authentication
- `GET /api/auth/gmail` - Get Gmail authentication URL
- `GET /api/auth/gmail/callback` - Handle OAuth callback

### Email Operations
- `GET /api/emails` - Get inbox emails
- `GET /api/emails/:id` - Get specific email details
- `GET /api/emails/search` - Search emails
- `POST /api/emails/:id/reply` - Send reply to email

### AI Processing
- `POST /api/emails/:id/process` - Process email with AI

## Project Structure

```
MailMate/
├── server.js                 # Main Express server
├── services/
│   ├── gmailService.js      # Gmail API integration
│   └── chatgptService.js    # ChatGPT API integration
├── public/
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styles
│   └── app.js              # Frontend JavaScript
├── data/                    # Token storage (created automatically)
├── package.json
└── README.md
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build frontend assets
- `npm run dev:build` - Build frontend assets in development mode with watch

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: API rate limiting to prevent abuse
- **OAuth2**: Secure Gmail authentication
- **Environment Variables**: Secure API key management

## Troubleshooting

### Common Issues

1. **"Failed to connect to Gmail"**
   - Check your Gmail API credentials in `.env`
   - Ensure Gmail API is enabled in Google Cloud Console
   - Verify redirect URI matches your configuration

2. **"Failed to process email with AI"**
   - Check your ChatGPT API key in `.env`
   - Ensure you have sufficient OpenAI API credits
   - Verify the email content is not empty

3. **"Token expired"**
   - Re-authenticate with Gmail by clicking "Connect Gmail"
   - Check if your OAuth2 credentials are still valid

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=mailmate:*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the Google Cloud Console and OpenAI documentation

## Roadmap

- [ ] Email threading support
- [ ] Advanced email filtering
- [ ] Bulk email processing
- [ ] Email templates
- [ ] Calendar integration
- [ ] Multi-account support
- [ ] Email analytics dashboard
- [ ] Custom AI prompts
- [ ] Email scheduling
- [ ] Advanced search filters 