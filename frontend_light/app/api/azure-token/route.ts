import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use Azure OpenAI API key from environment (same as main frontend)
    const apiKey = process.env.AZURE_OPENAI_GPT_API_KEY;

    if (!apiKey) {
      console.error("[Azure Token] AZURE_OPENAI_GPT_API_KEY not found in environment");
      return NextResponse.json(
        { error: "AZURE_OPENAI_GPT_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("[Azure Token] API key fetched successfully");
    return NextResponse.json({ token: apiKey });
  } catch (error: unknown) {
    console.error("[Azure Token] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get Azure token: ${errorMessage}` },
      { status: 500 }
    );
  }
}
