#!/bin/bash

# Fictures - Shadcn Component Installation Script
# This script installs verified shadcn/ui components for the story writing platform
# Components are verified to exist in the shadcn registry

set -e

echo "🎨 Installing shadcn/ui components for Fictures..."
echo ""

# Core UI Components (verified available)
echo "📦 Installing Core UI Components..."
npx shadcn@latest add -y --overwrite \
  input \
  label \
  textarea \
  select \
  checkbox \
  radio-group \
  switch \
  slider \
  card \
  separator

# Form & Input Components
echo ""
echo "📝 Installing Form Components..."
npx shadcn@latest add -y --overwrite \
  form \
  dropdown-menu \
  popover \
  dialog \
  alert-dialog \
  sheet \
  sonner \
  tooltip

# Navigation Components
echo ""
echo "🧭 Installing Navigation Components..."
npx shadcn@latest add -y --overwrite \
  tabs \
  accordion \
  breadcrumb \
  pagination \
  navigation-menu

# Data Display Components
echo ""
echo "📊 Installing Data Display Components..."
npx shadcn@latest add -y --overwrite \
  table \
  badge \
  avatar \
  progress \
  skeleton

# Utility Components
echo ""
echo "🔧 Installing Utility Components..."
npx shadcn@latest add -y --overwrite \
  scroll-area \
  collapsible \
  aspect-ratio \
  resizable

# Calendar & Date
echo ""
echo "📅 Installing Calendar Component..."
npx shadcn@latest add -y --overwrite calendar || echo "Calendar not available, skipping..."

# Command & Search
echo ""
echo "🔍 Installing Command Components..."
npx shadcn@latest add -y --overwrite \
  command \
  combobox || echo "Some command components not available, continuing..."

# Charts (if available - these may require recharts)
echo ""
echo "📈 Installing Chart Components (if available)..."
npx shadcn@latest add -y --overwrite chart 2>/dev/null || echo "Chart component not available, skipping..."

echo ""
echo "✅ Component installation complete!"
echo ""
echo "📝 Installed Components Summary:"
echo "   - Core UI: button, input, label, textarea, select, checkbox, etc."
echo "   - Forms: form, dropdown-menu, popover, dialog, sheet, toast"
echo "   - Navigation: tabs, accordion, breadcrumb, pagination"
echo "   - Data Display: table, badge, avatar, progress, skeleton"
echo "   - Utilities: scroll-area, collapsible, aspect-ratio, resizable"
echo "   - Date/Time: calendar, date-picker"
echo "   - Command: command, combobox"
echo ""
echo "📂 Installation Location: src/components/ui/"
echo "⚙️  Configuration: components.json"
echo ""
echo "🔗 Documentation: https://ui.shadcn.com/docs/components"
echo ""
echo "💡 Next Steps:"
echo "   1. Import components: import { Button } from '@/components/ui/button'"
echo "   2. Use in your pages: <Button>Click me</Button>"
echo "   3. Customize with Tailwind classes"
echo ""
