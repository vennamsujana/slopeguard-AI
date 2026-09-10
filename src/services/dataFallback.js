import Papa from 'papaparse';

// Standalone Client-Side Data Loader & AI Engine for Netlify / Public Cloud Deployments

export async function fetchAreasData() {
  try {
    const res = await fetch('/api/areas');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.length > 0) return json.data;
    }
  } catch (e) {
    console.log('[SlopeGuard Standalone] Express backend offline, falling back to static dataset...');
  }

  // Fallback to static CSV fetch
  const csvRes = await fetch('/data/sikkim_area_data.csv');
  const csvText = await csvRes.text();
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return parsed.data;
}

export async function fetchLandslidesData() {
  try {
    const res = await fetch('/api/landslides');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.length > 0) return json.data;
    }
  } catch (e) {
    console.log('[SlopeGuard Standalone] Express backend offline, falling back to static dataset...');
  }

  const csvRes = await fetch('/data/sikkim_landslide_history.csv');
  const csvText = await csvRes.text();
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: true });
  const areas = await fetchAreasData();

  return parsed.data.map(item => {
    let lat = item.Latitude;
    let lng = item.Longitude;
    let isFallbackCoords = false;

    if (lat === 'NOT_REPORTED' || lat === null || lat === undefined || String(lat).trim() === '') {
      const parentArea = areas.find(a => a.Area_ID === item.Area_ID);
      if (parentArea) {
        lat = parentArea.Latitude;
        lng = parentArea.Longitude;
        isFallbackCoords = true;
      }
    }

    return {
      ...item,
      Resolved_Latitude: parseFloat(lat),
      Resolved_Longitude: parseFloat(lng),
      Is_Fallback_Coords: isFallbackCoords
    };
  });
}

export async function fetchResidentsData(areas) {
  try {
    const res = await fetch('/api/residents');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.length > 0) return json.data;
    }
  } catch (e) {}

  // Generate sample resident contacts for all 50 villages
  return areas.map((area, idx) => {
    const firstNames = ['Tashi', 'Pema', 'Mingma', 'Karma', 'Sonam', 'Dorjee', 'Passang', 'Dawa', 'Bikash', 'Sita'];
    const lastNames = ['Bhutia', 'Lepcha', 'Pradhan', 'Chettri', 'Subba', 'Gurung', 'Tamang', 'Rai', 'Sharma', 'Karki'];
    const name = `${firstNames[idx % firstNames.length]} ${lastNames[(idx * 3) % lastNames.length]}`;
    return {
      Resident_ID: `RES-SK-${(idx + 1).toString().padStart(3, '0')}`,
      Name: name,
      Contact_Number: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      Residential_Area: area.Road_Name || 'Main Village Road',
      Village: area.Village,
      District: area.District,
      Emergency_Contact: `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`,
      Location: `${area.Latitude}, ${area.Longitude}`,
      Is_Sample_Data: true
    };
  });
}

export function runClientAiAnalysis(area, overrides, historicalLandslides) {
  const historicalEvents = historicalLandslides.filter(h => h.Area_ID === area.Area_ID);
  const isHighBaseline = area.Risk_Level === 'HIGH';

  const rainfall = overrides?.rainfall_mm_hr ?? (isHighBaseline ? 55 : 18);
  const soilMoisture = overrides?.soil_moisture_percent ?? (isHighBaseline ? 82 : 48);
  const groundMovement = overrides?.ground_movement_mm ?? (isHighBaseline ? 3.8 : 0.4);
  const slopeAngle = overrides?.slope_angle_deg ?? (isHighBaseline ? 42 : 25);

  let riskScore = 20;
  if (area.Risk_Level === 'HIGH') riskScore += 30;
  if (historicalEvents.length > 0) riskScore += historicalEvents.length * 15;
  if (rainfall > 50) riskScore += 25;
  else if (rainfall > 30) riskScore += 15;
  if (soilMoisture > 75) riskScore += 20;
  if (groundMovement > 2.0) riskScore += 20;
  if (area.Road_Status === 'Restricted') riskScore += 10;

  riskScore = Math.min(Math.max(riskScore, 10), 98);

  let calculatedRiskLevel = 'LOW';
  let badgeLabel = '🟢 GREEN — LOW RISK';

  if (riskScore >= 75) {
    calculatedRiskLevel = 'CRITICAL';
    badgeLabel = '🔴 RED — CRITICAL RISK';
  } else if (riskScore >= 55) {
    calculatedRiskLevel = 'HIGH';
    badgeLabel = '🟠 ORANGE — HIGH RISK';
  } else if (riskScore >= 35) {
    calculatedRiskLevel = 'MODERATE';
    badgeLabel = '🟡 YELLOW — MODERATE RISK';
  }

  const mainRiskFactors = [];
  if (rainfall > 40) mainRiskFactors.push(`Heavy Monsoonal Rainfall (${rainfall} mm/hr threshold surpassed)`);
  if (soilMoisture > 75) mainRiskFactors.push(`High Soil Water Saturation (${soilMoisture}% moisture capacity)`);
  if (groundMovement > 1.5) mainRiskFactors.push(`Active Sub-surface Ground Movement (${groundMovement} mm displacement)`);
  if (historicalEvents.length > 0) mainRiskFactors.push(`${historicalEvents.length} Recorded Historical Landslide Event(s) in local sector`);
  if (slopeAngle > 35) mainRiskFactors.push(`Steep Mountainous Slope Gradient (${slopeAngle}°)`);
  if (area.Road_Status === 'Restricted') mainRiskFactors.push(`Road Status Currently Restricted (${area.Road_Name})`);

  let historicalReferenceText = 'No recorded historical major landslides in NIDM/Govt database for this specific Area ID.';
  if (historicalEvents.length > 0) {
    const recentEvent = historicalEvents[0];
    historicalReferenceText = `Historical Cross-Reference: Area ${area.Area_ID} (${area.Village}) has documented historical instability. ` +
      `Notable event on ${recentEvent.Date} triggered by "${recentEvent.Trigger}" affecting ${recentEvent.Road_Affected || recentEvent.Road_Name}. ` +
      `Recorded damage included: ${recentEvent.Damage}. (Source: ${recentEvent.Source}).`;
  }

  const plainLanguageExplanation = 
    `SlopeGuard AI analysis for ${area.Village} (${area.District} District) indicates a ${badgeLabel} status with a calculated risk index of ${riskScore}/100. ` +
    `Current parameters exhibit high correlation with critical landslide triggers typical of the Sikkim Himalayas. ` +
    `${historicalReferenceText} ` +
    `Current rainfall of ${rainfall} mm/h combined with ${soilMoisture}% soil saturation increases pore water pressure across steep slopes (${slopeAngle}°), raising shear stress along weak rock planes.`;

  const recommendedActions = [];
  if (calculatedRiskLevel === 'CRITICAL' || calculatedRiskLevel === 'HIGH') {
    recommendedActions.push('Issue immediate early warning alerts to village residents via SMS / PA system.');
    recommendedActions.push(`Restrict or divert traffic on ${area.Road_Name}.`);
    recommendedActions.push('Deploy quick response disaster management teams to check critical drainage channels.');
    recommendedActions.push('Suggest residents switch to designated safer bypass routes.');
  } else {
    recommendedActions.push('Maintain regular telemetry monitoring and automated rainfall logging.');
    recommendedActions.push('Ensure culverts and slope drain paths remain clear of debris.');
  }

  return {
    areaId: area.Area_ID,
    village: area.Village,
    district: area.District,
    roadName: area.Road_Name,
    roadStatus: area.Road_Status,
    riskScore,
    calculatedRiskLevel,
    badgeLabel,
    mainRiskFactors,
    plainLanguageExplanation,
    historicalReferenceText,
    historicalEventsCount: historicalEvents.length,
    historicalEventsSummary: historicalEvents,
    recommendedActions
  };
}
