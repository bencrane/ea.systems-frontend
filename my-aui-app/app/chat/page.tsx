"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Thread } from "@/components/assistant-ui/thread";

function ChatContent() {
  const searchParams = useSearchParams();
  const systemName = searchParams.get("system") || "Assistant";
  const systemSlug = searchParams.get("slug") || "";

  const runtime = useChatRuntime({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-dvh w-full flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <a
            href="/my/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back
          </a>
          <h1 className="text-lg font-medium">{systemName}</h1>
          <div className="w-16"></div>
        </header>
        <div className="flex-1 overflow-hidden">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-dvh w-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
