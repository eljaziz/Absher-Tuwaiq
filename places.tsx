import { Combobox } from "@headlessui/react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

type PlacesProps = {
  setOffice: (position: google.maps.LatLngLiteral) => void;
};

export default function Places({ setOffice }: PlacesProps) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    const results = await getGeocode({ address });
    const { lat, lng } = await getLatLng(results[0]);
    setOffice({ lat, lng });
  };

  return (
    <Combobox value={value} onChange={handleSelect} disabled={!ready}>
      <div className="relative">
        <Combobox.Input
          className="combobox-input"
          placeholder="Search area"
          onChange={(e) => setValue(e.target.value)}
        />

        {status === "OK" && (
          <Combobox.Options className="absolute z-10 bg-white shadow-lg rounded w-full">
            {data.map(({ place_id, description }) => (
              <Combobox.Option
                key={place_id}
                value={description}
                className="cursor-pointer p-2 hover:bg-gray-100"
              >
                {description}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
