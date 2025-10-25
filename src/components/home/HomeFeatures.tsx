"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

const readerFeatures = [
  {
    icon: "📚",
    title: "Free Reading",
    description: "Enjoy unlimited access to thousands of stories across all genres, completely free."
  },
  {
    icon: "🔖",
    title: "Smart Bookmarks",
    description: "Never lose your place. Automatically sync your reading progress across devices."
  },
  {
    icon: "💬",
    title: "Engage with Authors",
    description: "Comment on chapters, rate stories, and connect with writers and fellow readers."
  },
  {
    icon: "🎯",
    title: "Personalized Discovery",
    description: "Get story recommendations based on your reading history and preferences."
  }
];

const writerFeatures = [
  {
    icon: "🤖",
    title: "AI Writing Assistant",
    description: "Get intelligent suggestions and writing guidance powered by advanced AI."
  },
  {
    icon: "📊",
    title: "Analytics & Insights",
    description: "Track your story's performance with detailed reader analytics and engagement metrics."
  }
];

export function HomeFeatures() {
  return (
    <div className="py-20 bg-gradient-to-b from-[rgb(var(--background))] to-[rgb(var(--muted)/30%)]">
      <div className="container mx-auto px-4">
        {/* Reader Features */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
              The Best Reading Experience
            </h2>
            <p className="text-xl text-[rgb(var(--muted-foreground))] max-w-2xl mx-auto">
              Everything you need to discover, read, and enjoy web novels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {readerFeatures.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:bg-[rgb(var(--background))] hover:shadow-lg transition-all">
                <div className="text-5xl mb-4">
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

        {/* Divider */}
        <div className="border-t border-[rgb(var(--border))] my-16 max-w-6xl mx-auto"></div>

        {/* Writer Features CTA */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
              Have a Story to Tell?
            </h2>
            <p className="text-xl text-[rgb(var(--muted-foreground))] max-w-2xl mx-auto">
              Join our community of writers and share your stories with thousands of readers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {writerFeatures.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-[rgb(var(--background))] border border-[rgb(var(--border))] hover:border-[rgb(var(--primary))] hover:shadow-lg transition-all">
                <div className="text-5xl mb-4">
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

          <div className="text-center">
            <Link href="/novels">
              <Button size="lg" className="text-lg px-8 py-4">
                ✍️ Start Writing Your Story
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}