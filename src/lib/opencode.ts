import { createOpencodeClient } from "@opencode-ai/sdk";

const baseUrl = process.env.OPENCODE_SERVER_URL;
if (!baseUrl) throw new Error("OPENCODE_SERVER_URL não configurada.");

export const opencode = createOpencodeClient({
  baseUrl,
  throwOnError: true,
  // Em produção, configure autenticação no proxy privado do executor.
  headers: process.env.OPENCODE_SERVER_PASSWORD
    ? { Authorization: `Basic ${Buffer.from(`opencode:${process.env.OPENCODE_SERVER_PASSWORD}`).toString("base64")}` }
    : undefined,
});
