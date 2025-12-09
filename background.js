// background.js - Service worker for background tasks

console.log('T&C Analyzer: Background service worker started');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('T&C Analyzer installed!');
    
    // Set default settings
    chrome.storage.local.set({
      apiProvider: 'gemini',
      autoDetect: true,
      maxTextLength: 8000
    });
    
    // Create context menu (only once during installation)
    chrome.contextMenus.create({
      id: 'analyzeTCMenu',
      title: 'Analyze Terms & Conditions',
      contexts: ['page']
    });
  }
  
  if (details.reason === 'update') {
    console.log('T&C Analyzer updated!');
  }
});

// Cache for analyzed T&Cs (to avoid re-processing same content)
const analysisCache = new Map();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'cacheAnalysis') {
    const url = request.url;
    const analysis = request.analysis;
    
    // Cache for 1 hour
    analysisCache.set(url, {
      data: analysis,
      timestamp: Date.now()
    });
    
    console.log('Cached analysis for:', url);
    sendResponse({ success: true });
  }
  
  if (request.action === 'getCachedAnalysis') {
    const url = request.url;
    const cached = analysisCache.get(url);
    
    // Check if cache is still valid (1 hour)
    if (cached && (Date.now() - cached.timestamp < 3600000)) {
      console.log('Returning cached analysis for:', url);
      sendResponse({ success: true, analysis: cached.data });
    } else {
      sendResponse({ success: false });
    }
  }
  
  return true;
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeTCMenu') {
    // Send message to content script to trigger analysis
    chrome.tabs.sendMessage(tab.id, { action: "triggerAnalysis" });
  }
});

// Cleanup old cache entries every hour
setInterval(() => {
  const now = Date.now();
  for (let [url, cache] of analysisCache.entries()) {
    if (now - cache.timestamp > 3600000) {
      analysisCache.delete(url);
      console.log('Cleaned up cache for:', url);
    }
  }
}, 3600000);

console.log('T&C Analyzer: Background service worker ready');
