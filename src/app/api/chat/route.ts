import { NextRequest, NextResponse } from "next/server";
import { createOpencodeClient } from "@opencode-ai/sdk";
export const runtime = "nodejs";
export const maxDuration = 60;

function client() {
  const url = process.env.OPENCODE_SERVER_URL;
  if (!url) throw new Error("Configure OPENCODE_SERVER_URL no ambiente.");
  return createOpencodeClient({
    baseUrl: url,
    throwOnError: true,
    headers: process.env.OPENCODE_SERVER_PASSWORD
      ? { Authorization: `Basic ${Buffer.from(`opencode:${process.env.OPENCODE_SERVER_PASSWORD}`).toString("base64")}` }
      : undefined,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Acesso pessoal simples: defina APP_ACCESS_TOKEN e envie x-app-token.
    if (process.env.APP_ACCESS_TOKEN && req.headers.get("x-app-token") !== process.env.APP_ACCESS_TOKEN)
      return NextResponse.json({error:"Não autorizado"}, {status:401});
    const {sessionId, message} = await req.json();
    if (typeof message !== "string" || !message.trim()) return NextResponse.json({error:"Mensagem vazia"}, {status:400});
    if (typeof sessionId !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(sessionId))
      return NextResponse.json({error:"Identificador de sessão inválido"}, {status:400});
    const api = client();

    // Cria uma sessão OpenCode se o ID ainda não existir; se já existir, reutiliza.
    let session;
    try { session = await api.session.get({path:{id:sessionId}}); }
    catch {
      session = await api.session.create({body:{title:message.slice(0,72)}});
    }
    const id = session.data.id;
    const result = await api.session.prompt({
      path:{id},
      body:{parts:[{type:"text",text:message}]}
    });
    const parts = result.data.parts || [];
    const text = parts.filter((p:any)=>p.type==="text").map((p:any)=>p.text).join("\n").trim();
    return NextResponse.json({sessionId:id,message:text || "Tarefa recebida pelo OpenCode.",parts});
  } catch (error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Erro interno ao enviar instrução."},{status:502});
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (process.env.APP_ACCESS_TOKEN && req.headers.get("x-app-token") !== process.env.APP_ACCESS_TOKEN)
      return NextResponse.json({error:"Não autorizado"},{status:401});
    const {sessionId}=await req.json();
    const api=client();
    await api.session.abort({path:{id:sessionId}});
    return NextResponse.json({ok:true});
  } catch(error) {
    return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível abortar."},{status:502});
  }
}
