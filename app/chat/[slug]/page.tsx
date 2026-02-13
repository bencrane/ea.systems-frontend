"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "https://api.ea.systems";

interface Message {
  role: "user" | "model";
  content: string;
}

interface SystemData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  modal_url?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [isSubmittingPayload, setIsSubmittingPayload] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ status: "success" | "error"; message?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load system data from localStorage
  useEffect(() => {
    const savedSystem = localStorage.getItem("ea_current_system");
    if (savedSystem) {
      setSystemData(JSON.parse(savedSystem));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSubmittingPayload, submitResult]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const systemName = systemData?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Try to parse ready payload from response text
  const parseReadyPayload = (text: string): { ready: boolean; payload: Record<string, unknown> } | null => {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*"ready"\s*:\s*true[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.ready === true && parsed.payload) {
          return parsed;
        }
      } catch {
        // Not valid JSON
      }
    }
    return null;
  };

  // Auto-submit payload to Modal endpoint
  const submitToModal = async (payload: Record<string, unknown>) => {
    if (!systemData?.modal_url) {
      console.error("No modal_url found for system");
      setSubmitResult({ status: "error", message: "No endpoint configured for this system" });
      return;
    }

    setIsSubmittingPayload(true);

    try {
      const response = await fetch(systemData.modal_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        setSubmitResult({
          status: "success",
          message: result.message || "Your request has been submitted successfully!"
        });
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        setSubmitResult({ status: "error", message: errorText });
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitResult({ status: "error", message: "Failed to submit request" });
    } finally {
      setIsSubmittingPayload(false);
    }
  };

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

      const data = await response.json();
      const responseText = data.response || "";

      // Check if response contains ready payload
      const readyData = parseReadyPayload(responseText);

      if (readyData) {
        // Add a message showing we're processing
        const processingMessage: Message = {
          role: "model",
          content: "Processing your request...",
        };
        setMessages([...newMessages, processingMessage]);

        // Auto-submit to Modal
        await submitToModal(readyData.payload);
      } else {
        // Regular message - add to chat
        const assistantMessage: Message = {
          role: "model",
          content: responseText,
        };
        setMessages([...newMessages, assistantMessage]);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBack = () => {
    router.push("/my");
  };

  const handleNewChat = () => {
    setMessages([]);
    setSubmitResult(null);
    setIsSubmittingPayload(false);
  };

  // Sidebar component
  const Sidebar = () => (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-neutral-900 flex flex-col p-4">
      <div
        onClick={handleBack}
        className="flex items-center gap-3 p-2 mb-4 cursor-pointer hover:opacity-80"
      >
        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-neutral-400 text-sm">Back</span>
      </div>

      <nav className="flex-1">
        <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide px-3 mb-2">
          System
        </p>
        <div className="flex items-center gap-3 px-3 py-2 rounded bg-neutral-900 text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {systemName}
        </div>
      </nav>

      <div className="border-t border-neutral-900 pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded text-neutral-500 hover:bg-neutral-900 hover:text-white cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          Help & Support
        </div>
        <p className="text-xs text-neutral-600 px-3 mt-2">team@everythingautomation.com</p>
      </div>
    </aside>
  );

  // Result view after submission
  if (submitResult) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Sidebar />
        <main className="ml-64 p-8 flex items-center justify-center min-h-screen">
          <div className="max-w-lg w-full text-center">
            {submitResult.status === "success" ? (
              <>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Success!</h2>
                <p className="text-neutral-400 mb-6">{submitResult.message}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p className="text-neutral-400 mb-6">{submitResult.message}</p>
              </>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleBack}
                className="px-6 py-2 border border-neutral-700 rounded hover:bg-neutral-800"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleNewChat}
                className="px-6 py-2 bg-white text-black rounded hover:bg-neutral-200"
              >
                New Chat
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Chat view
  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />
      <main className="ml-64 flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-neutral-500 py-12">
                <p>Start a conversation with {systemName}</p>
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

            {(isLoading || isSubmittingPayload) && (
              <div className="flex justify-start">
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                    {isSubmittingPayload && (
                      <span className="text-neutral-400 text-sm">Submitting to {systemName}...</span>
                    )}
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
              disabled={isLoading || isSubmittingPayload}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || isSubmittingPayload || !input.trim()}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
