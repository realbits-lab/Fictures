"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { BeautifulJSONDisplay } from "./BeautifulJSONDisplay";

interface SettingsDisplayProps {
  storyData: any;
}

export function SettingsDisplay({ storyData }: SettingsDisplayProps) {
  // Extract settings from story data
  const settings = storyData?.setting || storyData?.settings || {
    primary: [],
    secondary: []
  };

  // Create enriched settings data
  const enrichedSettings = {
    primary_locations: settings.primary || [],
    secondary_locations: settings.secondary || [],
    time_period: storyData?.time_period || "Contemporary",
    atmosphere: storyData?.atmosphere || "To be defined",
    world_building: {
      geography: storyData?.geography || "To be described",
      culture: storyData?.culture || "To be developed",
      technology: storyData?.technology || "Modern day",
      society: storyData?.society || "To be explored"
    },
    key_locations: (settings.primary || []).concat(settings.secondary || []).map((location: string) => ({
      name: location,
      description: "To be detailed",
      significance: "To be defined",
      scenes: []
    }))
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🗺️</span>
            Settings & Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Define and manage the settings and locations in your story. This includes primary and secondary locations, atmosphere, and world-building details.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Primary Locations:</span>
              <span className="font-semibold ml-2">{settings.primary?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Secondary Locations:</span>
              <span className="font-semibold ml-2">{settings.secondary?.length || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display settings data in beautiful card format */}
      <BeautifulJSONDisplay
        title="Settings Details"
        icon="📍"
        data={enrichedSettings}
      />

      {/* Location cards */}
      <div className="space-y-4">
        {/* Primary Locations */}
        {settings.primary && settings.primary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Primary Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {settings.primary.map((location: string, index: number) => (
                  <Card key={`primary-${index}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏛️</span>
                        <h4 className="text-sm font-medium">{location}</h4>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">Primary setting location</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Secondary Locations */}
        {settings.secondary && settings.secondary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Secondary Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {settings.secondary.map((location: string, index: number) => (
                  <Card key={`secondary-${index}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏠</span>
                        <h4 className="text-sm font-medium">{location}</h4>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">Secondary setting location</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* World Building Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">World Building</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Time Period</h4>
              <p className="text-sm">{enrichedSettings.time_period}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Atmosphere</h4>
              <p className="text-sm">{enrichedSettings.atmosphere}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Technology Level</h4>
              <p className="text-sm">{enrichedSettings.world_building.technology}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Society Type</h4>
              <p className="text-sm">{enrichedSettings.world_building.society}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}