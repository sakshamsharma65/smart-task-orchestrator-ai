import crypto from "crypto";

const ENCRYPTION_KEY = process.env.LICENSE_ENCRYPTION_KEY || "taskrep-license-key-2024";

// Helper to generate a consistent 32-byte key from your environment variable
function getSecretKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

const IV_LENGTH = 16; // AES block size is always 16 bytes

export function encryptApiKey(text: string): string {
  // 1. Generate a random Initialization Vector
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // 2. Create the cipher with the 32-byte key and the IV
  const cipher = crypto.createCipheriv("aes-256-cbc", getSecretKey(), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  // 3. Store the IV alongside the encrypted text (separated by a colon)
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptApiKey(encryptedText: string): string {
  try {
    // 1. Split the stored string into IV and Encrypted Text
    const textParts = encryptedText.split(":");
    
    // Fallback in case a raw, unencrypted string was somehow passed
    if (textParts.length !== 2) return encryptedText;

    const iv = Buffer.from(textParts[0], "hex");
    const encryptedData = textParts[1];
    
    // 2. Create the decipher using the extracted IV
    const decipher = crypto.createDecipheriv("aes-256-cbc", getSecretKey(), iv);
    
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    // Return original text if decryption fails (e.g., if it wasn't encrypted to begin with)
    return encryptedText;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string | null;
}

function summarizeProviderError(provider: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if ((provider === "openai" || provider === "azure") && message.includes("Cannot read properties of undefined")) {
    return new Error(
      "The OpenAI-compatible endpoint returned an unexpected response shape. Check that the base URL points to a compatible chat completions API and that the selected model is available there."
    );
  }

  if (
    provider === "google" &&
    (message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate limit"))
  ) {
    return new Error(
      "Google Gemini rejected the request because this key/project has no available quota for the selected model."
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export async function callAiProvider(
  config: AiProviderConfig,
  messages: ChatMessage[]
): Promise<string> {
  const { provider, apiKey, model, baseUrl } = config;
  try {
    switch (provider) {
      case "openai":
      case "azure": {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({
          apiKey,
          baseURL: baseUrl || undefined,
        });
        const response = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 1500,
        });
        const firstChoice = response.choices?.[0];
        if (!firstChoice) {
          throw new Error("OpenAI-compatible endpoint returned no choices.");
        }
        return firstChoice.message?.content ?? "";
      }

      case "anthropic": {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey });
        const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
        const userMessages = messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        const response = await client.messages.create({
          model,
          max_tokens: 1500,
          system: systemMsg,
          messages: userMessages,
        });
        const block = response.content?.[0];
        if (!block) {
          throw new Error("Anthropic returned no content blocks.");
        }
        return block.type === "text" ? block.text : "";
      }

      case "google": {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model });
        const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
        const history = messages
          .filter((m) => m.role !== "system")
          .slice(0, -1)
          .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));
        const lastMsg = messages.filter((m) => m.role !== "system").slice(-1)[0];
        const chat = geminiModel.startChat({
          history,
          systemInstruction: systemMsg,
        });
        const result = await chat.sendMessage(lastMsg?.content ?? "");
        return result.response.text();
      }

      case "mistral": {
        const { Mistral } = await import("@mistralai/mistralai");
        const client = new Mistral({ apiKey });
        const response = await client.chat.complete({
          model,
          messages,
          temperature: 0.3,
          maxTokens: 1500,
        });
        return (response.choices?.[0]?.message?.content as string) ?? "";
      }

      case "ollama": {
        const endpoint = (baseUrl || "http://localhost:11434").replace(/\/$/, "");
        const response = await fetch(`${endpoint}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            options: { temperature: 0.3 },
          }),
        });
        if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
        const data = await response.json() as { message?: { content?: string } };
        return data.message?.content ?? "";
      }

      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  } catch (error) {
    throw summarizeProviderError(provider, error);
  }
}

export const DEFAULT_SYSTEM_PROMPT_HEADER = `You are an AI assistant that helps users create tasks in the TaskRep task management system.

Your role:
- ONLY assist with task creation. If asked about anything else, politely redirect to task creation.
- Ask clarifying questions one at a time when required information is missing.
- Be concise, professional, and conversational.
- Required fields: Title, Assigned To.
- Optional fields: Description, Priority (Critical/High/Medium/Low/Minimal), Due Date, Type (Personal/Team).
- When referencing users, only use names from the provided user list.
- For due dates, calculate the actual date from relative expressions (e.g. "in 3 days", "next Monday").

Once you have all required information, immediately output the task using the TASK_JSON marker.`;

export const PROVIDER_MODELS: Record<string, { label: string; models: string[] }> = {
  openai: {
    label: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  },
  anthropic: {
    label: "Anthropic",
    models: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
    ],
  },
  google: {
    label: "Google Gemini",
    models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro"],
  },
  azure: {
    label: "Azure OpenAI",
    models: ["gpt-4o", "gpt-4", "gpt-35-turbo"],
  },
  mistral: {
    label: "Mistral AI",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "open-mixtral-8x22b"],
  },
  ollama: {
    label: "Ollama (Local)",
    models: ["llama3.2", "llama3.1", "mistral", "codellama", "phi3", "gemma2"],
  },
};
