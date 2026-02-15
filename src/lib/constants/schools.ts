export interface School {
    id: string;
    name: string;
    shortName: string;
    location: {
        lat: number;
        lng: number;
    };
    emailDomain?: string;
}

export const SUPPORTED_SCHOOLS: School[] = [
    {
        id: "unilag",
        name: "University of Lagos",
        shortName: "UNILAG",
        location: { lat: 6.5157, lng: 3.3893 },
        emailDomain: "live.unilag.edu.ng"
    },
    {
        id: "oau",
        name: "Obafemi Awolowo University",
        shortName: "OAU",
        location: { lat: 7.5186, lng: 4.5200 },
        emailDomain: "student.oauife.edu.ng"
    },
    {
        id: "ui",
        name: "University of Ibadan",
        shortName: "UI",
        location: { lat: 7.4443, lng: 3.9007 },
        emailDomain: "stu.ui.edu.ng"
    },
    {
        id: "uniben",
        name: "University of Benin",
        shortName: "UNIBEN",
        location: { lat: 6.3350, lng: 5.6037 },
    },
    {
        id: "unn",
        name: "University of Nigeria, Nsukka",
        shortName: "UNN",
        location: { lat: 6.8429, lng: 7.3733 },
    },
    {
        id: "lasu",
        name: "Lagos State University",
        shortName: "LASU",
        location: { lat: 6.4676, lng: 3.1969 },
    },
    {
        id: "futa",
        name: "Federal University of Technology, Akure",
        shortName: "FUTA",
        location: { lat: 7.3037, lng: 5.1320 },
    },
    {
        id: "unilorin",
        name: "University of Ilorin",
        shortName: "UNILORIN",
        location: { lat: 8.4799, lng: 4.6738 },
    },
    {
        id: "abu",
        name: "Ahmadu Bello University",
        shortName: "ABU",
        location: { lat: 11.1497, lng: 7.6391 },
    },
    {
        id: "covenant",
        name: "Covenant University",
        shortName: "CU",
        location: { lat: 6.6713, lng: 3.1583 },
    },
    // Polytechnics & Others
    {
        id: "yabatech",
        name: "Yaba College of Technology",
        shortName: "YABATECH",
        location: { lat: 6.5165, lng: 3.3718 },
    },
    {
        id: "laspotech",
        name: "Lagos State Polytechnic",
        shortName: "LASPOTECH",
        location: { lat: 6.6366, lng: 3.5131 },
    },
    {
        id: "maps",
        name: "Moshood Abiola Polytechnic",
        shortName: "MAPOLY",
        location: { lat: 7.1278, lng: 3.3989 },
    },
    {
        id: "fpn",
        name: "Federal Polytechnic Nekede",
        shortName: "NEKEDE",
        location: { lat: 5.4312, lng: 7.0398 },
    },
    {
        id: "unizik",
        name: "Nnamdi Azikiwe University",
        shortName: "UNIZIK",
        location: { lat: 6.2449, lng: 7.1198 },
    },
    {
        id: "futo",
        name: "Federal University of Technology, Owerri",
        shortName: "FUTO",
        location: { lat: 5.3853, lng: 6.9930 },
    }
];
