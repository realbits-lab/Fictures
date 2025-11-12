"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui";

export function HomeHero() {
    return (
        <div className="bg-gradient-to-b from-[rgb(var(--color-primary)/10%)] to-[rgb(var(--color-background))] py-20">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold text-[rgb(var(--color-foreground))] mb-6">
                        <span className="text-5xl md:text-7xl">📖</span>
                        <br />
                        Welcome to{" "}
                        <span className="text-[rgb(var(--color-primary))]">
                            Fictures
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-[rgb(var(--color-muted-foreground))] mb-8 leading-relaxed">
                        Your AI-powered creative writing companion. Craft
                        amazing stories, manage your writing projects, and
                        connect with a community of passionate writers.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/stories">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto text-lg px-8 py-4"
                            >
                                📚 View My Stories
                            </Button>
                        </Link>
                        <Link href="/community">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="w-full sm:w-auto text-lg px-8 py-4"
                            >
                                💬 Join Community
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
