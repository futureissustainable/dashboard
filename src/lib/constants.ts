import {
  Cube,
  Lightning,
  Compass,
  Atom,
  Rocket,
  Target,
  Crown,
  Diamond,
  Fire,
  Planet,
  Shield,
  Sword,
  Tree,
  Waves,
  Mountains,
  Moon,
  Sun,
  Star,
  Heart,
  Eye,
  Anchor,
  Binoculars,
  Flask,
  Gear,
  Hexagon,
  Leaf,
  Skull,
  Spiral,
  Triangle,
  Windmill,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export const PROJECT_ICONS: { name: string; component: Icon }[] = [
  { name: "Cube", component: Cube },
  { name: "Lightning", component: Lightning },
  { name: "Compass", component: Compass },
  { name: "Atom", component: Atom },
  { name: "Rocket", component: Rocket },
  { name: "Target", component: Target },
  { name: "Crown", component: Crown },
  { name: "Diamond", component: Diamond },
  { name: "Fire", component: Fire },
  { name: "Planet", component: Planet },
  { name: "Shield", component: Shield },
  { name: "Sword", component: Sword },
  { name: "Tree", component: Tree },
  { name: "Waves", component: Waves },
  { name: "Mountains", component: Mountains },
  { name: "Moon", component: Moon },
  { name: "Sun", component: Sun },
  { name: "Star", component: Star },
  { name: "Heart", component: Heart },
  { name: "Eye", component: Eye },
  { name: "Anchor", component: Anchor },
  { name: "Binoculars", component: Binoculars },
  { name: "Flask", component: Flask },
  { name: "Gear", component: Gear },
  { name: "Hexagon", component: Hexagon },
  { name: "Leaf", component: Leaf },
  { name: "Skull", component: Skull },
  { name: "Spiral", component: Spiral },
  { name: "Triangle", component: Triangle },
  { name: "Windmill", component: Windmill },
];

export const PROJECT_COLORS = [
  { name: "Rust", bg: "#A0522D", text: "#FFFFFF" },
  { name: "Sage", bg: "#6B8E6B", text: "#FFFFFF" },
  { name: "Steel", bg: "#4682B4", text: "#FFFFFF" },
  { name: "Rose", bg: "#C08080", text: "#FFFFFF" },
  { name: "Ochre", bg: "#C49A2A", text: "#000000" },
  { name: "Slate", bg: "#708090", text: "#FFFFFF" },
  { name: "Violet", bg: "#7B68AE", text: "#FFFFFF" },
  { name: "Ember", bg: "#CC5533", text: "#FFFFFF" },
  { name: "Moss", bg: "#4A6741", text: "#FFFFFF" },
  { name: "Copper", bg: "#B87333", text: "#000000" },
  { name: "Dusk", bg: "#5B4A6A", text: "#FFFFFF" },
  { name: "Clay", bg: "#B66A50", text: "#FFFFFF" },
  { name: "Pine", bg: "#3C5A3C", text: "#FFFFFF" },
  { name: "Storm", bg: "#4F6D7A", text: "#FFFFFF" },
  { name: "Sand", bg: "#C2A878", text: "#000000" },
];

export function getRandomIcon(): string {
  return PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)].name;
}

export function getRandomColor(): { name: string; bg: string; text: string } {
  return PROJECT_COLORS[
    Math.floor(Math.random() * PROJECT_COLORS.length)
  ];
}

export function getIconComponent(name: string): Icon {
  const found = PROJECT_ICONS.find((i) => i.name === name);
  return found ? found.component : Cube;
}
