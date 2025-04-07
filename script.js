const chatContainer = document.getElementById("chatContainer");
const shadybotPrompt = "act like you are some gen-z and some shady chatbot and answer the following question(do not ever say that you are acting shady). Use emojis also but not too much";
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const typingIndicator = document.getElementById("typingIndicator");
const searchButton = document.getElementById("searchButton");
const reasonButton = document.getElementById("reasonButton");
let isBotResponding = false;
let searchSelected = false;
let reasonSelected = false;

// Add conversation history array
let conversationHistory = [
  { role: "system", content: shadybotPrompt }
];


userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !isBotResponding) {
    e.preventDefault();
    handleUserInput();
  }
});

searchButton.addEventListener("click", () => {
  searchSelected = !searchSelected;
  searchButton.classList.toggle("active", searchSelected);
});

reasonButton.addEventListener("click", () => {
  reasonSelected = !reasonSelected;
  reasonButton.classList.toggle("active", reasonSelected);
});

function createWaveElement(text) {
  const wrapper = document.createElement("span");
  wrapper.classList.add("wave");
  text.split("").forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.style.animationDelay = `${index * 0.05}s`;
    wrapper.appendChild(span);
  });
  return wrapper;
}

function addMessage(message, isUser) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "bot"}`;
  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  typeof message === "string" ? contentDiv.textContent = message : contentDiv.appendChild(message);
  messageDiv.appendChild(contentDiv);
  chatContainer.insertBefore(messageDiv, typingIndicator);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return contentDiv;
}

function showTypingIndicator() {
  typingIndicator.style.display = "block";
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTypingIndicator() {
  typingIndicator.style.display = "none";
}

async function simulateStreamingResponse(responseText) {
  return new Promise(resolve => {
    const responseDiv = addMessage("", false);
    let buffer = "";
    let index = 0;
    
    const typeCharacter = () => {
      if (index < responseText.length) {
        buffer += responseText.charAt(index);
        // Update raw text during streaming
        responseDiv.textContent = buffer;
        chatContainer.scrollTop = chatContainer.scrollHeight;
        index++;
        setTimeout(typeCharacter, 20);
      } else {
        // After streaming completes, parse markdown
        responseDiv.innerHTML = marked.parse(buffer, {
          breaks: true,
          highlight: (code) => hljs.highlightAuto(code).value
        });
        // Add copy button to code blocks
        responseDiv.querySelectorAll('pre code').forEach(block => {
          const copyButton = document.createElement('button');
          copyButton.className = 'copy-button';
          copyButton.textContent = '📋';
          copyButton.onclick = () => {
            navigator.clipboard.writeText(block.textContent);
            copyButton.textContent = '✅';
            setTimeout(() => copyButton.textContent = '📋', 2000);
          };
          block.parentNode.insertBefore(copyButton, block);
        });
        hideTypingIndicator();
        isBotResponding = false;
        resolve();
      }
    };
    typeCharacter();
  });
}

async function simulateExtraProcess(text, duration = 2000) {
  return new Promise(resolve => {
    const waveElement = createWaveElement(text);
    const extraMsgDiv = addMessage(waveElement, false);
    setTimeout(() => {
      extraMsgDiv.parentElement.remove();
      resolve();
    }, duration);
  });
}

async function getDeepSeekResponse() { // Remove message parameter
  try {
      const response = await fetch('https://api.deepseek.com', {
          method: 'POST',
          headers: {
              Authorization: 'Bearer <API_KEY>',
              'HTTP-Referer': 'https://www.sitename.com',
          },
          body: JSON.stringify({
              model: 'deepseek/deepseek-r1:free',
              messages: conversationHistory, 
          })
      });
      const data = await response.json();
      const assistantResponse = data.choices[0].message.content;
      
      // Add assistant response to conversation history
      conversationHistory.push({ 
          role: "assistant", 
          content: assistantResponse 
      });
      
      return data.choices[0].message.content;
  } catch (error) {
      console.error("Error:", error);
      return "Yo, can't vibe with that rn. Try again later maybe? 🙃";
  }
}


async function handleUserInput() {
  if (isBotResponding) return;
  const rawMessage = userInput.value.trim();
  if (!rawMessage) return;

  // Add user message to conversation history
  conversationHistory.push({
      role: "user",
      content: rawMessage
  });

  addMessage(rawMessage, true);
  userInput.value = "";
  userInput.disabled = true;
  userInput.style.height = 'auto';

  const processes = [];
  if (searchSelected) processes.push(simulateExtraProcess("Searching web...", 2000));
  if (reasonSelected) processes.push(simulateExtraProcess("Analyzing...", 2500));
  await Promise.all(processes);

  searchSelected = false;
  reasonSelected = false;
  searchButton.classList.remove("active");
  reasonButton.classList.remove("active");

  showTypingIndicator();
  isBotResponding = true;

  const apiResponse = await getDeepSeekResponse(); // No parameter needed now
  await simulateStreamingResponse(apiResponse);
  
  userInput.disabled = false;
  userInput.focus();
  console.log(conversationHistory);
}

sendButton.addEventListener("click", handleUserInput);

