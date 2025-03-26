function analyzeText(text) {
    chrome.runtime.sendMessage({ action: "analyze", text: text }, (response) => {
      if (response && response.isHarmful) {
        console.log("Harmful content detected:", text);
        // You can modify the DOM here to hide or replace the content
      }
    });
  }
  
  const allText = document.body.innerText;
  analyzeText(allText);