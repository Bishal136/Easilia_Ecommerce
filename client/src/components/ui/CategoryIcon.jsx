import React from "react";
import {
  Keyboard,
  Laptop,
  Smartphone,
  Mouse,
  Headphones,
  Camera,
  Watch,
  Gamepad2,
  Tv,
  Speaker,
  Cpu,
  Plug,
  Shirt,
  ShoppingBag,
  Sparkles,
  Glasses,
  Footprints,
  Sofa,
  Home,
  Utensils,
  Coffee,
  Lamp,
  Bath,
  Apple,
  Pizza,
  Wine,
  Salad,
  HeartPulse,
  Activity,
  Scissors,
  Smile,
  Dumbbell,
  Bike,
  Trophy,
  Target,
  Tent,
  Baby,
  ToyBrick,
  BookOpen,
  Palette,
  Package,
  Tag,
  Gift,
  Truck,
  Store,
  Wrench,
  Shield,
  Zap,
  Folder,
  FolderOpen,
  Monitor,
  Flame,
  Radio,
  Percent,
} from "lucide-react";

export const LUCIDE_ICON_MAP = {
  keyboard: Keyboard,
  laptop: Laptop,
  monitor: Monitor,
  smartphone: Smartphone,
  mouse: Mouse,
  headphones: Headphones,
  camera: Camera,
  watch: Watch,
  gamepad: Gamepad2,
  tv: Tv,
  speaker: Speaker,
  cpu: Cpu,
  plug: Plug,
  radio: Radio,
  shirt: Shirt,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  glasses: Glasses,
  footprints: Footprints,
  sofa: Sofa,
  home: Home,
  utensils: Utensils,
  coffee: Coffee,
  lamp: Lamp,
  bath: Bath,
  apple: Apple,
  pizza: Pizza,
  wine: Wine,
  salad: Salad,
  "heart-pulse": HeartPulse,
  activity: Activity,
  scissors: Scissors,
  smile: Smile,
  dumbbell: Dumbbell,
  bike: Bike,
  trophy: Trophy,
  target: Target,
  tent: Tent,
  baby: Baby,
  "toy-brick": ToyBrick,
  "book-open": BookOpen,
  palette: Palette,
  package: Package,
  tag: Tag,
  gift: Gift,
  truck: Truck,
  store: Store,
  wrench: Wrench,
  shield: Shield,
  zap: Zap,
  folder: Folder,
  "folder-open": FolderOpen,
  flame: Flame,
  percent: Percent,
};

export const CategoryIcon = ({ icon, image, className = "w-5 h-5", textClassName = "text-base" }) => {
  // 1. If Category has image URL
  if (image?.url || (typeof image === "string" && image.startsWith("http"))) {
    const src = image?.url || image;
    return (
      <img
        src={src}
        alt="Category icon"
        className={`${className} object-cover rounded-md`}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  }

  // 2. If icon matches Lucide icon keyword
  if (icon && typeof icon === "string") {
    const cleanKey = icon.toLowerCase().trim().replace(/^lucide:/, "");
    const LucideComponent = LUCIDE_ICON_MAP[cleanKey];
    if (LucideComponent) {
      return <LucideComponent className={className} />;
    }
  }

  // 3. Fallback to Emoji or string icon
  return (
    <span className={`inline-flex items-center justify-center leading-none ${textClassName}`}>
      {icon || "📁"}
    </span>
  );
};

export default CategoryIcon;
