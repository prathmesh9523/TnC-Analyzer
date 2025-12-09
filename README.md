# 📜 T&C Analyzer - Chrome Extension

> An intelligent Chrome extension that analyzes Terms & Conditions using AI to identify risks, hidden clauses, and user obligations in seconds.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow.svg)

---

## 🌟 Features

- **🔍 Instant Analysis** - Analyze any Terms & Conditions page with one click
- **⚠️ Risk Assessment** - Get LOW/MEDIUM/HIGH risk ratings for any T&C document
- **🎯 Smart Detection** - Identifies dangerous clauses like:
  - Automatic renewals and hidden billing
  - Data sharing with third parties
  - Liability waivers and disclaimers
  - Binding arbitration clauses
  - Hidden fees and charges
  - Account termination conditions
- **📊 Clear Summaries** - Get 3-5 bullet point summaries in plain English
- **✅ Obligations Tracker** - See exactly what you're agreeing to do
- **💾 Export Results** - Save analysis as text file for future reference
- **🔄 Dual AI Support** - Choose between Perplexity Sonar Pro or Google Gemini
- **🎨 Modern UI** - Clean, intuitive interface with color-coded risk indicators

---

## 🚀 Tech Stack

### Frontend
- **HTML5** - Popup interface structure
- **CSS3** - Modern gradient design with animations
- **JavaScript (ES6+)** - Core extension logic

### AI Models
- **Perplexity Sonar Pro** - Primary AI model (~$0.01/analysis)
- **Google Gemini 2.5 Flash** - Free backup option (10 RPM, 250/day)

### APIs & Tools
- **Chrome Extension APIs** - Tabs, Scripting, Storage
- **Fetch API** - API communication
- **DOMParser** - Content extraction
- **Regex** - Advanced parsing

---

## 📦 Installation

### Option 1: Load Unpacked (Development)

1. **Download the Extension**
git clone https://github.com/yourusername/tc-analyzer.git
cd tc-analyzer


2. **Open Chrome Extensions**
- Navigate to `chrome://extensions/`
- Enable **Developer mode** (toggle in top-right)

3. **Load Extension**
- Click **Load unpacked**
- Select the project folder
- Extension icon appears in toolbar

4. **Configure API Key** (see Configuration section below)

### Option 2: Chrome Web Store (Coming Soon)
*Extension will be available on Chrome Web Store after review*

---

## ⚙️ Configuration

### Get Perplexity API Key (Recommended)

1. Visit https://www.perplexity.ai/settings/api
2. Subscribe to Perplexity Pro ($20/month, includes $5 API credit)
3. Generate API key (starts with `pplx-`)
4. Open `popup.js` and update:
const CONFIG = {
PERPLEXITY_API_KEY: 'pplx-your-actual-key-here', // ⬅️ Add your key
USE_PERPLEXITY: true,
USE_GEMINI: false
};


### Alternative: Get Gemini API Key (Free)

1. Visit https://aistudio.google.com/apikey
2. Sign in with Google account
3. Create new API key
4. Open `popup.js` and update:

const CONFIG = {
GEMINI_API_KEY: 'AIzaSy-your-actual-key-here', // ⬅️ Add your key
USE_PERPLEXITY: false,
USE_GEMINI: true
};


### Model Comparison

| Feature | Perplexity Sonar Pro | Gemini 2.5 Flash |
|---------|---------------------|------------------|
| **Cost** | ~$0.01/analysis | Free |
| **Rate Limit** | High (paid tier) | 10 requests/min |
| **Daily Limit** | High | 250 requests/day |
| **Consistency** | Excellent ⭐⭐⭐⭐⭐ | Very Good ⭐⭐⭐⭐ |
| **JSON Output** | Reliable | Reliable |

---

## 🎯 Usage

### Analyze Current Page

1. **Navigate** to any Terms & Conditions page
   - Example: https://www.google.com/policies/terms/
2. **Click** the extension icon in toolbar
3. **Click** "Analyze This Page" button
4. **Wait** 2-5 seconds for AI analysis
5. **Review** the results:
   - Risk level indicator (color-coded)
   - Quick summary points
   - Risky clauses with explanations
   - Your obligations

### Analyze via Link

1. **Go to** any website (e.g., homepage)
2. **Click** extension icon
3. **Click** "Find & Analyze T&C Link"
4. Extension automatically finds and analyzes T&C

### Export Analysis

1. **Complete** an analysis
2. **Click** "Export Summary" button
3. **Save** the .txt file with timestamp

---

## 📂 Project Structure

tc-analyzer/
├── manifest.json # Extension configuration
├── popup.html # Main popup interface
├── popup.css # Styling and animations
├── popup.js # Core logic and AI integration
├── content.js # Content script for page interaction
├── icons/ # Extension icons (16x16, 48x48, 128x128)
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png
└── README.md # This file


---

## 🔧 How It Works

### Architecture
| Layer                 | Component                         | Responsibilities                                                                                             |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **1. User (Browser)** | User interacts via Chrome toolbar | - Clicks “Analyze This Page” or “Find & Analyze T&C Link”                                                    |
| **2. UI Layer**       | `popup.html`                      | - Displays UI<br> - Shows risk indicators<br> - Displays summary & results<br> - Handles export              |
| **3. Logic Layer**    | `popup.js`                        | - `analyzeCurrentPage()`<br> - `analyzeWithAI()`<br> - `parseAIResponse()`<br> - Manages API calls & parsing |
| **4. Content Script** | `content.js`                      | - Extracts webpage text<br> - Removes ads, navigation, irrelevant content                                    |
| **5. AI Backend**     | Perplexity / Gemini APIs          | - Receives extracted text<br> - Performs T&C risk analysis<br> - Returns structured JSON                     |



### Workflow

1. **Content Extraction**
   - `content.js` extracts text from webpage
   - Filters out navigation, ads, and scripts
   - Returns clean T&C content

2. **AI Analysis**
   - Text sent to Perplexity/Gemini API
   - AI analyzes for risks and obligations
   - Returns structured JSON response

3. **Parsing & Validation**
   - 5-method robust parser handles any format
   - Validates JSON structure
   - Fixes missing or malformed data

4. **UI Display**
   - Color-coded risk indicators
   - Organized sections for easy reading
   - Export functionality

---

## 💰 Cost Breakdown

### Using Perplexity Sonar Pro

| Usage | Cost |
|-------|------|
| Per Analysis | ~$0.01 - $0.02 |
| 100 Analyses | ~$1 - $2 |
| Monthly (50 analyses) | ~$0.50 - $1 |
| Pro Subscription | $20/month (includes $5 credit) |

**Estimated**: 250-500 analyses with $5 credit

### Using Gemini 2.5 Flash

| Tier | Rate Limit | Daily Limit | Cost |
|------|-----------|-------------|------|
| Free | 10 requests/min | 20 requests/day | $0 |

---

## 🐛 Troubleshooting

### "Cannot access this page"
- **Solution**: Extension can't access `chrome://` pages. Navigate to a regular website.

### "Rate limit exceeded"
- **Solution**: Wait 6-30 seconds between analyses depending on your API tier.

### "Invalid API key"
- **Solution**: Check your API key in `popup.js` CONFIG section.

### "Failed to parse AI analysis"
- **Solution**: Already handled by 5-method parser. If persists, check console logs (F12).

### Extension icon not showing
- **Solution**: Reload extension in `chrome://extensions/`

---

## 🎨 Screenshots

### Main Interface
┌─────────────────────────────────┐
│ 📜 T&C Analyzer │
├─────────────────────────────────┤
│ │
│ [Analyze This Page] │
│ [Find & Analyze T&C Link] │
│ │
└─────────────────────────────────┘


### Analysis Results
┌─────────────────────────────────┐
│ Risk Assessment │
│ 🚦 HIGH RISK │
├─────────────────────────────────┤
│ 📋 Quick Summary │
│ - Automatic renewal billing │
│ - Data shared with partners │
│ - Limited refund policy │
├─────────────────────────────────┤
│ ⚠️ Risky Clauses │
│ [Details with explanations] │
├─────────────────────────────────┤
│ ✅ Your Obligations │
│ [List of requirements] │
└─────────────────────────────────┘


---

## 🚧 Future Enhancements

- [ ] **Side-by-Side Comparison** - Compare T&Cs from multiple services
- [ ] **Analysis History** - Save and review past analyses
- [ ] **In-Page Highlighting** - Highlight risky text directly on webpage
- [ ] **PDF Support** - Analyze T&C PDF documents
- [ ] **Browser Action Badge** - Show risk level on extension icon
- [ ] **Dark Mode** - Theme toggle for better UX
- [ ] **Multi-Language** - Support for non-English T&Cs
- [ ] **Notification System** - Alert when T&C changes
- [ ] **Chrome Web Store Publication** - Official release
- [ ] **Firefox Port** - Cross-browser compatibility

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch
git checkout -b feature/amazing-feature
3. **Commit** your changes
git commit -m 'Add amazing feature'
4. **Push** to the branch
git push origin feature/amazing-feature
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test with multiple T&C pages
- Update README for new features

---

## 📝 License

This project is licensed under the MIT License - see below for details:

