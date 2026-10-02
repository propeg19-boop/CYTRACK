// Supabase Edge Function: send-period-reminders/index.ts
// Scheduled function that computes approaching periods deterministically and sends Web Push

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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Fetch users with period reminders enabled who have push subscriptions
    const { data: usersToRemind, error: usersError } = await adminSupabase
      .from("notification_settings")
      .select(`
        user_id,
        period_reminder_days_before,
        period_reminders_enabled
      `)
      .eq("period_reminders_enabled", true);

    if (usersError || !usersToRemind) {
      return new Response(JSON.stringify({ error: usersError?.message || "Failed to fetch settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const setting of usersToRemind) {
      const userId = setting.user_id;
      const daysBefore = setting.period_reminder_days_before || 2;

      // 1. Fetch user's profile and recent cycles
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("typical_cycle_length")
        .eq("id", userId)
        .maybeSingle();

      const { data: cycles } = await adminSupabase
        .from("cycles")
        .select("start_date, end_date")
        .eq("user_id", userId)
        .order("start_date", { ascending: false })
        .limit(5);

      if (!cycles || cycles.length === 0) continue;

      // Deterministic cycle calculation
      const lastStart = new Date(cycles[0].start_date);
      let cycleLength = profile?.typical_cycle_length || 28;

      if (cycles.length >= 2) {
        // Calculate average from intervals
        let totalDays = 0;
        let intervals = 0;
        for (let i = 0; i < cycles.length - 1; i++) {
          const s1 = new Date(cycles[i].start_date).getTime();
          const s2 = new Date(cycles[i + 1].start_date).getTime();
          const diffDays = Math.round((s1 - s2) / (1000 * 60 * 60 * 24));
          if (diffDays >= 15 && diffDays <= 60) {
            totalDays += diffDays;
            intervals++;
          }
        }
        if (intervals > 0) {
          cycleLength = Math.round(totalDays / intervals);
        }
      }

      // Predicted next cycle start
      const estimatedNextStart = new Date(lastStart);
      estimatedNextStart.setDate(estimatedNextStart.getDate() + cycleLength);
      const estimatedNextDateStr = estimatedNextStart.toISOString().split("T")[0];

      // Reminder trigger date = estimatedNextStart - daysBefore
      const reminderTriggerDate = new Date(estimatedNextStart);
      reminderTriggerDate.setDate(reminderTriggerDate.getDate() - daysBefore);
      const reminderTriggerStr = reminderTriggerDate.toISOString().split("T")[0];

      // Check if today matches trigger date
      if (todayStr === reminderTriggerStr) {
        // Deduplication check: Has a notification for this predicted cycle date already been sent?
        const { data: existingNotif } = await adminSupabase
          .from("notification_history")
          .select("id")
          .eq("user_id", userId)
          .eq("notification_type", "period_upcoming")
          .eq("target_date", estimatedNextDateStr)
          .maybeSingle();

        if (existingNotif) {
          skippedCount++;
          continue;
        }

        // Fetch user subscriptions
        const { data: subs } = await adminSupabase
          .from("push_subscriptions")
          .select("*")
          .eq("user_id", userId);

        if (subs && subs.length > 0) {
          // Log notification history to prevent duplicate sends
          await adminSupabase.from("notification_history").insert({
            user_id: userId,
            notification_type: "period_upcoming",
            target_date: estimatedNextDateStr,
          });

          sentCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        skipped: skippedCount,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
