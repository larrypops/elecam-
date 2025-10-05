'use client';

import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

type StationData = {
  name: string;
  turnout: number;
  registeredVoters: number;
  turnoutRate: number;
};

interface StationsMapProps {
  stationData: StationData[];
}

// Mock geocoded positions for stations. In a real app, you'd get this from a geocoding service.
const stationPositions: Record<string, { lat: number; lng: number }> = {
  'Bureau de vote central de Yaoundé': { lat: 3.848, lng: 11.5021 },
  'Bureau portuaire de Douala': { lat: 4.0483, lng: 9.7043 },
  'Bureau des hauts plateaux de Bamenda': { lat: 5.963, lng: 10.159 },
  'Poste nord de Garoua': { lat: 9.306, lng: 13.398 },
};

const getPinColor = (turnoutRate: number) => {
    if (turnoutRate < 60) return { background: "hsl(var(--destructive))", glyphColor: "hsl(var(--destructive-foreground))", borderColor: "hsl(var(--destructive))" };
    if (turnoutRate < 70) return { background: "#F59E0B", glyphColor: "#FFFFFF", borderColor: "#B45309" }; // Amber
    return { background: "hsl(var(--primary))", glyphColor: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary))" }; 
}

export function StationsMap({ stationData }: StationsMapProps) {
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <Card className="flex items-center justify-center h-full bg-muted shadow-sm">
        <div className="text-center text-sm text-muted-foreground p-4">
            <p className="font-semibold">La carte est désactivée.</p>
            <p>
              Veuillez ajouter une clé d'API Google Maps à votre fichier `.env.local` 
              <br/>
              (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=VOTRE_CLE_ICI`) pour l'activer.
            </p>
        </div>
      </Card>
    );
  }

  const stationsWithPositions = stationData
    .map(station => ({
      ...station,
      position: stationPositions[station.name],
    }))
    .filter(station => station.position && station.turnout > 0);

  return (
     <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Carte de la Participation</CardTitle>
        <CardDescription>Analyse géographique du taux de participation par bureau de vote.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full rounded-lg overflow-hidden border">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={{ lat: 5.8, lng: 12.5 }}
              defaultZoom={6}
              mapId="elections-map"
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              {stationsWithPositions.map((station) => (
                <AdvancedMarker
                  key={station.name}
                  position={station.position}
                  onClick={() => setSelectedStation(station)}
                >
                  <Pin {...getPinColor(station.turnoutRate)}>
                    {station.turnoutRate.toFixed(0)}%
                  </Pin>
                </AdvancedMarker>
              ))}
              {selectedStation && stationPositions[selectedStation.name] && (
                <InfoWindow
                  position={stationPositions[selectedStation.name]}
                  onCloseClick={() => setSelectedStation(null)}
                  minWidth={200}
                >
                  <div className="p-1">
                    <h4 className="font-bold text-sm text-foreground">{selectedStation.name}</h4>
                    <p className="text-xs text-muted-foreground">Taux de participation: <span className="font-semibold">{selectedStation.turnoutRate.toFixed(1)}%</span></p>
                    <p className="text-xs text-muted-foreground">Votants: <span className="font-semibold">{selectedStation.turnout.toLocaleString()} / {selectedStation.registeredVoters.toLocaleString()}</span></p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>
      </CardContent>
    </Card>
  );
}