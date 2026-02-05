// Simple GPX parser for running/cycling activities
export async function parseGPX(gpxContent: string): Promise<any> {
  try {
    // Basic regex-based parsing (in production, use a proper XML parser)
    const timeMatch = gpxContent.match(/<time>(.*?)<\/time>/);
    const startDate = timeMatch ? new Date(timeMatch[1]).toISOString() : new Date().toISOString();

    // Extract track points
    const trkptMatches = [...gpxContent.matchAll(/<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>(.*?)<\/trkpt>/gs)];
    
    if (trkptMatches.length === 0) {
      throw new Error('No track points found in GPX file');
    }

    let totalDistance = 0;
    let elevationGain = 0;
    let heartRates: number[] = [];
    let speeds: number[] = [];
    let prevLat: number | null = null;
    let prevLon: number | null = null;
    let prevEle: number | null = null;
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    
    // Buffer for elevation smoothing (moving average)
    let elevationBuffer: number[] = [];
    const ELEVATION_WINDOW = 3; // Fenêtre réduite pour moins de lissage
    const ELEVATION_THRESHOLD = 0.3; // Seuil bas pour capturer plus de montées

    for (const match of trkptMatches) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      const content = match[3];

      // Extract elevation
      const eleMatch = content.match(/<ele>([\d.]+)<\/ele>/);
      const ele = eleMatch ? parseFloat(eleMatch[1]) : null;

      // Add to elevation buffer for smoothing
      if (ele !== null) {
        elevationBuffer.push(ele);
        if (elevationBuffer.length > ELEVATION_WINDOW) {
          elevationBuffer.shift(); // Remove oldest value
        }
        
        // Calculate smoothed elevation (moving average)
        const smoothedEle = elevationBuffer.reduce((a, b) => a + b, 0) / elevationBuffer.length;
        
        // Calculate elevation gain with smoothed values and minimum threshold
        if (prevEle !== null && smoothedEle > prevEle) {
          const elevationDiff = smoothedEle - prevEle;
          // Only count significant climbs (> ELEVATION_THRESHOLD after smoothing)
          if (elevationDiff > ELEVATION_THRESHOLD) {
            elevationGain += elevationDiff;
          }
        }
        
        prevEle = smoothedEle;
      }

      // Extract heart rate
      const hrMatch = content.match(/<ns3:hr>(\d+)<\/ns3:hr>|<hr>(\d+)<\/hr>/);
      const hr = hrMatch ? parseInt(hrMatch[1] || hrMatch[2]) : null;
      if (hr) heartRates.push(hr);

      // Extract time
      const timeMatch = content.match(/<time>(.*?)<\/time>/);
      if (timeMatch) {
        const pointTime = new Date(timeMatch[1]);
        if (!startTime) startTime = pointTime;
        endTime = pointTime;
      }

      // Calculate distance using Haversine formula
      if (prevLat !== null && prevLon !== null) {
        const R = 6371; // Earth radius in km
        const dLat = toRad(lat - prevLat);
        const dLon = toRad(lon - prevLon);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(prevLat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        totalDistance += distance;
      }

      prevLat = lat;
      prevLon = lon;
    }

    // Calculate duration in seconds
    const duration = startTime && endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;

    // Calculate average heart rate
    const avgHeartRate = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : null;
    const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : null;

    // Calculate average speed and pace (duration is in seconds)
    const durationInHours = duration / 3600;
    const avgSpeed = durationInHours > 0 ? (totalDistance / durationInHours).toFixed(2) : null;
    const durationInMinutes = duration / 60;
    const avgPaceMinPerKm = totalDistance > 0 && durationInMinutes > 0 ? durationInMinutes / totalDistance : null;
    const avgPace = avgPaceMinPerKm
      ? `${Math.floor(avgPaceMinPerKm)}:${String(Math.round((avgPaceMinPerKm % 1) * 60)).padStart(2, '0')}`
      : null;

    // Detect activity type based on speed (rough estimate)
    let activityType = 'running';
    if (avgSpeed && parseFloat(avgSpeed) > 20) {
      activityType = 'cycling';
    } else if (avgSpeed && parseFloat(avgSpeed) < 8) {
      activityType = 'walking';
    }

    // Extract title from GPX name tag
    const nameMatch = gpxContent.match(/<name>(.*?)<\/name>/);
    const title = nameMatch ? nameMatch[1] : `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} Activity`;

    return {
      activityType,
      title,
      startDate,
      duration,
      distance: parseFloat(totalDistance.toFixed(2)),
      elevationGain: parseFloat(elevationGain.toFixed(2)),
      avgHeartRate,
      maxHeartRate,
      avgPace,
      avgSpeed: avgSpeed ? parseFloat(avgSpeed) : null,
      calories: null, // Not available in basic GPX
    };
  } catch (error) {
    console.error('GPX parsing error:', error);
    throw new Error('Failed to parse GPX file');
  }
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
