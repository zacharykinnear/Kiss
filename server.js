const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const gmailService = require('./services/gmailService');
const chatgptService = require('./services/chatgptService');
const userService = require('./services/userService');
const { requireAuth, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Export for Electron
module.exports = app;

// Security middleware
app.use(helmet());
app.use(cors());

// Global error handler middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: isProduction ? 'Invalid input data' : error.message 
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Authentication required',
      details: isProduction ? 'Please log in again' : error.message 
    });
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      error: 'Service unavailable',
      details: 'External service is temporarily unavailable' 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Internal server error',
    details: isProduction ? 'Something went wrong' : error.message 
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Request timeout middleware (30 seconds)
app.use((req, res, next) => {
  const isFilterRoute = req.path && req.path.startsWith('/api/emails/filter');
  const timeoutMs = isFilterRoute ? 120000 : 30000; // Allow up to 120s for heavy filter route
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ 
        error: 'Request timeout',
        details: 'The request took too long to process' 
      });
    }
  }, timeoutMs);
  
  res.on('finish', () => clearTimeout(timeout));
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// User Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Username, email, and password are required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please enter a valid email address' 
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too weak',
        details: 'Password must be at least 6 characters long' 
      });
    }
    
    const result = await userService.register(username, email, password);
    res.json({ success: true, message: 'Registration successful', user: result });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ 
        error: 'User already exists',
        details: 'A user with this username or email already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'production' ? 'Please try again later' : error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await userService.login(username, password);
    res.cookie('sessionId', result.sessionId, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    res.json({ success: true, message: 'Login successful', user: result.user, sessionId: result.sessionId });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    await userService.logout(req.sessionId);
    res.clearCookie('sessionId');
    res.json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/auth/status', async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.json({ authenticated: false });
    }

    const session = await userService.validateSession(sessionId);
    if (!session) {
      return res.json({ authenticated: false });
    }

    const user = await userService.getUserById(session.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }

    res.json({ 
      authenticated: true, 
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.json({ authenticated: false });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.userId);
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Gmail authentication routes
app.get('/api/auth/gmail', requireAuth, async (req, res) => {
    try {
        const authUrl = gmailService.generateAuthUrl(req.sessionId);
        res.json({ authUrl });
    } catch (error) {
        console.error('Gmail auth error:', error);
        res.status(500).json({ error: 'Failed to generate Gmail auth URL' });
    }
});

app.get('/api/auth/gmail/callback', async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.status(400).json({ error: 'Authorization code required' });
        }

        // Extract sessionId from state parameter (Google OAuth state)
        const sessionId = state;
        if (!sessionId) {
            return res.status(400).json({ error: 'Session information missing' });
        }

        // Validate session
        const session = await userService.validateSession(sessionId);
        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const tokens = await gmailService.getTokensFromCode(code);
        
        // Try to get user info from Gmail to create a better account name
        let accountName = 'Gmail Account';
        try {
            const gmail = google.gmail({ version: 'v1', auth: gmailService.oauth2Client });
            gmailService.setUserTokens(tokens);
            const profile = await gmail.users.getProfile({ userId: 'me' });
            if (profile.data.emailAddress) {
                accountName = `Gmail - ${profile.data.emailAddress}`;
            }
        } catch (error) {
            console.log('Could not get Gmail profile, using default name');
        }
        
        // Add the Gmail account to user's accounts
        const gmailAccount = await userService.addGmailAccount(session.userId, accountName, tokens);
        
        res.redirect('/?gmail_connected=true&account_id=' + gmailAccount.id + '&sessionId=' + sessionId);
    } catch (error) {
        console.error('Gmail callback error:', error);
        res.redirect('/?gmail_error=true');
    }
});

// Get user's Gmail accounts
app.get('/api/gmail/accounts', requireAuth, async (req, res) => {
    try {
        const accounts = await userService.getGmailAccounts(req.user.userId);
        console.log('Gmail accounts for user:', req.user.userId, ':', accounts);
        res.json({ accounts });
    } catch (error) {
        console.error('Error getting Gmail accounts:', error);
        res.status(500).json({ error: 'Failed to get Gmail accounts' });
    }
});

// Remove Gmail account
app.delete('/api/gmail/accounts/:accountId', requireAuth, async (req, res) => {
    try {
        await userService.removeGmailAccount(req.user.userId, req.params.accountId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing Gmail account:', error);
        res.status(500).json({ error: 'Failed to remove Gmail account' });
    }
});

// Get emails filtered by category using AI (must be BEFORE /api/emails/:accountId routes)
app.get('/api/emails/filter', requireAuth, async (req, res) => {
    try {
        const { type, maxResults = 20 } = req.query;
        const requestedMax = parseInt(maxResults);
        const poolSize = Math.max(requestedMax, 100);
        
        // Get all user accounts
        const accounts = await userService.getGmailAccounts(req.user.userId);
        if (!accounts || accounts.length === 0) {
            return res.json({ filteredEmails: [] });
        }

        const allFilteredEmails = [];
        
        // Keyword heuristics per type
        const financialKeywords = /invoice|receipt|bill|payment|statement|bank|subscription|tax|credit|charge|paypal|stripe|transaction|order|refund|amount|due|warranty/i;
        const urgentKeywords = /urgent|asap|immediate|overdue|important|action required|past due|final notice|respond now/i;
        const leadsKeywords = /lead|opportunit|proposal|quote|estimate|rfp|rfq|demo|trial|pricing|partnership|collaborat|sales inquiry|new client/i;
        const socialKeywords = /friend|family|invitation|invite|party|birthday|wedding|linkedin|facebook|instagram|twitter|x\.com|follow|connect|social/i;

        for (const account of accounts) {
            try {
                const tokens = await userService.getGmailTokens(req.user.userId, account.id);
                if (!tokens) continue;

                // Financial: categorized + keyword guardrails, fallback to recent keyword scan
                if (type === 'financial') {
                    const categorized = await gmailService.getCategorizedEmails(tokens, 200);
                    const financialList = (categorized.categories && categorized.categories['Financial & Bills']) ? categorized.categories['Financial & Bills'] : [];
                    for (const catEmail of financialList) {
                        const text = `${catEmail.subject || ''} ${catEmail.snippet || ''}`;
                        if (financialKeywords.test(text)) {
                            allFilteredEmails.push({ email: catEmail, accountId: account.id, accountEmail: account.email });
                        }
                    }
                    if (allFilteredEmails.length === 0) {
                        const emails = await gmailService.getEmails(tokens, null, requestedMax, 'in:inbox');
                        for (const email of emails.emails || []) {
                            const text = `${email.subject || ''} ${email.snippet || ''}`;
                            if (financialKeywords.test(text)) {
                                allFilteredEmails.push({ email, accountId: account.id, accountEmail: account.email });
                            }
                        }
                    }
                    continue;
                }

                // Others: recent pool then heuristics and AI
                const emails = await gmailService.getEmails(tokens, null, poolSize, 'in:inbox');
                for (const email of emails.emails || []) {
                    try {
                        const fullEmail = await gmailService.getEmailById(tokens, email.id);
                        let shouldInclude = false;

                        switch (type) {
                            case 'urgent': {
                                const text = `${fullEmail.subject || ''} ${fullEmail.body || ''}`;
                                if (urgentKeywords.test(text)) { shouldInclude = true; break; }
                                const pr = await chatgptService.processEmail(fullEmail, 'priority_score');
                                const priority = pr.result.priority_score || 5;
                                shouldInclude = priority >= 8;
                                break;
                            }
                            case 'leads': {
                                const text = `${fullEmail.subject || ''} ${fullEmail.body || ''}`;
                                if (leadsKeywords.test(text)) { shouldInclude = true; break; }
                                const cr = await chatgptService.processEmail(fullEmail, 'smart_categorize');
                                shouldInclude = cr.result.primary_category === 'work' && cr.result.sub_category === 'project';
                                break;
                            }
                            case 'social': {
                                const text = `${fullEmail.subject || ''} ${fullEmail.body || ''}`;
                                if (socialKeywords.test(text)) { shouldInclude = true; break; }
                                const sr = await chatgptService.processEmail(fullEmail, 'smart_categorize');
                                shouldInclude = sr.result.primary_category === 'social' || sr.result.primary_category === 'personal';
                                break;
                            }
                            default:
                                shouldInclude = false;
                        }

                        if (shouldInclude) {
                            allFilteredEmails.push({ email: fullEmail, accountId: account.id, accountEmail: account.email });
                        }
                    } catch (error) {
                        console.error(`Error processing email ${email.id}:`, error);
                    }
                }
            } catch (error) {
                console.error(`Error processing account ${account.id}:`, error);
            }
        }
        
        try {
          allFilteredEmails.sort((a, b) => new Date(b.email.date) - new Date(a.email.date));
        } catch (_) {}
        const limitedResults = allFilteredEmails.slice(0, requestedMax);
        if (!res.headersSent) {
          return res.json({ filteredEmails: limitedResults, totalFound: allFilteredEmails.length });
        }
    } catch (error) {
        console.error('Category filtering error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to filter emails by category' });
        }
    }
});

// Get emails from specific account
app.get('/api/emails/:accountId', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { pageToken, maxResults = 50 } = req.query;
        
        console.log(`Loading emails for account ${accountId}, maxResults: ${maxResults}`);
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            console.log(`No tokens found for account ${accountId}`);
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        console.log(`Got tokens for account ${accountId}, fetching emails...`);
        const emails = await gmailService.getEmails(tokens, pageToken, parseInt(maxResults));
        console.log(`Fetched ${emails.emails ? emails.emails.length : 0} emails for account ${accountId}`);
        
        res.json(emails);
    } catch (error) {
        console.error('Error loading emails:', error);
        res.status(500).json({ error: 'Failed to load emails' });
    }
});

// Get filtered emails from specific account
app.get('/api/emails/:accountId/filtered', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const filterOptions = req.query;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        const emails = await gmailService.getFilteredEmails(tokens, filterOptions);
        res.json(emails);
    } catch (error) {
        console.error('Error loading filtered emails:', error);
        res.status(500).json({ error: 'Failed to load filtered emails' });
    }
});

// Get urgent emails from specific account using AI
app.get('/api/emails/:accountId/urgent', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { maxResults = 25 } = req.query;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        // Use categorized emails instead of urgent to avoid AI processing issues
        const result = await gmailService.getCategorizedEmails(tokens, parseInt(maxResults));
        res.json(result);
    } catch (error) {
        console.error('Error loading categorized emails:', error);
        res.status(500).json({ error: 'Failed to load categorized emails' });
    }
});

// Get categorized emails from specific account
app.get('/api/emails/:accountId/categorized', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { maxResults = 50 } = req.query;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        const emails = await gmailService.getCategorizedEmails(tokens, parseInt(maxResults));
        res.json(emails);
    } catch (error) {
        console.error('Error loading categorized emails:', error);
        res.status(500).json({ error: 'Failed to load categorized emails' });
    }
});

// Get subinboxes from specific account
app.get('/api/emails/:accountId/subinboxes', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { maxResults = 50 } = req.query;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        const subinboxes = await gmailService.getSubinboxes(tokens, parseInt(maxResults));
        res.json(subinboxes);
    } catch (error) {
        console.error('Error loading subinboxes:', error);
        res.status(500).json({ error: 'Failed to load subinboxes' });
    }
});

// Search emails in specific account
app.get('/api/emails/:accountId/search', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { query } = req.query;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        const emails = await gmailService.searchEmails(tokens, query);
        res.json({ emails });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search emails' });
    }
});

// Get specific email from account (this must come after the specific routes)
app.get('/api/emails/:accountId/:emailId', requireAuth, async (req, res) => {
    try {
        const { accountId, emailId } = req.params;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        const email = await gmailService.getEmailById(tokens, emailId);
        res.json(email);
    } catch (error) {
        console.error('Error loading email:', error);
        res.status(500).json({ error: 'Failed to load email' });
    }
});

// Process email with AI
app.post('/api/emails/:accountId/:emailId/process', requireAuth, async (req, res) => {
    try {
        const { accountId, emailId } = req.params;
        const { action } = req.body;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        const email = await gmailService.getEmailById(tokens, emailId);
        const result = await chatgptService.processEmail(email, action);
        
        res.json({ result });
    } catch (error) {
        console.error('AI processing error:', error);
        res.status(500).json({ error: 'Failed to process email with AI' });
    }
});

// Send reply from specific account
app.post('/api/emails/:accountId/:emailId/reply', requireAuth, async (req, res) => {
    try {
        const { accountId, emailId } = req.params;
        const { content } = req.body;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        await gmailService.sendReply(tokens, emailId, content);
        res.json({ success: true });
    } catch (error) {
        console.error('Send reply error:', error);
        res.status(500).json({ error: 'Failed to send reply' });
    }
});

// Batch process emails with AI
app.post('/api/emails/:accountId/batch-process', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { emailIds, action } = req.body;
        
        if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
            return res.status(400).json({ error: 'Email IDs array is required' });
        }
        
        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }

        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        // Get full email details for batch processing
        const emails = await gmailService.batchProcessEmails(tokens, emailIds);
        
        // Process each email with AI
        const results = await chatgptService.batchProcessEmails(emails, action);
        
        res.json({ results });
    } catch (error) {
        console.error('Batch AI processing error:', error);
        res.status(500).json({ error: 'Failed to batch process emails with AI' });
    }
});

// Smart inbox filtering with AI
app.post('/api/emails/:accountId/smart-filter', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { filterType, maxResults = 10 } = req.body;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        // Get recent emails
        const emailData = await gmailService.getEmails(tokens, null, maxResults);
        const emails = emailData.emails;
        
        // Process each email with AI filtering
        const filteredResults = [];
        
        for (const email of emails) {
            try {
                // Get full email content for AI processing
                const fullEmail = await gmailService.getEmailById(tokens, email.id);
                
                let aiResult;
                switch (filterType) {
                    case 'priority':
                        aiResult = await chatgptService.processEmail(fullEmail, 'priority_score');
                        break;
                    case 'categorize':
                        aiResult = await chatgptService.processEmail(fullEmail, 'smart_categorize');
                        break;
                    case 'filter':
                        aiResult = await chatgptService.processEmail(fullEmail, 'filter_inbox');
                        break;
                    default:
                        aiResult = await chatgptService.processEmail(fullEmail, 'filter_inbox');
                }
                
                filteredResults.push({
                    email: email,
                    aiAnalysis: aiResult.result
                });
            } catch (error) {
                console.error(`Error processing email ${email.id}:`, error);
                filteredResults.push({
                    email: email,
                    aiAnalysis: { error: 'Failed to process with AI' }
                });
            }
        }
        
        res.json({ 
            filteredEmails: filteredResults,
            totalProcessed: filteredResults.length
        });
    } catch (error) {
        console.error('Smart filtering error:', error);
        res.status(500).json({ error: 'Failed to perform smart filtering' });
    }
});

// Get email statistics and insights
app.get('/api/emails/:accountId/insights', requireAuth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { days = 7 } = req.query;
        
        const tokens = await userService.getGmailTokens(req.user.userId, accountId);
        if (!tokens) {
            return res.status(404).json({ error: 'Gmail account not found' });
        }

        // Get emails from the last N days
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - parseInt(days));
        const filterOptions = {
            date: dateFilter.toISOString().split('T')[0],
            maxResults: 50
        };
        
        const emailData = await gmailService.getFilteredEmails(tokens, filterOptions);
        const emails = emailData.emails;
        
        // Analyze emails with AI for insights
        const insights = {
            totalEmails: emails.length,
            categories: {},
            priorityDistribution: {},
            topSenders: {},
            averagePriority: 0,
            urgentEmails: 0,
            recommendations: []
        };
        
        let totalPriority = 0;
        let processedCount = 0;
        
        for (const email of emails.slice(0, 10)) { // Process first 10 for insights
            try {
                const fullEmail = await gmailService.getEmailById(tokens, email.id);
                const priorityResult = await chatgptService.processEmail(fullEmail, 'priority_score');
                const categoryResult = await chatgptService.processEmail(fullEmail, 'smart_categorize');
                
                const priority = priorityResult.result.priority_score || 5;
                const category = categoryResult.result.primary_category || 'other';
                const sender = email.from.split('<')[0].trim();
                
                totalPriority += priority;
                processedCount++;
                
                // Count categories
                insights.categories[category] = (insights.categories[category] || 0) + 1;
                
                // Count priority levels
                const priorityLevel = priority >= 8 ? 'high' : priority >= 5 ? 'medium' : 'low';
                insights.priorityDistribution[priorityLevel] = (insights.priorityDistribution[priorityLevel] || 0) + 1;
                
                // Count senders
                insights.topSenders[sender] = (insights.topSenders[sender] || 0) + 1;
                
                // Count urgent emails
                if (priority >= 8) {
                    insights.urgentEmails++;
                }
                
            } catch (error) {
                console.error(`Error analyzing email ${email.id}:`, error);
            }
        }
        
        if (processedCount > 0) {
            insights.averagePriority = Math.round(totalPriority / processedCount);
        }
        
        // Generate recommendations
        if (insights.urgentEmails > 0) {
            insights.recommendations.push(`You have ${insights.urgentEmails} urgent emails that need immediate attention.`);
        }
        
        const topCategory = Object.keys(insights.categories).reduce((a, b) => 
            insights.categories[a] > insights.categories[b] ? a : b
        );
        insights.recommendations.push(`Most of your emails are ${topCategory}-related.`);
        
        res.json(insights);
    } catch (error) {
        console.error('Email insights error:', error);
        res.status(500).json({ error: 'Failed to generate email insights' });
    }
});

// (Removed duplicate /api/emails/filter route defined earlier)

// Serve the main application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Only start server if not being required by Electron
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MailMate server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
  });
} 