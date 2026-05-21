import type { ChatMessage, ChatMessageSource } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";

export function bubbleText(msg: ChatMessage): string {
  if (msg.role === "user") {
    return msg.displayContent ?? msg.content;
  }
  return msg.content;
}

export function createOptimisticUserMessage(
  content: string,
  opts?: { displayContent?: string; source?: ChatMessageSource }
): ChatMessage {
  const now = new Date().toISOString();
  return {
    id: `tmp-${now}`,
    role: "user",
    content,
    displayContent: opts?.displayContent ?? content,
    source: opts?.source ?? "typed",
    status: "sending",
    createdAt: now,
  };
}

export function finalizeUserMessage(
  optimistic: ChatMessage,
  serverMessage?: ChatMessage
): ChatMessage {
  if (serverMessage) {
    return {
      ...serverMessage,
      displayContent: optimistic.displayContent ?? serverMessage.displayContent,
      source: optimistic.source ?? serverMessage.source,
      status: "sent",
    };
  }
  return {
    ...optimistic,
    id: optimistic.id.startsWith("tmp-")
      ? `user-${Date.now()}`
      : optimistic.id,
    status: "sent",
  };
}

/** Attach offered quick replies to the latest assistant message for history */
export function snapshotChipsOnLastAssistant(
  messages: ChatMessage[],
  chips: SuggestionChip[]
): ChatMessage[] {
  if (!chips.length) return messages;
  let lastAssistant = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistant = i;
      break;
    }
  }
  if (lastAssistant < 0) return messages;
  return messages.map((m, i) =>
    i === lastAssistant ? { ...m, chipsSnapshot: chips } : m
  );
}

export function mergeTurnIntoTimeline(
  messages: ChatMessage[],
  params: {
    optimisticId?: string;
    optimisticUser?: ChatMessage;
    serverUser?: ChatMessage;
    assistant: ChatMessage;
    chipsOffered?: SuggestionChip[];
  }
): ChatMessage[] {
  let next = messages;

  if (params.chipsOffered?.length) {
    next = snapshotChipsOnLastAssistant(next, params.chipsOffered);
  }

  if (params.optimisticId && params.optimisticUser) {
    const withoutTmp = next.filter((m) => m.id !== params.optimisticId);
    const userMsg = finalizeUserMessage(params.optimisticUser, params.serverUser);
    const hasUser = withoutTmp.some((m) => m.id === userMsg.id);
    next = hasUser ? withoutTmp : [...withoutTmp, userMsg];
  } else if (params.serverUser) {
    next = [...next, params.serverUser];
  }

  const last = next[next.length - 1];
  if (last?.id === params.assistant.id && last.role === "assistant") {
    return next;
  }
  return [...next, params.assistant];
}
