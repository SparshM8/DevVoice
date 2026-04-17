export type Role = "user" | "assistant";

export type ChatTurn = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

export type RetrievedChunk = {
  id: string;
  text: string;
  score: number;
  source: string;
  type: string;
};

export type SessionRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  turns: ChatTurn[];
  lastContexts?: RetrievedChunk[];
  lastSuggestions?: string[];
};

export type SessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
  turnCount: number;
  lastAssistantMessage: string;
};
