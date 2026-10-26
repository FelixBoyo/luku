export interface ClothingItem {
    id: string;
    imageUrl: string;
    name: string;
    category: string;
    color: string;
    style: string;
    season: string;
    dateAdded: number;
    useCount: number;
    status: 'clean' | 'in wash' | 'dirty';
}

export interface Outfit {
    id: string;
    outfitName: string;
    description: string;
    items: ClothingItem[];
    dateFavorited?: number;
    feedback?: 'liked' | 'disliked';
}

export interface Album {
    id: string;
    name: string;
    outfits: Outfit[];
}

export interface FashionTrend {
    trendName: string;
    description: string;
    outfits: Outfit[];
}

export interface StyleAnalysis {
    coreStyleProfile: {
        keywords: string[];
        topColors: string[];
        topCategories: string[];
    };
    styleEvolutionNarrative: string;
    recommendations: {
        title: string;
        suggestion: string;
    }[];
}

export interface BudgetSuggestion {
    itemName: string;
    itemType: string;
    description: string;
    estimatedPriceRange: string;
    pairingSuggestions: {
        outfitName: string;
        existingItemNames: string[];
    }[];
}

export interface ColorAnalysis {
    baseItemColor: string;
    colorTheoryExplanation: string;
    suggestedOutfits: Outfit[];
}

export interface ActionableTip {
    title: string;
    description: string;
}

export interface SustainabilityInsights {
    sustainabilityScore: number;
    scoreJustification: string;
    suggestedOutfits: Outfit[];
    actionableTips: ActionableTip[];
}

export interface DailyPlan {
    day: number;
    title: string;
    description: string;
    outfits: Outfit[];
}

export interface TripPlan {
    packingList: string[]; // Just item names
    dailyPlans: DailyPlan[];
}

export interface Trip {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    notes: string;
    plan: TripPlan | null;
}

export interface StyleSanctuaryContent {
    dailyAffirmation: string;
    guidedExercise: {
        title: string;
        description: string;
        steps: string[];
    };
    styleArticle: {
        title: string;
        content: string;
    };
}

export interface StyleGoal {
    id: string;
    text: string;
    completed: boolean;
}

export enum Tab {
    LifestyleHub = 'lifestyleHub',
    Wardrobe = 'wardrobe',
    Suggestions = 'suggestions',
    Albums = 'albums',
    Trends = 'trends',
    Evolution = 'evolution',
    ColorHarmony = 'colorHarmony',
    TripPlanner = 'tripPlanner',
    VirtualTryOn = 'virtualTryOn',
    StylePlayground = 'stylePlayground',
    Marketplace = 'marketplace',
    SellerDashboard = 'sellerDashboard',
    Discover = 'discover',
    UserAnalytics = 'userAnalytics',
    Wishlist = 'wishlist',
    MyOrders = 'myOrders',
    Returns = 'returns',
}

export enum DiscoverSubTab {
    Suggestions = 'suggestions',
    Trends = 'trends',
    StyleDNA = 'styleDNA',
}

export interface StylePlaygroundSession {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface StyleQuery {
    id: string;
    session_id: string;
    user_id: string;
    query_text: string;
    ai_prompt: string;
    image_url?: string;
    created_at: string;
}

export interface StyleCustomization {
    id: string;
    query_id: string;
    user_id: string;
    customization_type:
        | 'style_fusion'
        | 'color_palette'
        | 'occasion'
        | 'intensity';
    customization_value: string;
    created_at: string;
}

export interface MannequinSettings {
    id: string;
    user_id: string;
    body_type: 'slim' | 'average' | 'athletic' | 'plus-size';
    height_cm: number;
    chest_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    skin_tone: 'fair' | 'light' | 'medium' | 'tan' | 'brown' | 'dark';
    created_at: string;
    updated_at: string;
}

export interface UserProfileImage {
    id: string;
    user_id: string;
    image_url: string;
    is_default: boolean;
    created_at: string;
}

export enum TryOnMode {
    UserImage = 'user_image',
    NewUpload = 'new_upload',
    Mannequin = 'mannequin',
}

export interface BusinessAccount {
    id: string;
    user_id: string;
    business_name: string;
    business_description: string;
    logo_url?: string;
    banner_url?: string;
    contact_email: string;
    is_verified: boolean;
    stripe_account_id?: string;
    created_at: string;
    updated_at: string;
}

export interface SellerKyc {
    id: string;
    user_id: string;
    legal_name: string;
    phone: string;
    address_line1: string;
    city: string;
    state_region?: string;
    postal_code: string;
    country: string;
    date_of_birth?: string;
    id_type?: string;
    id_number?: string;
    created_at: string;
    updated_at: string;
}

export interface BusinessKyc {
    id: string;
    business_id: string;
    legal_entity_name: string;
    address_line1: string;
    city: string;
    state_region?: string;
    postal_code: string;
    country: string;
    registration_number?: string;
    representative_legal_name: string;
    representative_phone: string;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    business_id: string;
    tags?: string[];
    name: string;
    description: string;
    price: number;
    category: string;
    color: string;
    style: string;
    season: string;
    size: string;
    stock_quantity: number;
    image_urls: string[];
    is_featured: boolean;
    is_active: boolean;
    average_rating?: number;
    review_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Return {
    id: string;
    order_id: string;
    user_id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'completed';
    refund_amount?: number;
    return_photos?: string[];
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface ShippingAddress {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    [key: string]: any; // Allow additional fields for flexibility
}

export interface Order {
    id: string;
    buyer_id: string;
    seller_id: string;
    product_id: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    shipping_address: ShippingAddress;
    stripe_payment_intent_id: string;
    tracking_number?: string;
    created_at: string;
    updated_at: string;
}

export interface ProductReview {
    id: string;
    product_id: string;
    order_id: string;
    user_id: string;
    rating: number;
    review_text?: string;
    created_at: string;
    updated_at: string;
}

export interface Promotion {
    id: string;
    business_id: string;
    product_id?: string;
    promotion_type: 'discount' | 'bundle' | 'flash_sale';
    discount_percentage?: number;
    discount_amount?: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
}
