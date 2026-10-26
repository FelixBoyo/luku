# LUKU User Engagement Analytics System

## Overview

The LUKU User Engagement Analytics System provides comprehensive insights into user behavior, feature adoption, and platform engagement. This system analyzes data from existing database tables to generate actionable recommendations for product development and marketing strategies.

## Features

### 1. **Comprehensive User Metrics**
- **Total Users**: Aggregate count of all platform users
- **Active Users**: Users with activity in the last 30 days
- **New Users**: Users who joined in the selected time period
- **Engagement Score**: 0-100 score based on overall platform engagement

### 2. **Feature Usage Analysis**
Tracks usage across all major platform features:
- Wardrobe Management
- Outfit Suggestions
- Albums
- Trip Planner
- Style Playground
- Marketplace
- Business Accounts

For each feature, the system tracks:
- Total usage count
- Unique user count
- Usage trends
- Growth rates

### 3. **Wardrobe Insights**
- Total wardrobe items across all users
- Average items per user
- Most popular categories
- Most popular colors
- Items added in selected period

### 4. **Outfit Statistics**
- Total saved outfits
- Average outfits per user
- Outfit favorite rate (percentage of generated outfits that are favorited)
- Outfits created in selected period

### 5. **Marketplace Performance**
- Total products listed
- Total orders
- Total revenue
- Average order value
- Wishlist additions

### 6. **Actionable Recommendations Engine**

The system automatically generates recommendations based on analytics data:

#### Recommendation Types:
- **Feature**: Suggestions for new features or feature improvements
- **Marketing**: Strategies to improve user acquisition and engagement
- **Development**: Technical improvements and optimizations
- **UX**: User experience enhancements

#### Priority Levels:
- **High**: Critical issues requiring immediate attention
- **Medium**: Important improvements with significant impact
- **Low**: Nice-to-have enhancements

#### Example Recommendations:
- "Improve User Onboarding" (when engagement score < 40)
- "Promote Underutilized Features" (features used by < 10% of users)
- "Improve Outfit Suggestion Quality" (when favorite rate < 30%)
- "Simplify Wardrobe Upload Process" (when average items < 10)
- "Leverage High Engagement for Growth" (when engagement score > 70)

## Technical Implementation

### Files Created/Modified

1. **`store/slices/userEngagementSlice.ts`**
   - Redux slice for user engagement analytics
   - Async thunk `fetchUserEngagementAnalytics` that aggregates data from multiple tables
   - Helper functions for calculating engagement scores and generating recommendations

2. **`components/UserEngagementAnalytics.tsx`**
   - Comprehensive analytics dashboard component
   - Visualizes all metrics with charts and progress bars
   - Displays recommendations with priority indicators

3. **`store/store.ts`**
   - Added `userEngagement` reducer to the Redux store

4. **`types.ts`**
   - Added `Tab.UserAnalytics` enum value

5. **`App.tsx`**
   - Integrated UserEngagementAnalytics component
   - Added route handling for analytics tab

6. **`components/MoreMenu.tsx`**
   - Added "User Analytics" option to the more menu

## Data Sources

The analytics system aggregates data from the following database tables:

- `clothing_items` - Wardrobe management data
- `outfits` - Outfit creation and saving
- `albums` - Album organization
- `album_outfits` - Outfit favoriting (via album associations)
- `trips` - Trip planning usage
- `style_playground_sessions` - Style Playground activity
- `products` - Marketplace listings
- `orders` - Purchase data
- `wishlist` - Product wishlist data
- `business_accounts` - Business account creation

## Engagement Score Calculation

The engagement score (0-100) is calculated based on:

1. **Active User Rate** (30 points)
   - Percentage of total users active in last 30 days

2. **Wardrobe Engagement** (20 points)
   - Average items per user (50 items = full score)

3. **Outfit Creation** (20 points)
   - Average outfits per user (20 outfits = full score)

4. **Feature Diversity** (15 points)
   - Number of features being used (8 features = full score)

5. **Marketplace Engagement** (15 points)
   - Total orders placed (100 orders = full score)

## Usage

### Accessing Analytics

1. Navigate to the "More" menu in the main navigation
2. Click on "User Analytics"
3. Select a time period (Daily, Weekly, Monthly, or All)
4. Review metrics and recommendations

### Time Periods

- **Daily**: Data from today
- **Weekly**: Data from last 7 days
- **Monthly**: Data from current month
- **All**: All historical data

## Future Enhancements

### Potential Improvements:

1. **Event Tracking System**
   - Implement client-side event tracking for more granular analytics
   - Track feature interactions, button clicks, and user flows
   - Measure session duration and user paths

2. **Advanced Visualizations**
   - Line charts for trends over time
   - Pie charts for feature distribution
   - Heatmaps for user activity patterns

3. **Cohort Analysis**
   - Track user behavior by signup cohort
   - Identify retention patterns
   - Measure feature adoption by user segment

4. **A/B Testing Integration**
   - Track experiment performance
   - Measure feature impact on engagement
   - Optimize based on data

5. **Export Functionality**
   - Export analytics reports as PDF/CSV
   - Schedule automated reports
   - Share insights with stakeholders

6. **Real-time Updates**
   - WebSocket integration for live metrics
   - Real-time dashboard updates
   - Alert system for significant changes

7. **Predictive Analytics**
   - Churn prediction
   - Feature usage forecasting
   - Revenue projections

## Notes

- The current implementation estimates user counts from database records rather than using the admin API (which requires service role key)
- Some metrics (like conversion rate) require additional tracking infrastructure
- Session duration tracking would require implementing session management
- The system is designed to be extensible for future enhancements

## Access Control

Currently, all authenticated users can access the analytics dashboard. In production, you may want to:
- Restrict access to admin users only
- Implement role-based access control
- Add audit logging for analytics access
