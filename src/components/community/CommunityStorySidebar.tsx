"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

interface Character {
  id: string;
  name: string;
  role: string | null;
  summary: string | null;
  imageUrl: string | null;
  isMain: boolean | null;
}

interface Setting {
  id: string;
  name: string;
  description: string | null;
  mood: string | null;
  imageUrl: string | null;
}

interface CommunityStorySidebarProps {
  currentStoryId: string;
  characters: Character[];
  settings: Setting[];
}

export function CommunityStorySidebar({ currentStoryId, characters, settings }: CommunityStorySidebarProps) {
  return (
    <div className="space-y-4">
      {/* Back to Community Hub */}
      <Card>
        <CardContent className="p-4">
          <Link
            href="/community"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
          >
            <span>←</span>
            <span>Community Hub</span>
          </Link>
        </CardContent>
      </Card>

      {/* Characters Section */}
      {characters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>👥</span>
              Characters ({characters.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {characters.map((character) => (
              <div key={character.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {/* Character Image */}
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {character.imageUrl ? (
                    <Image
                      src={character.imageUrl}
                      alt={character.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      👤
                    </div>
                  )}
                </div>

                {/* Character Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {character.name}
                    </h4>
                    {character.isMain && (
                      <Badge variant="default" className="text-xs px-1 py-0">
                        Main
                      </Badge>
                    )}
                  </div>
                  {character.role && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      {character.role}
                    </p>
                  )}
                  {character.summary && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {character.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Settings Section */}
      {settings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>🏞️</span>
              Settings ({settings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {settings.map((setting) => (
              <div key={setting.id} className="rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 transition-all">
                {/* Setting Image */}
                {setting.imageUrl && (
                  <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={setting.imageUrl}
                      alt={setting.name}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  </div>
                )}

                {/* Setting Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                    {setting.name}
                  </h4>
                  {setting.mood && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                      {setting.mood}
                    </p>
                  )}
                  {setting.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {setting.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Community Guidelines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>📋</span>
            Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span>✅</span>
              <span>Be respectful to all community members</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🚫</span>
              <span>No spoilers without proper tags</span>
            </div>
            <div className="flex items-start gap-2">
              <span>💡</span>
              <span>Share theories and discussions</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🎨</span>
              <span>Fan art and creative content welcome</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}