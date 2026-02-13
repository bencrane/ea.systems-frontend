"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";

const API_BASE = "https://api.ea.systems";

interface Message {
  role: "user" | "model";
  content: string;
}

interface ChatResponse {
  response?: string;
  ready?: boolean;
  payload?: Record<string, unknown>;
  modal_endpoint?: string;
}

export default function ChatPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [readyPayload, setReadyPayload] = useState<{
    payload: Record<string, unknown>;
    modalEndpoint?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/systems/${slug}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: messages,
          client_id: "test-client-001",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data: ChatResponse = await response.json();

      if (data.response) {
        const assistantMessage: Message = {
          role: "model",
          content: data.response,
        };
        setMessages([...newMessages, assistantMessage]);
      }

      if (data.ready && data.payload) {
        setReadyPayload({
          payload: data.payload,
          modalEndpoint: data.modal_endpoint,
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "model",
        content: "Sorry, there was an error processing your request.",
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPayload = async () => {
    if (!readyPayload) return;

    setIsSubmitting(true);
    try {
      const endpoint = readyPayload.modalEndpoint || `${API_BASE}/systems/${slug}/execute`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(readyPayload.payload),
      });

      if (response.ok) {
        setSubmitResult("success");
      } else {
        setSubmitResult("error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitResult("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReadyPayload(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatSlugAsTitle = (s: string) => {
    return s
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Confirmation view
  if (readyPayload) {
    return (
      <div className="flex h-dvh w-full flex-col bg-black text-white">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 px-4">
          <a href="/my/" className="text-neutral-500 hover:text-white transition-colors">
            &larr; Back
          </a>
          <h1 className="text-lg font-medium">{formatSlugAsTitle(slug)}</h1>
          <div className="w-16"></div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            {submitResult === "success" ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Success!</h2>
                <p className="text-neutral-400 mb-6">Your request has been submitted.</p>
                <a href="/my/" className="inline-block px-6 py-2 bg-white text-black rounded hover:bg-neutral-200">
                  Back to Dashboard
                </a>
              </div>
            ) : submitResult === "error" ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p className="text-neutral-400 mb-6">Something went wrong. Please try again.</p>
                <button
                  onClick={() => setSubmitResult(null)}
                  className="px-6 py-2 bg-white text-black rounded hover:bg-neutral-200"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-4 text-center">Confirm Submission</h2>
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-6">
                  <pre className="text-sm text-neutral-300 overflow-auto max-h-64">
                    {JSON.stringify(readyPayload.payload, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-neutral-700 rounded hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitPayload}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-white text-black rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Submitting..." : "Confirm"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex h-dvh w-full flex-col bg-black text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-800 px-4">
        <a href="/my/" className="text-neutral-500 hover:text-white transition-colors">
          &larr; Back
        </a>
        <h1 className="text-lg font-medium">{formatSlugAsTitle(slug)}</h1>
        <div className="w-16"></div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-neutral-500 py-12">
              <p>Start a conversation with {formatSlugAsTitle(slug)}</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-white text-black"
                    : "bg-neutral-900 border border-neutral-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-800 p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
