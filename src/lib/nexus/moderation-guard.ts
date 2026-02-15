import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function moderateContent(title: string, description: string) {
    if (!process.env.GROQ_API_KEY) {
        console.warn("GROQ_API_KEY missing. Skipping AI moderation.");
        return { flagged: false, reason: null };
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an AI Content Guard for a Campus Marketplace. Analyze posts for: \n1. Explicit or offensive language \n2. Spam or scams \n3. Illegal items \n4. Policy violations.\n\nRespond JSON: { \"flagged\": boolean, \"reason\": string | null }"
                },
                {
                    role: "user",
                    content: `Analyze this post:\nTitle: ${title}\nDescription: ${description}`
                }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content;
        return JSON.parse(content || "{ \"flagged\": false, \"reason\": null }");
    } catch (error) {
        console.error("Groq Moderation Error:", error);
        return { flagged: false, reason: "Detection failed" };
    }
}
