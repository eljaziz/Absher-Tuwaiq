import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import Places from "./places";

type LatLngLiteral = google.maps.LatLngLiteral;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  // still named "office" to match Places and avoid errors
  const [office, setOffice] = useState<LatLngLiteral>();

  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const center = useMemo<LatLngLiteral>(
    () => ({ lat: 43.45, lng: -80.49 }),
    []
  );

  const options = useMemo<MapOptions>(
    () => ({
      mapId: "ccb22444c9dea7a21df2e65c",
      disableDefaultUI: true,
      clickableIcons: false,
    }),
    []
  );

  // 🔹 load map + clusterer (WITH CUSTOM RENDERER)
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        renderer: {
          render: ({ count, position }) =>
            new google.maps.Marker({
              position,
              label: {
                text: String(count),
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: count > 10 ? "#FFC107" : "#2196F3",
                fillOpacity: 0.9,
                strokeColor: "white",
                strokeWeight: 2,
                scale: Math.min(30, 16 + count),
              },
              zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
            }),
        },
      });
    }
  }, []);

  // 🔴 simulated high-risk points (tight + dense)
  const riskPoints = useMemo<LatLngLiteral[]>(
    () => (office ? generateRiskPoints(office) : []),
    [office]
  );

  // 🔴 cluster risk points
  useEffect(() => {
    if (!mapRef.current || !office || !clustererRef.current) return;

    clustererRef.current.clearMarkers();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const markers = riskPoints.map(
      (point) =>
        new google.maps.Marker({
          position: point,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: "#FF5252",
            fillOpacity: 0.8,
            strokeWeight: 0,
          },
        })
    );

    markersRef.current = markers;
    clustererRef.current.addMarkers(markers);
  }, [riskPoints, office]);

  return (
    <div className="container">
      <div className="controls">
        <h1>High-Risk Area Analysis</h1>

        <Places
          setOffice={(position) => {
            setOffice(position);
            mapRef.current?.panTo(position);
          }}
        />

        {!office && <p>Select an area to visualize risk concentration.</p>}
      </div>

      <div className="map">
        <GoogleMap
          zoom={12}
          center={center}
          mapContainerClassName="map-container"
          options={options}
          onLoad={onLoad}
        >
          {office && (
            <>
              {/* Selected hotspot */}
              <Marker position={office} />

              {/* Risk zones */}
              <Circle center={office} radius={15000} options={closeOptions} />
              <Circle center={office} radius={30000} options={middleOptions} />
              <Circle center={office} radius={45000} options={farOptions} />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

/* -------------------- Circle styles -------------------- */

const defaultOptions: google.maps.CircleOptions = {
  strokeOpacity: 0.5,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
};

const closeOptions: google.maps.CircleOptions = {
  ...defaultOptions,
  zIndex: 3,
  fillOpacity: 0.05,
  strokeColor: "#8BC34A",
  fillColor: "#8BC34A",
};

const middleOptions: google.maps.CircleOptions = {
  ...defaultOptions,
  zIndex: 2,
  fillOpacity: 0.05,
  strokeColor: "#FBC02D",
  fillColor: "#FBC02D",
};

const farOptions: google.maps.CircleOptions = {
  ...defaultOptions,
  zIndex: 1,
  fillOpacity: 0.08,
  strokeColor: "#FF5252",
  fillColor: "#FF5252",
};

/* -------------------- Risk point generator -------------------- */

const generateRiskPoints = (
  center: LatLngLiteral
): LatLngLiteral[] => {
  const points: LatLngLiteral[] = [];

  for (let i = 0; i < 200; i++) {
    const latOffset = (Math.random() - 0.5) * 0.08;
    const lngOffset = (Math.random() - 0.5) * 0.08;

    points.push({
      lat: center.lat + latOffset,
      lng: center.lng + lngOffset,
    });
  }

  return points;
};
