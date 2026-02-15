import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Rate Limits
const MAX_QUERIES_PER_WINDOW = 5;

// Time Windows (Hours in 24h format)
const WINDOWS = {
    MORNING: { start: 5, end: 12, key: 'morning_count' },
    AFTERNOON: { start: 12, end: 18, key: 'afternoon_count' },
    EVENING: { start: 18, end: 29, key: 'evening_count' } // 29 = 5 AM next day (logic handled in code)
};

const SYSTEM_PROMPT = `
You are Nexus, the AI Concierge for "Campus Market P2P", a student marketplace.
Your goal is to help students buy, sell, and navigate campus life.

CRITICAL RULES:
1. You represent "Campus Market P2P".
2. For operational issues (refunds, technical support), YOU MUST refer them to ADMIN: (234) 0808 300 0771.
3. Keep answers concise (under 3 sentences usually).
4. Do not hallucinate deals. If you don't know, suggest they check the "Market" tab.
5. Be friendly, using Nigerian student slang occasionally (e.g., "How far", "No wahala").
`;

export async function POST(req: Request) {
    if (!GROQ_API_KEY) {
        return NextResponse.json({ error: 'AI Service Configuration Error' }, { status: 503 });
    }

    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json();
        if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

        // 1. Determine Time Window
        const now = new Date();
        const hour = now.getHours();
        let currentWindow = null;
        let windowLabel = "";

        if (hour >= 5 && hour < 12) {
            currentWindow = WINDOWS.MORNING;
            windowLabel = "Morning";
        } else if (hour >= 12 && hour < 18) {
            currentWindow = WINDOWS.AFTERNOON;
            windowLabel = "Afternoon";
        } else {
            currentWindow = WINDOWS.EVENING;
            windowLabel = "Evening";
        }

        // 2. Check Usage in Supabase
        const today = new Date().toISOString().split('T')[0];

        let { data: usage, error: usageError } = await supabase
            .from('ai_usage_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('window_date', today)
            .single();

        if (!usage && !usageError) {
            // Create record if not exists
            const { data: newUsage, error: createError } = await supabase
                .from('ai_usage_logs')
                .insert({ user_id: user.id, window_date: today })
                .select()
                .single();
            usage = newUsage;
        }

        // 3. Enforce Rate Limit
        const currentCount = usage ? usage[currentWindow.key] : 0;

        if (currentCount >= MAX_QUERIES_PER_WINDOW) {
            return NextResponse.json({
                error: `You've used your 5 free AI questions for this ${windowLabel}. Come back later!`,
                limitReached: true
            }, { status: 429 });
        }

        // 4. Call Groq API
        const groq = new Groq({ apiKey: GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: query }
            ],
            model: "llama3-70b-8192",
            temperature: 0.7,
            max_tokens: 150,
        });

        const aiResponse = completion.choices[0]?.message?.content || "I'm having trouble connecting to the brain. Try again.";

        // 5. Increment Usage
        await supabase.rpc('increment_ai_usage', {
            row_id: usage.id,
            column_name: currentWindow.key
        });

        // Alternative update since dynamic column RPC might be complex safely:
        const updateData: any = {};
        updateData[currentWindow.key] = currentCount + 1;
        await supabase
            .from('ai_usage_logs')
            .update(updateData)
            .eq('id', usage.id);

        return NextResponse.json({
            response: aiResponse,
            usage: {
                window: windowLabel,
                remaining: MAX_QUERIES_PER_WINDOW - (currentCount + 1)
            }
        });

    } catch (error) {
        console.error('AI Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
