#!/bin/bash

# Comprehensive fix script for text visibility and animations

# Fix black borders on dark backgrounds (border-[#0A0A0A] -> border-white/20)
find ./src/app/components -name "*.tsx" -type f ! -path "*/common/*" ! -path "*/figma/*" ! -path "*/ui/*" -exec sed -i \
  -e 's/border-3 border-\[#0A0A0A\]/border border-white\/20/g' \
  -e 's/border-4 border-\[#0A0A0A\]/border border-white\/20/g' \
  -e 's/border-2 border-\[#0A0A0A\]/border border-white\/20/g' \
  -e 's/border-\[#0A0A0A\]/border-white\/20/g' \
  {} +

# Fix dashed borders on dark backgrounds
find ./src/app/components -name "*.tsx" -type f ! -path "*/common/*" ! -path "*/figma/*" ! -path "*/ui/*" -exec sed -i \
  -e 's/border-dashed border-black\/40/border-dashed border-white\/40/g' \
  -e 's/border-dashed border-black\/30/border-dashed border-white\/30/g' \
  {} +

# Fix text-black on black backgrounds (change to text-white)
find ./src/app/components -name "*.tsx" -type f ! -path "*/common/*" ! -path "*/figma/*" ! -path "*/ui/*" -exec sed -i \
  -e 's/className="text-black flex/className="text-white flex/g' \
  -e 's/className="text-black font-/className="text-white font-/g' \
  {} +

# Fix bg-black/20 to bg-white/20 on dark backgrounds (for progress bars etc)
find ./src/app/components -name "*.tsx" -type f ! -path "*/common/*" ! -path "*/figma/*" ! -path "*/ui/*" -exec sed -i \
  -e 's/: .bg-black\/20./: "bg-white\/20"/g' \
  {} +

# Fix white backgrounds and heavy borders to editorial style
find ./src/app/components -name "*.tsx" -type f ! -path "*/common/*" ! -path "*/figma/*" ! -path "*/ui/*" -exec sed -i \
  -e 's/bg-white border-2 border-black\/30/bg-white\/10 backdrop-blur-sm border border-white\/20/g' \
  -e 's/bg-white shadow-lg border-4/bg-white\/10 backdrop-blur-sm border border-white\/20/g' \
  {} +

echo "✓ Fixed text visibility issues across all components"
echo "✓ Fixed border colors for dark theme"
echo "✓ Updated backgrounds to glassmorphism style"
