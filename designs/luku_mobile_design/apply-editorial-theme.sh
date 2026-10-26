#!/bin/bash

# Batch script to apply editorial theme (black background, white text, green accents) to all remaining components

find ./src/app/components -name "*.tsx" -type f ! -name "Home.tsx" ! -name "AIRecommendations.tsx" ! -name "Marketplace.tsx" ! -name "ProductDetail.tsx" ! -name "Discover.tsx" ! -name "BottomNav.tsx" ! -path "*/common/*" ! -path "*/figma/*" -exec sed -i \
  -e 's/bg-\[#FAFAFA\]/bg-black/g' \
  -e 's/bg-\[#F5F5F5\]/bg-white\/5/g' \
  -e 's/text-black text-/text-white text-/g' \
  -e 's/text-black font-/text-white font-/g' \
  -e 's/text-black\/70/text-white\/70/g' \
  -e 's/text-black\/60/text-white\/60/g' \
  -e 's/text-black\/50/text-white\/50/g' \
  -e 's/text-black\/40/text-white\/40/g' \
  -e 's/bg-white border-2 border-black\/30/bg-white\/5 backdrop-blur-sm border border-white\/10/g' \
  -e 's/bg-white rounded/bg-white\/10 backdrop-blur-sm border border-white\/20 rounded/g' \
  -e 's/border-black\/30/border-white\/20/g' \
  -e 's/border-black\/20/border-white\/10/g' \
  -e 's/border-black\/10/border-white\/5/g' \
  -e 's/bg-black text-white/bg-white text-black/g' \
  -e 's/placeholder:text-black\/40/placeholder:text-white\/40/g' \
  {} +

echo "Editorial theme applied to remaining components"
