import { useRef, useEffect } from "react";

type SearchBoxProps = {
  onPlaceChanged: (place: any) => void;
};

export default function SearchBox({ onPlaceChanged }: SearchBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // 🔒 Guard: make sure Google Maps exists
    if (
      !inputRef.current ||
      typeof window === "undefined" ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places
    ) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place) onPlaceChanged(place);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [onPlaceChanged]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search for a place"
      style={{
        width: "100%",
        padding: "8px 12px",
        fontSize: "16px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        marginBottom: "12px",
      }}
    />
  );
}
