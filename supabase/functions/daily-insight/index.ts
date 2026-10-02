// Supabase Edge Function: daily-insight/index.ts
// Secure server-side Gemini API proxy with strict data minimization

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Check if daily insight already cached
    const { data: cachedInsight, error: cacheError } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("insight_date", todayStr)
      .maybeSingle();

    if (cachedInsight && !cacheError) {
      return new Response(
        JSON.stringify({
          insight: cachedInsight.content,
          disclaimer: cachedInsight.disclaimer,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request payload for data minimization
    const body = await req.json().catch(() => ({}));
    const { cycleDay, recentMoods = [], recentSymptoms = [], tone = "warm" } = body;

    // DATA PRIVACY: Ensure no raw notes or unverified PII are accepted
    if (!geminiApiKey) {
      // Graceful fallback if Gemini API key is not configured in Supabase Secrets
      const fallbackInsight = cycleDay
        ? `You are on Day ${cycleDay} of your cycle. Track how your body feels today to discover recurring patterns over time.`
        : "Listen to your body today and log any symptoms or shifts in energy to help build personal cycle insights.";

      return new Response(
        JSON.stringify({
          insight: fallbackInsight,
          disclaimer: "AI-generated and for informational purposes only. Not medical advice.",
          cached: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Construct minimized, safe prompt for Gemini
    const systemInstruction = `You are CYTRACK's gentle wellness companion.
Tone: ${tone}, supportive, calm, grounded.
CRITICAL RULES:
1. NEVER diagnose any medical condition or disease.
2. NEVER prescribe medication, supplements, or medical treatment.
3. NEVER claim medical certainty or precision.
4. Keep the insight to 2-3 brief, helpful sentences highlighting gentle observations or self-care reminders.
5. End with the understanding that every body is unique.`;

    const promptText = `User cycle status:
- Cycle day: ${cycleDay ? `Day ${cycleDay}` : "Unknown"}
- Recent logged moods: ${recentMoods.length > 0 ? recentMoods.slice(-5).join(", ") : "None logged recently"}
- Recent logged symptoms: ${recentSymptoms.length > 0 ? recentSymptoms.slice(-5).join(", ") : "None logged recently"}

Provide a short, 2-3 sentence personalized self-care insight or gentle observation for today.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      const fallback = "Stay mindful of your energy and rest as needed throughout your day.";
      return new Response(
        JSON.stringify({
          insight: fallback,
          disclaimer: "AI-generated and for informational purposes only. Not medical advice.",
          cached: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const generatedContent =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Stay mindful of your energy and rest as needed throughout your day.";

    const disclaimer = "AI-generated and for informational purposes only. Not medical advice.";

    // 4. Cache the insight for today
    await supabase.from("ai_insights").upsert({
      user_id: user.id,
      insight_date: todayStr,
      content: generatedContent,
      disclaimer,
      model_used: geminiModel,
    });

    return new Response(
      JSON.stringify({
        insight: generatedContent,
        disclaimer,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Internal error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
