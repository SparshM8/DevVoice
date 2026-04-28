import { config, hasExternalLlmConfig } from "@/lib/config";
import { ChatTurn, RetrievedChunk } from "@/lib/types";
import { mockDeveloperAnswer } from "@/lib/mock";
import { readLocalFile, runTerminalCommand } from "./tools";

const tools = [
  {
    type: "function",
    function: {
      name: "read_local_file",
      description: "Reads the content of a file from the local workspace. Use this to inspect code.",
      parameters: {
        type: "object",
        properties: {
          filepath: { type: "string", description: "Relative path to the file (e.g. src/app/page.tsx)" }
        },
        required: ["filepath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_terminal_command",
      description: "Executes a safe terminal command in the workspace root and returns output.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The command to run (e.g. 'npm run lint', 'git status')" }
        },
        required: ["command"]
      }
    }
  }
];

function buildSystemMessage(context: RetrievedChunk[]): string {
  const contextText = context
    .map((chunk, index) => `[${index + 1}] (${chunk.source}) ${chunk.text}`)
    .join("\n\n");

  return [
    "You are DevVoice, an autonomous developer assistant running locally on the user's machine.",
    "You have access to tools that allow you to read local files and execute terminal commands.",
    "IMPORTANT INSTRUCTIONS:",
    "1. When asked about code, use 'read_local_file' to inspect the actual code rather than guessing.",
    "2. When asked to fix an issue, you can use 'run_terminal_command' to run diagnostics (e.g. npm run build, tsc).",
    "3. Keep your final answer concise, technical, and action-oriented.",
    "",
    "Retrieved context (use this if relevant):",
    contextText || "No retrieved context.",
  ].join("\n");
}

type OpenAIMessage = {
  role: string;
  content: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

async function callOpenAiNonStream(messages: OpenAIMessage[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
      messages,
      temperature: 0.2,
      tools,
      tool_choice: "auto"
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }
  return response.json();
}

async function* callOpenAiStream(messages: OpenAIMessage[]): AsyncGenerator<string, void, unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages,
        temperature: 0.2,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI Stream Error: ${response.statusText}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: isDone } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const text = data.choices?.[0]?.delta?.content;
              if (text) yield text;
            } catch (e) {}
          }
        }
      }
      done = isDone;
    }
  } finally {
    clearTimeout(timeout);
  }
}

export type StreamYield = string | { type: "action"; message: string };

export async function* generateDeveloperResponseStream(params: {
  message: string;
  history: ChatTurn[];
  context: RetrievedChunk[];
}): AsyncGenerator<StreamYield, { suggestions: string[] }, unknown> {
  
  if (!hasExternalLlmConfig()) {
    yield { type: "action", message: "Mock Mode: Simulating tool call..." };
    await new Promise(r => setTimeout(r, 1000));
    const mock = await mockDeveloperAnswer(params.message);
    const words = mock.answer.split(" ");
    for (const word of words) {
      yield word + " ";
      await new Promise((r) => setTimeout(r, 25));
    }
    return { suggestions: ["Verify OPENAI_API_KEY"] };
  }

  // Build message chain
  const messages: OpenAIMessage[] = [
    { role: "system", content: buildSystemMessage(params.context) },
    ...params.history.slice(-6).map(t => ({ role: t.role, content: t.content })),
    { role: "user", content: params.message }
  ];

  const maxLoops = 3;
  for (let i = 0; i < maxLoops; i++) {
    yield { type: "action", message: "Thinking..." };
    
    // Non-streaming call to get tool calls or text
    const response = await callOpenAiNonStream(messages);
    const message = response.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      // Append assistant message with tool_calls
      messages.push(message);

      // Execute tools sequentially
      for (const toolCall of message.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let result = "";

        if (fnName === "read_local_file") {
          yield { type: "action", message: `Reading file ${args.filepath}...` };
          result = await readLocalFile(args.filepath);
        } else if (fnName === "run_terminal_command") {
          yield { type: "action", message: `Running \`${args.command}\`...` };
          result = await runTerminalCommand(args.command);
        } else {
          result = `Error: Unknown function ${fnName}`;
        }

        // Append tool result
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: fnName,
          content: result
        });
      }
    } else {
      // No tool calls needed, we have the final answer.
      yield { type: "action", message: "Generating response..." };
      
      const answer = message.content || "I couldn't generate a response.";
      // Simulate streaming for the frontend
      const words = answer.split(" ");
      for (const word of words) {
        yield word + " ";
        await new Promise(r => setTimeout(r, 20));
      }
      
      return {
        suggestions: [
          "Ask for more details.",
          "Run tests to verify.",
          "Check git status."
        ]
      };
    }
  }

  yield "\n\n(Agent stopped after maximum tool iterations)";
  return { suggestions: ["Try breaking down your request"] };
}
