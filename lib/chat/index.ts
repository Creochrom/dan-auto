export {
  bubbleText,
  clearAllChipsSnapshots,
  createOptimisticUserMessage,
  finalizeUserMessage,
  mergeTurnIntoTimeline,
  snapshotChipsOnLastAssistant,
} from "@/lib/chat/timeline";
export {
  clearChatTranscript,
  loadChatTranscript,
  saveChatTranscript,
} from "@/lib/chat/persistence";
export {
  splitAssistantContent,
  REVEAL_FIRST_MS,
  REVEAL_BETWEEN_MS,
} from "@/lib/chat/reveal";
export { parseAdvisorMessageContent } from "@/lib/chat/message-highlight";
export type { AdvisorMessageSegment } from "@/lib/chat/message-highlight";
export {
  groupAssistantBlocks,
  SEGMENT_LABEL,
} from "@/lib/chat/assistant-blocks";
export type { AssistantRenderBlock } from "@/lib/chat/assistant-blocks";
