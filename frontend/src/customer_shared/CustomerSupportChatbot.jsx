import { useEffect, useRef, useState } from 'react';
import { sendCustomerChatbotMessage } from './customerChatbotApi.js';
import './customer-support-chatbot.css';

const welcomeMessage = 'Hi! 👋 Welcome to our store. How can I help you today?';
const signInMessage = 'Please sign in to your customer account to chat with our Shopping Assistant.';
const errorMessage = 'Sorry, the Shopping Assistant is unavailable right now. Please try again in a moment.';

function createWelcomeMessage() {
  return { id: 0, role: 'assistant', content: welcomeMessage };
}

function hasCustomerSession() {
  return Boolean(
    localStorage.getItem('access_token') ||
    localStorage.getItem('refresh_token'),
  );
}

export default function CustomerSupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([createWelcomeMessage()]);
  const [isSending, setIsSending] = useState(false);
  const [customerSignedIn, setCustomerSignedIn] = useState(hasCustomerSession);
  const messageListRef = useRef(null);
  const inputRef = useRef(null);
  const nextMessageIdRef = useRef(1);
  const conversationIdRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      messageListRef.current?.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [isOpen]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending]);

  const appendMessage = (role, content) => {
    setMessages((current) => [
      ...current,
      { id: nextMessageIdRef.current++, role, content },
    ]);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;

    if (!hasCustomerSession()) {
      setCustomerSignedIn(false);
      setInput('');
      appendMessage('user', message);
      appendMessage('assistant', signInMessage);
      return;
    }

    setCustomerSignedIn(true);
    setInput('');
    appendMessage('user', message);
    setIsSending(true);
    const requestConversationId = conversationIdRef.current;

    try {
      const answer = await sendCustomerChatbotMessage(message);
      if (conversationIdRef.current === requestConversationId) {
        appendMessage('assistant', answer);
      }
    } catch {
      if (conversationIdRef.current === requestConversationId) {
        appendMessage('assistant', errorMessage);
      }
    } finally {
      if (conversationIdRef.current === requestConversationId) {
        setIsSending(false);
      }
    }
  };

  const startNewConversation = () => {
    conversationIdRef.current += 1;
    setMessages([createWelcomeMessage()]);
    setInput('');
    setIsSending(false);
    setCustomerSignedIn(hasCustomerSession());
  };

  return (
    <div className="customer-chatbot">
      <section
        className={`customer-chatbot-panel${isOpen ? ' is-open' : ''}`}
        aria-label="Shopping Assistant chat"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <header className="customer-chatbot-header">
          <span className="customer-chatbot-avatar" aria-hidden="true">✦</span>
          <div className="customer-chatbot-title">
            <strong>Shopping Assistant</strong>
            <small><i /> Here to help you shop</small>
          </div>
          <button
            className="customer-chatbot-new"
            type="button"
            onClick={startNewConversation}
            aria-label="Start a new conversation"
            title="New conversation"
          >
            ↻
          </button>
          <button
            className="customer-chatbot-close"
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            ×
          </button>
        </header>

        <div className="customer-chatbot-messages" ref={messageListRef} aria-live="polite">
          {messages.map((message) => (
            <div
              className={`customer-chatbot-row ${message.role}`}
              key={message.id}
            >
              {message.role === 'assistant' && (
                <span className="customer-chatbot-message-avatar" aria-hidden="true">✦</span>
              )}
              <p className="customer-chatbot-bubble">{message.content}</p>
            </div>
          ))}
          {isSending && (
            <div className="customer-chatbot-row assistant" role="status">
              <span className="customer-chatbot-message-avatar" aria-hidden="true">✦</span>
              <p className="customer-chatbot-bubble customer-chatbot-thinking">
                <span>Thinking...</span><i /><i /><i />
              </p>
            </div>
          )}
        </div>

        {!customerSignedIn && (
          <a className="customer-chatbot-signin" href="/">
            Sign in to continue chatting
          </a>
        )}

        <form className="customer-chatbot-form" onSubmit={sendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask us anything…"
            aria-label="Your message"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 11.5 21 3l-5.2 18-3.1-7.1L3 11.5Zm9.7 2.4L21 3" />
            </svg>
          </button>
        </form>
        <p className="customer-chatbot-footnote">Shopping help, powered by AI</p>
      </section>

      <button
        className={`customer-chatbot-launcher${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-label={isOpen ? 'Close Shopping Assistant' : 'Open Shopping Assistant'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.6-3A7.5 7.5 0 1 1 20 11.5Z" />
            <path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" />
          </svg>
        )}
      </button>
    </div>
  );
}
