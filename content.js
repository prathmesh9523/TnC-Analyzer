// content.js - Web Scraper for Terms & Conditions
// This script runs on every webpage and extracts T&C content

console.log('T&C Analyzer: Content script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === "extractTerms") {
    console.log('T&C Analyzer: Starting extraction...');
    
    try {
      const termsText = extractTermsAndConditions();
      
      if (termsText && termsText.length > 100) {
        console.log('T&C Analyzer: Successfully extracted', termsText.length, 'characters');
        sendResponse({ 
          success: true, 
          text: termsText,
          wordCount: termsText.split(/\s+/).length
        });
      } else {
        console.log('T&C Analyzer: No substantial content found');
        sendResponse({ 
          success: false, 
          error: "Could not find Terms & Conditions content on this page. Please navigate to the T&C page first." 
        });
      }
    } catch (error) {
      console.error('T&C Analyzer: Extraction error', error);
      sendResponse({ 
        success: false, 
        error: "Error extracting content: " + error.message 
      });
    }
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "findTCLink") {
    const tcLink = findTermsLink();
    sendResponse({ success: true, link: tcLink });
    return true;
  }
});

// Main extraction function
function extractTermsAndConditions() {
  console.log('T&C Analyzer: Attempting to extract content...');
  
  // Strategy 1: Look for common T&C container elements
  const commonSelectors = [
    // Specific T&C containers
    '[class*="terms"]',
    '[class*="conditions"]',
    '[id*="terms"]',
    '[id*="conditions"]',
    '[class*="legal"]',
    '[id*="legal"]',
    '[class*="agreement"]',
    '[id*="agreement"]',
    '[class*="policy"]',
    
    // Semantic HTML
    'article',
    'main',
    '[role="main"]',
    '.content',
    '#content',
    '.main-content',
    '#main-content',
    
    // Common CMS patterns
    '.post-content',
    '.entry-content',
    '.page-content',
    '.document-content'
  ];
  
  // Try each selector
  for (let selector of commonSelectors) {
    const elements = document.querySelectorAll(selector);
    
    for (let element of elements) {
      const text = cleanText(element.innerText || element.textContent);
      
      // Check if this looks like T&C content
      if (isLikelyTermsContent(text)) {
        console.log('T&C Analyzer: Found content using selector:', selector);
        return text;
      }
    }
  }
  
  // Strategy 2: Look for paragraphs with legal language
  const allParagraphs = document.querySelectorAll('p, div, section');
  let combinedText = '';
  let legalParagraphCount = 0;
  
  for (let el of allParagraphs) {
    const text = cleanText(el.innerText || el.textContent);
    
    if (text.length > 50 && containsLegalLanguage(text)) {
      combinedText += text + '\n\n';
      legalParagraphCount++;
    }
  }
  
  if (legalParagraphCount >= 5 && combinedText.length > 500) {
    console.log('T&C Analyzer: Found content using legal language detection');
    return combinedText;
  }
  
  // Strategy 3: Fallback to body (filter out navigation/footer)
  console.log('T&C Analyzer: Using fallback extraction');
  return extractBodyContent();
}

// Check if text looks like Terms & Conditions
function isLikelyTermsContent(text) {
  if (text.length < 500) return false;
  
  const termsKeywords = [
    'terms and conditions',
    'terms of service',
    'terms of use',
    'user agreement',
    'service agreement',
    'license agreement',
    'acceptable use',
    'you agree',
    'we reserve the right',
    'prohibited',
    'intellectual property',
    'liability',
    'indemnification'
  ];
  
  const lowerText = text.toLowerCase();
  let matchCount = 0;
  
  for (let keyword of termsKeywords) {
    if (lowerText.includes(keyword)) {
      matchCount++;
    }
  }
  
  return matchCount >= 3;
}

// Check if text contains legal language
function containsLegalLanguage(text) {
  const legalPatterns = [
    /you agree/i,
    /we reserve/i,
    /shall not/i,
    /hereby/i,
    /pursuant to/i,
    /notwithstanding/i,
    /indemnify/i,
    /liability/i,
    /intellectual property/i,
    /governing law/i
  ];
  
  return legalPatterns.some(pattern => pattern.test(text));
}

// Clean extracted text
function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ')              // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n')       // Normalize line breaks
    .trim();
}

// Extract body content, excluding navigation and footer
function extractBodyContent() {
  const body = document.body.cloneNode(true);
  
  // Remove unwanted elements
  const unwantedSelectors = [
    'nav', 'header', 'footer', 
    '[role="navigation"]', 
    '[role="banner"]',
    '[role="contentinfo"]',
    '.nav', '.navigation', '.menu',
    '.header', '.footer',
    '.sidebar', '.ad', '.advertisement',
    'script', 'style', 'noscript'
  ];
  
  unwantedSelectors.forEach(selector => {
    body.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  return cleanText(body.innerText || body.textContent);
}

// Find T&C link on the page
function findTermsLink() {
  const links = document.querySelectorAll('a');
  
  const termsPatterns = [
    /terms.*conditions/i,
    /terms.*service/i,
    /terms.*use/i,
    /user.*agreement/i,
    /legal/i
  ];
  
  for (let link of links) {
    const linkText = (link.innerText || link.textContent).toLowerCase();
    const href = (link.href || '').toLowerCase();
    
    for (let pattern of termsPatterns) {
      if (pattern.test(linkText) || pattern.test(href)) {
        return link.href;
      }
    }
  }
  
  return null;
}

// Helper: Log extraction attempts for debugging
console.log('T&C Analyzer: Content script ready');
