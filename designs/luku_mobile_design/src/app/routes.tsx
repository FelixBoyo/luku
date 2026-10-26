import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Home } from "./components/Home";
import { Discover } from "./components/Discover";
import { Wardrobe } from "./components/Wardrobe";
import { Marketplace } from "./components/Marketplace";
import { AIRecommendations } from "./components/AIRecommendations";
import { Profile } from "./components/Profile";
import { UserProfile } from "./components/UserProfile";
import { CartCheckout } from "./components/CartCheckout";
import { ProductDetail } from "./components/ProductDetail";
import { Wishlist } from "./components/Wishlist";
import { WardrobeItemDetail } from "./components/WardrobeItemDetail";
import { SignIn } from "./components/SignIn";
import { SignUp } from "./components/SignUp";
import { Onboarding } from "./components/Onboarding";
import { Help } from "./components/Help";
import { Sell } from "./components/Sell";
import { Inbox } from "./components/Inbox";
import { Me } from "./components/Me";
import { Settings } from "./components/Settings";
import { Splash } from "./components/Splash";
import { PasswordReset } from "./components/PasswordReset";
import { ListingConfirmation } from "./components/ListingConfirmation";
import { OrderConfirmation } from "./components/OrderConfirmation";
import { Conversation } from "./components/Conversation";
import { EditProfile } from "./components/EditProfile";
import { ComingSoon } from "./components/ComingSoon";
import { OnboardingComplete } from "./components/OnboardingComplete";
import { OrderTracking } from "./components/OrderTracking";
import { Payment } from "./components/Payment";
import { Stylist } from "./components/Stylist";
import { BrandDetail } from "./components/BrandDetail";
import { StyleDetail } from "./components/StyleDetail";
import { Landing } from "./components/Landing";
import { VirtualTryOn } from "./components/VirtualTryOn";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      // Authentication & Onboarding
      { path: "landing", Component: Landing },
      { path: "splash", Component: Splash },
      { path: "sign-in", Component: SignIn },
      { path: "sign-up", Component: SignUp },
      { path: "password-reset", Component: PasswordReset },
      { path: "onboarding", Component: Onboarding },
      { path: "onboarding-complete", Component: OnboardingComplete },

      // Main App
      { index: true, Component: Home },
      { path: "discover", Component: Discover },
      { path: "marketplace", Component: Marketplace },
      { path: "ai-recommendations", Component: AIRecommendations },
      { path: "product/:id", Component: ProductDetail },

      // Digital Wardrobe
      { path: "wardrobe", Component: Wardrobe },
      { path: "wardrobe-item/:id", Component: WardrobeItemDetail },

      // Commerce & Checkout
      { path: "sell", Component: Sell },
      { path: "listing-confirmation", Component: ListingConfirmation },
      { path: "cart", Component: CartCheckout },
      { path: "order-confirmation", Component: OrderConfirmation },
      { path: "order-tracking/:orderId", Component: OrderTracking },
      { path: "payment", Component: Payment },
      { path: "wishlist", Component: Wishlist },

      // User Profiles
      { path: "me", Component: Me },
      { path: "edit-profile", Component: EditProfile },
      { path: "profile", Component: Profile },
      { path: "user/:userId", Component: UserProfile },

      // Inbox & Messaging
      { path: "inbox", Component: Inbox },
      { path: "conversation/:id", Component: Conversation },

      // Secondary Navigation
      { path: "settings", Component: Settings },
      { path: "help", Component: Help },

      // AI Stylist
      { path: "stylist", Component: Stylist },

      // Brand & Style Details
      { path: "brand/:brandId", Component: BrandDetail },
      { path: "style/:styleId", Component: StyleDetail },

      // Coming Soon Placeholder
      { path: "virtual-try-on", Component: VirtualTryOn },
      { path: "coming-soon", Component: ComingSoon },
    ],
  },
]);
