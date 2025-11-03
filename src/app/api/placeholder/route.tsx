/** @jsxImportSource react */
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import React from 'react';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse dimensions from query params or use defaults
    const width = parseInt(searchParams.get('width') || '1344', 10);
    const height = parseInt(searchParams.get('height') || '768', 10);
    const text = searchParams.get('text') || `${width}×${height}`;
    const bgColor = searchParams.get('bg') || '#1f2937'; // gray-800
    const textColor = searchParams.get('color') || '#9ca3af'; // gray-400

    // Validate dimensions (max 2048x2048 for safety)
    const validWidth = Math.min(Math.max(width, 100), 2048);
    const validHeight = Math.min(Math.max(height, 100), 2048);

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: bgColor,
            fontSize: Math.min(validWidth, validHeight) / 20,
            fontFamily: 'system-ui, sans-serif',
            color: textColor,
            textAlign: 'center',
            padding: '40px',
          }}
        >
          <div style={{ marginBottom: '20px', opacity: 0.6 }}>
            {validWidth} × {validHeight}
          </div>
          <div style={{ fontWeight: '600', opacity: 0.8 }}>{text}</div>
        </div>
      ),
      {
        width: validWidth,
        height: validHeight,
      }
    );
  } catch (error) {
    console.error('[PLACEHOLDER API] Error generating image:', error);
    return new Response('Failed to generate placeholder image', {
      status: 500,
    });
  }
}
