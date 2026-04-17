"use client";

import Vapi from "@vapi-ai/web";

type VapiHandlers = {
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
};

export class DevVoiceVapiClient {
  private vapi: Vapi | null = null;

  constructor(private readonly publicKey?: string) {
    if (publicKey) {
      this.vapi = new Vapi(publicKey);
    }
  }

  isEnabled() {
    return Boolean(this.vapi);
  }

  attachHandlers(handlers: VapiHandlers) {
    if (!this.vapi) return;

    this.vapi.on("message", (message: unknown) => {
      const value = message as { transcript?: string };
      if (value.transcript) {
        handlers.onTranscript?.(value.transcript);
      }
    });

    this.vapi.on("error", (err: unknown) => {
      handlers.onError?.(err instanceof Error ? err.message : "Vapi error");
    });
  }

  async start(assistantId: string) {
    if (!this.vapi) return;
    await this.vapi.start(assistantId);
  }

  stop() {
    this.vapi?.stop();
  }
}
