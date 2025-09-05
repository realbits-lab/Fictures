"use client";

import React from "react";

const features = [
  {
    icon: "🤖",
    title: "AI Writing Assistant",
    description: "Get intelligent suggestions, plot ideas, and writing guidance powered by advanced AI technology."
  },
  {
    icon: "📊", 
    title: "Progress Tracking",
    description: "Monitor your writing goals, track word counts, and visualize your progress across all projects."
  },
  {
    icon: "🎭",
    title: "Character Management", 
    description: "Create detailed character profiles, track relationships, and maintain story consistency."
  },
  {
    icon: "💬",
    title: "Community Support",
    description: "Connect with fellow writers, share your work, and get feedback from a supportive community."
  },
  {
    icon: "📝",
    title: "Rich Writing Tools",
    description: "Advanced editor with formatting, scene planning, and chapter organization features."
  },
  {
    icon: "📤",
    title: "Easy Publishing",
    description: "Share your stories with readers and manage your publishing schedule effortlessly."
  }
];

export function HomeFeatures() {
  return (
    <div className="py-20 bg-[rgb(var(--background))]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
            Everything You Need to Write
          </h2>
          <p className="text-xl text-[rgb(var(--muted-foreground))] max-w-2xl mx-auto">
            Fictures provides all the tools and features you need to bring your stories to life.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg hover:bg-[rgb(var(--muted)/30%)] transition-colors">
              <div className="text-4xl mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-3">
                {feature.title}
              </h3>
              <p className="text-[rgb(var(--muted-foreground))] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}