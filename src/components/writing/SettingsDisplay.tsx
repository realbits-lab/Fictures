"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { BeautifulJSONDisplay } from "./BeautifulJSONDisplay";

interface Setting {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  significance?: string;
  atmosphere?: string;
  timeOfDay?: string;
}

interface SettingsDisplayProps {
  storyData: any;
}

export function SettingsDisplay({ storyData }: SettingsDisplayProps) {
  const [dbSettings, setDbSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);

  // Get story ID from the storyData
  const storyId = storyData?.story?.story_id || storyData?.story_id;

  // Fetch settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      if (!storyId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/studio/api/stories/${storyId}/settings`);
        if (response.ok) {
          const data = await response.json();
          // The API returns { settings: [...] }
          setDbSettings(data.settings || []);
        } else {
          console.error('Failed to fetch settings:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [storyId]);

  // Extract settings from story data (HNS format)
  const hnsSettings = storyData?.setting || storyData?.settings || {
    primary: [],
    secondary: []
  };

  // Combine database settings with HNS settings for display
  const allSettings = [...dbSettings];

  // Add HNS settings that might not be in database yet
  const allHnsLocations = (hnsSettings.primary || []).concat(hnsSettings.secondary || []);
  allHnsLocations.forEach((location: string, index: number) => {
    const existingSetting = dbSettings.find(setting => setting.name.toLowerCase() === location.toLowerCase());
    if (!existingSetting) {
      allSettings.push({
        id: `hns-${location}-${index}`,
        name: location.charAt(0).toUpperCase() + location.slice(1),
        description: "To be detailed",
        type: (hnsSettings.primary || []).includes(location) ? "Primary Location" : "Secondary Location",
        significance: "To be defined"
      });
    }
  });

  // Create enriched settings data
  const enrichedSettings = {
    primary_locations: hnsSettings.primary || [],
    secondary_locations: hnsSettings.secondary || [],
    time_period: storyData?.time_period || "Contemporary",
    atmosphere: storyData?.atmosphere || "To be defined",
    world_building: {
      geography: storyData?.geography || "To be described",
      culture: storyData?.culture || "To be developed",
      technology: storyData?.technology || "Modern day",
      society: storyData?.society || "To be explored"
    },
    all_settings: allSettings
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
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              Total Settings: <span className="font-semibold">{allSettings.length}</span>
            </div>
            <div>
              With Images: <span className="font-semibold">{allSettings.filter(setting => setting.imageUrl).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading settings...</p>
          </CardContent>
        </Card>
      )}

      {/* Individual setting cards with images - DISPLAY FIRST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allSettings.map((setting) => (
          <Card key={setting.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{setting.name}</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {setting.type || "Location"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Setting Image - Full size without cropping */}
              {setting.imageUrl && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setting.imageUrl}
                    alt={setting.name}
                    className="w-full h-auto rounded-md"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {setting.description && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</h4>
                  <p className="text-sm">{setting.description}</p>
                </div>
              )}

              {setting.significance && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Significance</h4>
                  <p className="text-sm">{setting.significance}</p>
                </div>
              )}

              {setting.atmosphere && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Atmosphere</h4>
                  <p className="text-sm">{setting.atmosphere}</p>
                </div>
              )}

              {setting.timeOfDay && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Time of Day</h4>
                  <p className="text-sm italic">{setting.timeOfDay}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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

      {/* Display settings JSON data - DISPLAY LAST */}
      <BeautifulJSONDisplay
        title="Settings Details (JSON)"
        icon="📍"
        data={enrichedSettings}
      />
    </div>
  );
}