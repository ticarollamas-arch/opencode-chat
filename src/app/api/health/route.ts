import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  const configured = Boolean(process.env.OPENCODE_SERVER_URL);
  if (!configured) return NextResponse.json({ok:false, error:"OPENCODE_SERVER_URL não configurada"}, {status:503});
  try {
    const { opencode } = await import("@/lib/opencode");
    const result = await opencode.global.health();
    return NextResponse.json({ok:!!result.data?.healthy, version:result.data?.version});
  } catch {
    return NextResponse.json({ok:false, error:"Executor OpenCode indisponível"}, {status:503});
  }
}
