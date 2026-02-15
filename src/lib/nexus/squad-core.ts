export interface SquadMember {
    id: string;
    name: string;
    avatarUrl?: string; // fallback to initials
    joinedAt: Date;
    isLeader: boolean;
}

export interface SquadDeal {
    id: string;
    brandName: string;
    title: string;
    description: string;
    imageUrl: string;
    originalPrice: number;
    squadPrice: number; // Discounted price
    requiredMembers: number;
    currentMembers: SquadMember[];
    expiresAt: Date;
    status: 'active' | 'completed' | 'expired';
}

// Mock Data
export const MOCK_SQUADS: SquadDeal[] = [
    {
        id: "sq-1",
        brandName: "Spotify",
        title: "Family Plan (6 Accounts)",
        description: "Split the cost with 5 friends. Only ₦250/mo per person.",
        imageUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1000",
        originalPrice: 1500,
        squadPrice: 250,
        requiredMembers: 6,
        currentMembers: [
            { id: "u1", name: "You", joinedAt: new Date(), isLeader: true },
            { id: "u2", name: "Sarah J.", joinedAt: new Date(), isLeader: false },
            { id: "u3", name: "Mike T.", joinedAt: new Date(), isLeader: false }
        ],
        expiresAt: new Date(Date.now() + 3600000 * 2), // 2 hours
        status: 'active'
    },
    {
        id: "sq-2",
        brandName: "Dominos",
        title: "2x Large Pepperoni Pizza",
        description: "Buy 1 Get 1 Free. Need 1 partner to split.",
        imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000",
        originalPrice: 8000,
        squadPrice: 4000,
        requiredMembers: 2,
        currentMembers: [
            { id: "u1", name: "You", joinedAt: new Date(), isLeader: true }
        ],
        expiresAt: new Date(Date.now() + 1800000), // 30 mins
        status: 'active'
    }
];

export function getProgress(squad: SquadDeal) {
    return (squad.currentMembers.length / squad.requiredMembers) * 100;
}
