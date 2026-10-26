#!/bin/bash

# Script to update LUKU theme from earth tones to black/white/green

find ./src/app/components -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-\[#F7F3EE\]/bg-[#FAFAFA]/g' \
  -e 's/bg-\[#EFE7DD\]/bg-[#F5F5F5]/g' \
  -e 's/text-\[#593622\]/text-black/g' \
  -e 's/bg-\[#593622\]/bg-black/g' \
  -e 's/bg-\[#F2B872\]/bg-[#00FF88]/g' \
  -e 's/text-\[#F2B872\]/text-[#00FF88]/g' \
  -e 's/fill-\[#F2B872\]/fill-[#00FF88]/g' \
  -e 's/border-\[#F2B872\]/border-[#00FF88]/g' \
  -e 's/text-\[#D98C4A\]/text-[#00FF88]/g' \
  -e 's/bg-\[#D98C4A\]/bg-[#39FF14]/g' \
  -e 's/border-\[#A65A2E\]/border-black/g' \
  -e 's/bg-\[#6B4329\]/bg-[#1A1A1A]/g' \
  -e 's/hover:bg-\[#6B4329\]/hover:bg-[#1A1A1A]/g' \
  -e 's/#593622/#0A0A0A/g' \
  -e 's/#F2B872/#00FF88/g' \
  -e 's/#D98C4A/#39FF14/g' \
  -e 's/#A65A2E/#000000/g' \
  -e 's/#F7F3EE/#FAFAFA/g' \
  -e 's/#EFE7DD/#F5F5F5/g' \
  {} +

echo "Theme update complete!"
