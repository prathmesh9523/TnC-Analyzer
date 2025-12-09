// popup.js - Main logic for T&C Analyzer extension

// DOM Elements
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeLinkBtn = document.getElementById('analyzeLinkBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const exportBtn = document.getElementById('exportBtn');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const settingsBtn = document.getElementById('settingsBtn');

// Results elements
const riskIndicator = document.getElementById('riskIndicator');
const summaryContent = document.getElementById('summaryContent');
const riskyContent = document.getElementById('riskyContent');
const obligationsContent = document.getElementById('obligationsContent');

// Configuration
const CONFIG = {
  GEMINI_API_KEY: 'AIzaSyB04jJ-2ofokkyjN4_c8W0hIDMMhy3q1yg',
  PERPLEXITY_API_KEY: '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', // Add your Perplexity API key here
  USE_PERPLEXITY: true, // Set to true to use Perplexity (default now)
  USE_GEMINI: false, // Set to true to use Gemini instead
  MAX_TEXT_LENGTH: 8000
};

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 6000; // 6 seconds cooldown

// Event Listeners
analyzeBtn.addEventListener('click', analyzeCurrentPage);
analyzeLinkBtn.addEventListener('click', analyzeTCLink);
retryBtn.addEventListener('click', analyzeCurrentPage);
exportBtn.addEventListener('click', exportSummary);
newAnalysisBtn.addEventListener('click', resetToHome);
settingsBtn.addEventListener('click', openSettings);

// Main function: Analyze current page
async function analyzeCurrentPage() {
  console.log('Analyzing current page...');
  
  // Check rate limit
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
    showError(`Please wait ${waitTime} seconds before analyzing again.`);
    return;
  }
  
  showLoading();
  
  try {
    // Step 1: Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we can access this page
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
      showError('Cannot analyze this page. Please navigate to a regular website with Terms & Conditions.');
      return;
    }
    
    // Step 2: Try to inject content script if not already loaded
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('Content script injected');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (injectError) {
      console.log('Content script already loaded or injection failed:', injectError.message);
    }
    
    // Step 3: Extract T&C content from page
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: "extractTerms" });
    } catch (msgError) {
      showError('Cannot access this page. Please make sure you are on a webpage with Terms & Conditions content.');
      return;
    }
    
    if (!response || !response.success) {
      showError(response?.error || 'Could not extract content from this page.');
      return;
    }
    
    console.log('Extracted', response.wordCount, 'words');
    
    // Step 4: Truncate if too long
    let text = response.text;
    if (text.length > CONFIG.MAX_TEXT_LENGTH) {
      text = text.substring(0, CONFIG.MAX_TEXT_LENGTH) + '...';
      console.log('Truncated to', CONFIG.MAX_TEXT_LENGTH, 'characters');
    }
    
    // Step 5: Send to AI for analysis
    lastRequestTime = Date.now(); // Update request time
    const analysis = await analyzeWithAI(text);
    
    // Step 6: Display results
    displayResults(analysis);
    
  } catch (error) {
    console.error('Error:', error);
    showError('An error occurred: ' + error.message);
  }
}

// Analyze T&C from a link
async function analyzeTCLink() {
  // Check rate limit
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
    showError(`Please wait ${waitTime} seconds before analyzing again.`);
    return;
  }
  
  showLoading();
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showError('Cannot analyze chrome:// pages. Please navigate to a regular website first.');
      return;
    }
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (injectError) {
      console.log('Content script inject note:', injectError.message);
    }
    
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: "findTCLink" });
    } catch (msgError) {
      showError('Cannot access this page. Please navigate to a regular website first.');
      return;
    }
    
    if (!response || !response.link) {
      showError('Could not find a Terms & Conditions link on this page.');
      return;
    }
    
    console.log('Found T&C link:', response.link);
    
    const text = await fetchPageContent(response.link);
    
    lastRequestTime = Date.now();
    const analysis = await analyzeWithAI(text);
    
    displayResults(analysis);
    
  } catch (error) {
    console.error('Error:', error);
    showError('Error: ' + error.message);
  }
}

// Fetch content from a URL
async function fetchPageContent(url) {
  const response = await fetch(url);
  const html = await response.text();
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let text = doc.body.innerText;
  
  if (text.length > CONFIG.MAX_TEXT_LENGTH) {
    text = text.substring(0, CONFIG.MAX_TEXT_LENGTH);
  }
  
  return text;
}

// Send text to AI for analysis
async function analyzeWithAI(text) {
  console.log('Sending to AI for analysis...');
  
  if (CONFIG.USE_PERPLEXITY) {
    console.log('🔍 Using Perplexity Sonar Pro');
    return await analyzeWithPerplexity(text);
  } else if (CONFIG.USE_GEMINI) {
    console.log('🔮 Using Gemini 2.5 Flash');
    return await analyzeWithGemini(text);
  } else {
    throw new Error('No AI model configured. Please set USE_PERPLEXITY or USE_GEMINI to true.');
  }
}

// Perplexity API integration - Sonar Pro model
async function analyzeWithPerplexity(text) {
  const prompt = `You are a legal expert analyzing Terms & Conditions documents.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, just the JSON object.

Required JSON format:
{
  "risk_level": "LOW",
  "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "risky_clauses": [
    {"clause": "clause description", "risk": "HIGH", "explanation": "why it's risky"}
  ],
  "obligations": ["obligation 1", "obligation 2", "obligation 3"]
}

Analysis requirements:
1. risk_level: Must be exactly "LOW", "MEDIUM", or "HIGH"
2. summary: 3-5 clear bullet points explaining the terms in simple language
3. risky_clauses: Identify concerning terms:
   - Automatic renewals and hidden billing
   - Data sharing with third parties
   - Liability waivers and disclaimers
   - Hidden fees or unexpected charges
   - Binding arbitration clauses
   - Vague permissions or broad rights granted
   - Account termination conditions
   - Intellectual property transfers
4. obligations: What the user must do (pay, provide data, follow restrictions)

Analyze these Terms & Conditions:
${text}

Respond with ONLY the JSON object.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a legal expert who analyzes Terms & Conditions documents. Always respond with valid JSON only, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 2048,
        stream: false
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Perplexity API Error:', errorData);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      
      if (response.status === 401) {
        throw new Error('Invalid Perplexity API key. Please add your API key in CONFIG.PERPLEXITY_API_KEY');
      }
      
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Perplexity API Response:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from Perplexity API');
    }
    
    const aiResponse = data.choices[0].message.content;
    console.log('📝 Perplexity Response:', aiResponse);
    
    return parseAIResponse(aiResponse);
    
  } catch (error) {
    console.error('❌ Error calling Perplexity API:', error);
    throw error;
  }
}

// Gemini 2.5 Flash API integration - OPTIMIZED VERSION
async function analyzeWithGemini(text) {
  const prompt = `You are a legal expert analyzing Terms & Conditions documents.

CRITICAL INSTRUCTION: Respond with ONLY valid JSON. No markdown formatting, no code blocks, no explanations. Just the raw JSON object.

Required JSON format:
{
  "risk_level": "LOW",
  "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "risky_clauses": [
    {"clause": "clause description", "risk": "HIGH", "explanation": "why it's concerning"}
  ],
  "obligations": ["obligation 1", "obligation 2", "obligation 3"]
}

Analysis requirements:
1. risk_level: Must be exactly "LOW", "MEDIUM", or "HIGH"
2. summary: Provide 3-5 clear bullet points in simple language explaining what the terms say
3. risky_clauses: Identify concerning terms such as:
   - Automatic renewals and billing
   - Data sharing with third parties
   - Liability waivers and disclaimations
   - Hidden fees or charges
   - Binding arbitration clauses
   - Vague or broad permissions
   - Account termination conditions
   - Intellectual property rights transfers
4. obligations: List what the user must do (payments, restrictions, data sharing, etc.)

Terms & Conditions text to analyze:
${text}

Remember: Respond with ONLY the JSON object, nothing else.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': CONFIG.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      
      if (errorData.error?.code === 429) {
        throw new Error('Rate limit exceeded. Please wait a minute. Gemini 2.5 Flash: 10 requests per minute, 250 per day.');
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Full API Response:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('📝 AI Text Response:', aiResponse);
    
    return parseAIResponse(aiResponse);
    
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error);
    throw error;
  }
}

// SUPER ROBUST PARSER - handles all edge cases
function parseAIResponse(response) {
  console.log('🔍 Starting to parse AI response...');
  console.log('📄 Raw response:', response);
  
  // Remove any whitespace/newlines
  let cleaned = response.trim();
  
  try {
    // Method 1: Direct JSON parse
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.risk_level) {
        console.log('✅ Method 1: Parsed as direct JSON');
        return validateAndFix(parsed);
      }
    } catch (e) {
      console.log('❌ Method 1 failed:', e.message);
    }
    
    // Method 2: Remove markdown JSON code blocks
    let withoutMarkdown = cleaned.replace(/``````\s*/g, '').trim();
    
    try {
      const parsed = JSON.parse(withoutMarkdown);
      console.log('✅ Method 2: Parsed after removing markdown');
      return validateAndFix(parsed);
    } catch (e) {
      console.log('❌ Method 2 failed:', e.message);
    }
    
    // Method 3: Extract first { to last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('✅ Method 3: Parsed by extracting braces');
        return validateAndFix(parsed);
      } catch (e) {
        console.log('❌ Method 3 failed:', e.message);
      }
    }
    
    // Method 4: Try to fix common JSON syntax errors
    let fixed = cleaned
      .replace(/'/g, '"')                    // Replace single quotes with double
      .replace(/(\w+):/g, '"$1":')          // Add quotes to unquoted keys
      .replace(/,\s*}/g, '}')               // Remove trailing commas before }
      .replace(/,\s*]/g, ']')               // Remove trailing commas before ]
      .replace(/\n/g, ' ')                  // Remove newlines
      .replace(/\r/g, ' ')                  // Remove carriage returns
      .replace(/\t/g, ' ')                  // Remove tabs
      .replace(/\s+/g, ' ');                // Collapse multiple spaces
    
    try {
      const parsed = JSON.parse(fixed);
      console.log('✅ Method 4: Parsed after fixing syntax');
      return validateAndFix(parsed);
    } catch (e) {
      console.log('❌ Method 4 failed:', e.message);
    }
    
    // Method 5: Try parsing with regex extraction
    try {
      const riskMatch = response.match(/"risk_level"\s*:\s*"(LOW|MEDIUM|HIGH)"/i);
      const summaryMatch = response.match(/"summary"\s*:\s*\[(.*?)\]/s);
      const riskyMatch = response.match(/"risky_clauses"\s*:\s*\[(.*?)\]/s);
      const obligMatch = response.match(/"obligations"\s*:\s*\[(.*?)\]/s);
      
      if (riskMatch) {
        console.log('✅ Method 5: Using regex extraction');
        return {
          risk_level: riskMatch[1].toUpperCase(),
          summary: summaryMatch ? extractArray(summaryMatch[1]) : ['Analysis completed'],
          risky_clauses: riskyMatch ? extractRiskyClauses(riskyMatch[1]) : [],
          obligations: obligMatch ? extractArray(obligMatch[1]) : ['Review terms']
        };
      }
    } catch (e) {
      console.log('❌ Method 5 failed:', e.message);
    }
    
    // All parsing methods failed
    console.error('❌ ALL PARSING METHODS FAILED');
    throw new Error('Could not parse response in any format');
    
  } catch (error) {
    console.error('💥 Fatal parsing error:', error);
    console.error('📄 Original response:', response);
    
    // Emergency fallback with helpful error info
    return {
      risk_level: 'MEDIUM',
      summary: [
        '⚠️ AI returned an unexpected format',
        'Response received but could not be parsed properly',
        'Please try analyzing this page again',
        'If issue persists, check browser console (F12) for details'
      ],
      risky_clauses: [{
        clause: 'Parsing Error - See Console',
        risk: 'MEDIUM',
        explanation: 'Open browser console (F12) to see the full response. First 200 chars: ' + response.substring(0, 200)
      }],
      obligations: [
        'Review the terms manually',
        'Try analysis again in a few seconds',
        'Check console logs for debugging'
      ]
    };
  }
}

// Helper: Extract array from string
function extractArray(str) {
  try {
    const items = str.match(/"([^"]+)"/g);
    if (items) {
      return items.map(item => item.replace(/"/g, '').trim());
    }
    return str.split(',').map(s => s.trim().replace(/["\[\]]/g, ''));
  } catch (e) {
    return ['Could not extract items'];
  }
}

// Helper: Extract risky clauses objects
function extractRiskyClauses(str) {
  try {
    const clauses = [];
    const objRegex = /\{[^}]+\}/g;
    const matches = str.match(objRegex);
    
    if (matches) {
      matches.forEach(match => {
        try {
          const obj = JSON.parse(match);
          clauses.push(obj);
        } catch (e) {
          // Skip invalid objects
        }
      });
    }
    
    return clauses.length > 0 ? clauses : [{ clause: 'See details', risk: 'MEDIUM', explanation: 'Could not parse risk details' }];
  } catch (e) {
    return [{ clause: 'Parsing error', risk: 'MEDIUM', explanation: 'Could not extract risk information' }];
  }
}

// Validate and fix the parsed object structure
function validateAndFix(obj) {
  console.log('🔧 Validating and fixing structure...');
  
  // Ensure all required fields exist
  if (!obj.risk_level || typeof obj.risk_level !== 'string') {
    obj.risk_level = 'MEDIUM';
    console.log('⚠️ Fixed: risk_level was missing or invalid');
  }
  
  if (!obj.summary || !Array.isArray(obj.summary) || obj.summary.length === 0) {
    obj.summary = ['Terms & Conditions analysis completed', 'Please review carefully'];
    console.log('⚠️ Fixed: summary was missing or invalid');
  }
  
  if (!obj.risky_clauses || !Array.isArray(obj.risky_clauses)) {
    obj.risky_clauses = [];
    console.log('⚠️ Fixed: risky_clauses was missing or invalid');
  }
  
  if (!obj.obligations || !Array.isArray(obj.obligations) || obj.obligations.length === 0) {
    obj.obligations = ['Review the terms and conditions carefully'];
    console.log('⚠️ Fixed: obligations was missing or invalid');
  }
  
  // Normalize risk_level to uppercase
  obj.risk_level = obj.risk_level.toUpperCase();
  
  // Validate risk_level is one of the allowed values
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(obj.risk_level)) {
    console.log('⚠️ Invalid risk_level:', obj.risk_level, '- defaulting to MEDIUM');
    obj.risk_level = 'MEDIUM';
  }
  
  // Ensure risky_clauses have proper structure
  obj.risky_clauses = obj.risky_clauses.map(item => {
    if (!item || typeof item !== 'object') {
      return { clause: 'Invalid clause', risk: 'MEDIUM', explanation: 'Data structure error' };
    }
    return {
      clause: item.clause || 'Unspecified clause',
      risk: (item.risk || 'MEDIUM').toUpperCase(),
      explanation: item.explanation || 'No explanation provided'
    };
  });
  
  // Limit arrays to reasonable sizes
  if (obj.summary.length > 10) {
    obj.summary = obj.summary.slice(0, 10);
  }
  if (obj.risky_clauses.length > 15) {
    obj.risky_clauses = obj.risky_clauses.slice(0, 15);
  }
  if (obj.obligations.length > 10) {
    obj.obligations = obj.obligations.slice(0, 10);
  }
  
  // Remove empty strings
  obj.summary = obj.summary.filter(s => s && s.trim().length > 0);
  obj.obligations = obj.obligations.filter(o => o && o.trim().length > 0);
  
  console.log('✅ Validation complete. Final structure:', obj);
  return obj;
}

// Display results in the UI
function displayResults(analysis) {
  console.log('🎨 Displaying results:', analysis);
  
  // Hide loading, show results
  loadingSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  errorSection.classList.add('hidden');
  
  // Risk Level
  const riskLevel = analysis.risk_level.toUpperCase();
  riskIndicator.textContent = `🚦 ${riskLevel} RISK`;
  riskIndicator.className = 'risk-indicator risk-' + riskLevel.toLowerCase();
  
  // Summary
  summaryContent.innerHTML = '<ul>' + 
    analysis.summary.map(point => `<li>${escapeHtml(point)}</li>`).join('') +
    '</ul>';
  
  // Risky Clauses
  if (analysis.risky_clauses && analysis.risky_clauses.length > 0) {
    riskyContent.innerHTML = analysis.risky_clauses.map(item => `
      <div class="risk-item ${item.risk.toLowerCase()}">
        <strong>${escapeHtml(item.clause)}</strong><br>
        <small>${escapeHtml(item.explanation)}</small>
      </div>
    `).join('');
  } else {
    riskyContent.innerHTML = '<p>✅ No major risks identified</p>';
  }
  
  // Obligations
  obligationsContent.innerHTML = '<ul>' +
    analysis.obligations.map(item => `<li>${escapeHtml(item)}</li>`).join('') +
    '</ul>';
}

// UI State Management
function showLoading() {
  loadingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  document.querySelector('.action-section').classList.add('hidden');
}

function showError(message) {
  errorText.textContent = message;
  errorSection.classList.remove('hidden');
  loadingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  document.querySelector('.action-section').classList.add('hidden');
}

function resetToHome() {
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  document.querySelector('.action-section').classList.remove('hidden');
}

// Export functionality
function exportSummary() {
  const summary = document.getElementById('resultsSection').innerText;
  const blob = new Blob([summary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tc-analysis-' + new Date().getTime() + '.txt';
  a.click();
  
  URL.revokeObjectURL(url);
}

// Settings
function openSettings() {
  const currentModel = CONFIG.USE_PERPLEXITY ? 'Perplexity Sonar Pro (~$0.01/analysis)' 
                     : CONFIG.USE_GEMINI ? 'Gemini 2.5 Flash (Free: 10 RPM, 250/day)'
                     : 'No model selected';
  
  alert('T&C Analyzer Settings\n\n' +
        `Current Model: ${currentModel}\n\n` +
        'Available Models:\n' +
        '  ✅ Perplexity Sonar Pro - Most consistent, ~$0.01 per analysis\n' +
        '  ✅ Gemini 2.5 Flash - Free tier: 10 requests/min, 250/day\n\n' +
        'To switch models, edit CONFIG in popup.js:\n' +
        '  USE_PERPLEXITY: true/false\n' +
        '  USE_GEMINI: true/false\n\n' +
        'API Keys:\n' +
        '  Perplexity: Get at https://www.perplexity.ai/settings/api\n' +
        '  Gemini: Get at https://aistudio.google.com/apikey');
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
console.log('🚀 T&C Analyzer loaded');
if (CONFIG.USE_PERPLEXITY) {
  console.log('🔍 Using Perplexity Sonar Pro');
  console.log('💰 Cost: ~$0.01 per analysis');
} else if (CONFIG.USE_GEMINI) {
  console.log('🔮 Using Gemini 2.5 Flash');
  console.log('⚡ Rate limit: 10 requests per minute (6 second cooldown)');
} else {
  console.log('⚠️ No AI model configured! Set USE_PERPLEXITY or USE_GEMINI to true.');
}
