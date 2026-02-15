export type MessageRole = 'user' | 'agent' | 'system';

export interface AgentMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    action?: {
        label: string;
        href: string;
        type: 'link' | 'button';
    };
}

const SIMULATED_DELAY_MS = 1500;

export async function processUserQuery(query: string): Promise<AgentMessage> {
    // Simulate network latency for "thinking" feel
    await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY_MS));

    const lowerQuery = query.toLowerCase();

    let responseContent = "I'm still learning how to help with that specific request. Try asking about 'cheap food', 'laptops', or 'part-time jobs'.";
    let action = undefined;

    if (lowerQuery.includes('laptop') || lowerQuery.includes('macbook') || lowerQuery.includes('computer')) {
        responseContent = "I found 3 reliable options for engineering students. The best value right now is a **MacBook Air M2** at 15% off locally.";
        action = {
            label: "View MacBook Deal",
            href: "/market?q=macbook",
            type: 'link' as const
        };
    } else if (lowerQuery.includes('food') || lowerQuery.includes('hungry') || lowerQuery.includes('eat')) {
        responseContent = "It's 12:30 PM. 'Mama K's Kitchen' has a **Buy 1 Get 1 Free** promo on Jollof Rice valid for the next 45 mins.";
        action = {
            label: "Claim BOGO Code",
            href: "/market/food-promo-123",
            type: 'button' as const
        };
    } else if (lowerQuery.includes('job') || lowerQuery.includes('work') || lowerQuery.includes('money')) {
        responseContent = "There are 2 verified on-campus gigs available this weekend. One is for 'Event Ushering' ($15/hr).";
        action = {
            label: "Apply Now",
            href: "/market?cat=jobs",
            type: 'link' as const
        };
    } else if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
        responseContent = "Hey! I'm NEXUS, your student concierge. I can verify deals, find gigs, or help you save money. What's on your mind?";
    }

    return {
        id: crypto.randomUUID(),
        role: 'agent',
        content: responseContent,
        timestamp: new Date(),
        action
    };
}
