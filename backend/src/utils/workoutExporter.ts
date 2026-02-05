// Utilities to export workout sessions to various formats for GPS watches

interface Block {
  type: string;
  duration: number;
  intensity: string;
  pace?: string;
  speed?: string;
  heartRate?: string;
  repetitions?: number;
}

interface WorkoutSession {
  title: string;
  description: string;
  type: string;
  duration: number;
  distance?: number;
  intensity: string;
  blocks: Block[];
}

/**
 * Export workout to TCX format (Training Center XML)
 * Compatible with: Garmin, Polar, Suunto, Wahoo
 */
export function exportToTCX(session: WorkoutSession, athleteName: string): string {
  const now = new Date().toISOString();
  
  let tcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Folders>
    <Workouts>
      <Workout Sport="${getSportType(session.type)}">
        <Name>${escapeXml(session.title)}</Name>
        <Step xsi:type="Step_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <StepId>1</StepId>
          <Name>Échauffement</Name>
          <Duration xsi:type="Time_t">
            <Seconds>600</Seconds>
          </Duration>
          <Intensity>Warmup</Intensity>
          <Target xsi:type="None_t"/>
        </Step>
`;

  // Add workout blocks
  session.blocks.forEach((block, index) => {
    const stepId = index + 2;
    const intensity = getIntensityForTCX(block.intensity);
    const duration = block.duration * 60; // Convert to seconds
    
    if (block.repetitions && block.repetitions > 1) {
      // Repeat block
      tcx += `        <Step xsi:type="Repeat_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <StepId>${stepId}</StepId>
          <Repetitions>${block.repetitions}</Repetitions>
          <Child xsi:type="Step_t">
            <StepId>${stepId}01</StepId>
            <Name>${escapeXml(block.type)}</Name>
            <Duration xsi:type="Time_t">
              <Seconds>${duration}</Seconds>
            </Duration>
            <Intensity>${intensity}</Intensity>
            ${getTargetForBlock(block)}
          </Child>
        </Step>
`;
    } else {
      // Regular step
      tcx += `        <Step xsi:type="Step_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <StepId>${stepId}</StepId>
          <Name>${escapeXml(block.type)}</Name>
          <Duration xsi:type="Time_t">
            <Seconds>${duration}</Seconds>
          </Duration>
          <Intensity>${intensity}</Intensity>
          ${getTargetForBlock(block)}
        </Step>
`;
    }
  });

  // Add cool down
  tcx += `        <Step xsi:type="Step_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
          <StepId>${session.blocks.length + 2}</StepId>
          <Name>Récupération</Name>
          <Duration xsi:type="Time_t">
            <Seconds>300</Seconds>
          </Duration>
          <Intensity>Cooldown</Intensity>
          <Target xsi:type="None_t"/>
        </Step>
      </Workout>
    </Workouts>
  </Folders>
  <Author xsi:type="Application_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <Name>VB Coaching Platform</Name>
    <Build>
      <Version>
        <VersionMajor>2</VersionMajor>
        <VersionMinor>0</VersionMinor>
      </Version>
    </Build>
    <LangID>fr</LangID>
    <PartNumber>000-00000-00</PartNumber>
  </Author>
</TrainingCenterDatabase>`;

  return tcx;
}

/**
 * Export workout to JSON format (Garmin Connect API compatible)
 */
export function exportToGarminJSON(session: WorkoutSession): any {
  const steps = [];

  // Warmup
  steps.push({
    type: 'WorkoutStep',
    stepOrder: 1,
    intensity: 'WARMUP',
    durationType: 'TIME',
    duration: 600,
    targetType: 'NO_TARGET',
  });

  // Workout blocks
  session.blocks.forEach((block, index) => {
    const step: any = {
      type: block.repetitions && block.repetitions > 1 ? 'WorkoutRepeatStep' : 'WorkoutStep',
      stepOrder: index + 2,
      intensity: getIntensityForGarmin(block.intensity),
      durationType: 'TIME',
      duration: block.duration * 60,
    };

    // Add target
    if (block.pace) {
      const paceSeconds = parsePaceToSeconds(block.pace);
      step.targetType = 'PACE';
      step.targetValueOne = paceSeconds - 10;
      step.targetValueTwo = paceSeconds + 10;
    } else if (block.heartRate) {
      const [min, max] = parseHeartRateZone(block.heartRate);
      step.targetType = 'HEART_RATE';
      step.targetValueOne = min;
      step.targetValueTwo = max;
    } else {
      step.targetType = 'NO_TARGET';
    }

    if (block.repetitions && block.repetitions > 1) {
      step.numberOfIterations = block.repetitions;
      step.smartRepeat = false;
    }

    steps.push(step);
  });

  // Cooldown
  steps.push({
    type: 'WorkoutStep',
    stepOrder: session.blocks.length + 2,
    intensity: 'COOLDOWN',
    durationType: 'TIME',
    duration: 300,
    targetType: 'NO_TARGET',
  });

  return {
    workoutName: session.title,
    description: session.description,
    sport: getGarminSport(session.type),
    workoutProvider: 'VB_COACHING',
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: getGarminSport(session.type),
        workoutSteps: steps,
      },
    ],
  };
}

/**
 * Export workout to simple text format for manual entry
 */
export function exportToText(session: WorkoutSession): string {
  let text = `🏃 ${session.title}\n`;
  text += `📝 ${session.description}\n`;
  text += `⏱️ Durée totale: ${session.duration} min\n`;
  if (session.distance) {
    text += `📏 Distance: ${session.distance} km\n`;
  }
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `📋 PROGRAMME:\n\n`;

  session.blocks.forEach((block, index) => {
    text += `${index + 1}. ${block.type.toUpperCase()}\n`;
    text += `   ⏱️ Durée: ${block.duration} min\n`;
    if (block.pace) {
      text += `   ⚡ Allure: ${block.pace} /km\n`;
    }
    if (block.speed) {
      text += `   🚀 Vitesse: ${block.speed} km/h\n`;
    }
    if (block.heartRate) {
      text += `   ❤️ FC: ${block.heartRate}\n`;
    }
    if (block.repetitions && block.repetitions > 1) {
      text += `   🔄 Répétitions: ${block.repetitions}x\n`;
    }
    text += `   📊 Intensité: ${block.intensity}\n`;
    text += `\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `\n✅ Bon entraînement !\n`;
  text += `📱 Généré par VB Coaching Platform\n`;

  return text;
}

/**
 * Export workout to markdown format
 */
export function exportToMarkdown(session: WorkoutSession): string {
  let md = `# ${session.title}\n\n`;
  md += `**Description:** ${session.description}\n\n`;
  md += `**Type:** ${session.type}\n`;
  md += `**Durée totale:** ${session.duration} minutes\n`;
  if (session.distance) {
    md += `**Distance:** ${session.distance} km\n`;
  }
  md += `**Intensité globale:** ${session.intensity}\n\n`;

  md += `## Programme d'entraînement\n\n`;

  session.blocks.forEach((block, index) => {
    md += `### ${index + 1}. ${block.type}\n\n`;
    md += `| Paramètre | Valeur |\n`;
    md += `|-----------|--------|\n`;
    md += `| Durée | ${block.duration} min |\n`;
    if (block.pace) md += `| Allure | ${block.pace} /km |\n`;
    if (block.speed) md += `| Vitesse | ${block.speed} km/h |\n`;
    if (block.heartRate) md += `| Fréquence cardiaque | ${block.heartRate} |\n`;
    if (block.repetitions && block.repetitions > 1) md += `| Répétitions | ${block.repetitions}x |\n`;
    md += `| Intensité | ${block.intensity} |\n\n`;
  });

  md += `---\n\n`;
  md += `*Généré par VB Coaching Platform*\n`;

  return md;
}

// Helper functions
function getSportType(type: string): string {
  const sportMap: { [key: string]: string } = {
    run: 'Running',
    running: 'Running',
    course: 'Running',
    bike: 'Biking',
    cycling: 'Biking',
    vélo: 'Biking',
    swim: 'Swimming',
    swimming: 'Swimming',
    natation: 'Swimming',
  };
  return sportMap[type.toLowerCase()] || 'Running';
}

function getGarminSport(type: string): string {
  const sportMap: { [key: string]: string } = {
    run: 'running',
    running: 'running',
    course: 'running',
    bike: 'cycling',
    cycling: 'cycling',
    vélo: 'cycling',
    swim: 'swimming',
    swimming: 'swimming',
    natation: 'swimming',
  };
  return sportMap[type.toLowerCase()] || 'running';
}

function getIntensityForTCX(intensity: string): string {
  const intensityMap: { [key: string]: string } = {
    low: 'Active',
    faible: 'Active',
    moderate: 'Active',
    modéré: 'Active',
    high: 'Active',
    élevé: 'Active',
    recovery: 'Resting',
    récupération: 'Resting',
  };
  return intensityMap[intensity.toLowerCase()] || 'Active';
}

function getIntensityForGarmin(intensity: string): string {
  const intensityMap: { [key: string]: string } = {
    low: 'ACTIVE',
    faible: 'ACTIVE',
    moderate: 'ACTIVE',
    modéré: 'ACTIVE',
    high: 'ACTIVE',
    élevé: 'ACTIVE',
    recovery: 'REST',
    récupération: 'REST',
  };
  return intensityMap[intensity.toLowerCase()] || 'ACTIVE';
}

function getTargetForBlock(block: Block): string {
  if (block.pace) {
    const paceSeconds = parsePaceToSeconds(block.pace);
    return `<Target xsi:type="Speed_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <SpeedZone xsi:type="CustomSpeedZone_t">
              <LowInMetersPerSecond>${(1000 / (paceSeconds + 10)).toFixed(2)}</LowInMetersPerSecond>
              <HighInMetersPerSecond>${(1000 / (paceSeconds - 10)).toFixed(2)}</HighInMetersPerSecond>
            </SpeedZone>
          </Target>`;
  } else if (block.heartRate) {
    const [min, max] = parseHeartRateZone(block.heartRate);
    return `<Target xsi:type="HeartRate_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <HeartRateZone xsi:type="CustomHeartRateZone_t">
              <Low>${min}</Low>
              <High>${max}</High>
            </HeartRateZone>
          </Target>`;
  }
  return '<Target xsi:type="None_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>';
}

function parsePaceToSeconds(pace: string): number {
  // Parse "5:30" format to seconds per km
  const parts = pace.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 330; // Default 5:30
}

function parseHeartRateZone(zone: string): [number, number] {
  // Parse formats like "140-160", "Z2", "150"
  if (zone.includes('-')) {
    const [min, max] = zone.split('-').map((s) => parseInt(s.trim()));
    return [min, max];
  } else if (zone.toLowerCase().startsWith('z')) {
    // Zone parsing (Z1 = 60-70%, Z2 = 70-80%, etc.)
    const zoneNum = parseInt(zone.substring(1));
    const maxHR = 190; // Default max HR
    const minPercent = 50 + zoneNum * 10;
    const maxPercent = 60 + zoneNum * 10;
    return [Math.round((maxHR * minPercent) / 100), Math.round((maxHR * maxPercent) / 100)];
  } else {
    const hr = parseInt(zone);
    return [hr - 5, hr + 5];
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
