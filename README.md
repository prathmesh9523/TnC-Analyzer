# T&C Analyzer - Chrome Extension

Automatically reads and summarizes Terms & Conditions, highlighting risky clauses.

## 📋 Installation

### Step 1: Get API Key

**Option A: Gemini API (Recommended - Free)**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy your API key

**Option B: OpenAI API**
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy your API key

### Step 2: Setup Extension

1. Download/clone this extension folder
2. Open `popup.js` in a text editor
3. Find the `CONFIG` object (line 21)
4. Paste your API key:


### Step 3: Load Extension in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension folder
6. Extension icon appears in toolbar!

### Step 4: Create Icons (Optional)

Create three PNG icons in `icons/` folder:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

Or use placeholder icons temporarily.

## 🚀 Usage

1. Navigate to any website with Terms & Conditions
2. Click the extension icon
3. Click "Analyze Terms & Conditions"
4. Wait 5-10 seconds for AI analysis
5. Review the summary, risks, and obligations!

## 🛠️ Troubleshooting

**"Could not find Terms & Conditions"**
- Make sure you're on the T&C page (not homepage)
- Try clicking "Analyze T&C Link" instead

**"API Error"**
- Check your API key is correct
- Verify you have API credits/quota remaining
- Check your internet connection

**Extension not loading**
- Check Chrome DevTools console for errors
- Ensure all files are in the correct folder
- Try reloading the extension

## 📁 File Structure

tc-analyzer-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── background.js
├── icons/
│ ├── icon16.png
│ ├── icon48.png
│ └── icon128.png
└── README.md


## 🎯 Features

✅ Automatic T&C extraction
✅ AI-powered summarization
✅ Risk level assessment
✅ Risky clause detection
✅ Key obligations highlighting
✅ Export summary as text
✅ Works on any website

## 🔒 Privacy

- Extension only processes content when you click "Analyze"
- T&C text is sent to AI provider (Gemini/OpenAI) for analysis
- No data is stored or shared with third parties
- Analysis results are not saved permanently

## 📝 License

MIT License - Feel free to modify and distribute
