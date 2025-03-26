chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze") {
      const isHarmful = analyzeWithAI(request.text);
      sendResponse({ isHarmful: isHarmful });
    }
  });
  
  function analyzeWithAI(text) {
    // Basic keyword filter (replace with your AI logic)
    const harmfulKeywords = ["hate", "bad", "attack"];
    return harmfulKeywords.some((keyword) => text.toLowerCase().includes(keyword));
  }