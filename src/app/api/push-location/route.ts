/**
 * API Route: POST /api/push-location
 * Broadcasts a location push event to all connected clients via Pusher
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher.server';
import { PUSHER_CHANNELS, PUSHER_EVENTS, PushLocationEvent } from '@/types/pusher';

interface PushLocationRequestBody {
  locationId: number;
  pushedBy?: string;
}

/**
 * Handle POST request to push a location to all viewers
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as PushLocationRequestBody;

    // Validate request
    if (!body.locationId || typeof body.locationId !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: locationId must be a number',
        },
        { status: 400 }
      );
    }

    // Create push event payload
    const pushEvent: PushLocationEvent = {
      locationId: body.locationId,
      pushedBy: body.pushedBy,
      pushedAt: Date.now(),
    };

    // Broadcast to all connected clients via Pusher
    const pusher = getPusherServer();
    await pusher.trigger(
      PUSHER_CHANNELS.LOCATIONS,
      PUSHER_EVENTS.LOCATION_PUSHED,
      pushEvent
    );

    console.log(`[API] Location ${body.locationId} pushed successfully`);

    return NextResponse.json({
      success: true,
      message: 'Location pushed successfully',
    });
  } catch (error) {
    console.error('[API] Error pushing location:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to push location',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
