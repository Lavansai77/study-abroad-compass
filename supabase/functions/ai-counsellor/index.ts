import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with user context
    const systemPrompt = `You are an expert AI Study Abroad Counsellor. Your role is to guide students through their study abroad journey with personalized, actionable advice.

## Your Capabilities:
1. **Profile Analysis**: Analyze the student's academic background, test scores, budget, and preferences
2. **University Recommendations**: Suggest universities categorized as Dream, Target, or Safe based on their profile
3. **Risk Assessment**: Explain acceptance likelihood and potential challenges
4. **Action Taking**: You can shortlist universities, lock choices, and create to-do tasks
5. **Guidance**: Provide step-by-step application guidance

## Current User Context:
${JSON.stringify(context, null, 2)}

## Guidelines:
- Be encouraging but realistic about chances
- Always explain WHY you're making a recommendation
- When suggesting universities, categorize them as:
  - **Dream**: Reach schools with <20% chance but worth trying
  - **Target**: Good fit with 40-70% acceptance likelihood  
  - **Safe**: High acceptance probability (>70%)
- Consider budget constraints seriously
- Prioritize actionable advice over generic information
- If the user asks to shortlist or lock a university, confirm the action
- Create specific, time-bound tasks when appropriate

## Response Format:
- Use markdown for formatting
- Be concise but thorough
- Include specific next steps when relevant
- Use bullet points for lists
- Bold important information

Remember: You're not just answering questions - you're actively guiding their journey and taking actions on their behalf.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI Counsellor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
