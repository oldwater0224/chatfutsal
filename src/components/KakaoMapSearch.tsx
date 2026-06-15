"use client";

import { useEffect, useRef, useState } from "react";
import { Pin, Search, X } from "lucide-react";

import { KakaoSDK, KakaoMap, KakaoMarker, KakaoPlaceSearchResult } from "@/src/types";

declare global {
  interface Window {
    kakao: KakaoSDK;
  }
}

interface LocationData {
  name: string; // 구장명
  address: string; // 주소
  lat: number; // 위도
  lng: number; // 경도
}

interface KakaoMapSearchProps {
  onSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
}

export default function KakaoMapSearch({
  onSelect,
  initialLocation,
}: KakaoMapSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<KakaoMap | null>(null);
  const [marker, setMarker] = useState<KakaoMarker | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<KakaoPlaceSearchResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<LocationData | null>(
    initialLocation || null,
  );
  const [isSearching, setIsSearching] = useState(false);

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      const defaultLat = initialLocation?.lat || 37.5665;
      const defaultLng = initialLocation?.lng || 126.978;

      const options = {
        center: new window.kakao.maps.LatLng(defaultLat, defaultLng),
        level: 5,
      };

      const newMap = new window.kakao.maps.Map(mapRef.current!, options);
      setMap(newMap);

      // 초기 마커 (선택된 위치가 있으면)
      if (initialLocation) {
        const markerPosition = new window.kakao.maps.LatLng(
          initialLocation.lat,
          initialLocation.lng,
        );
        const newMarker = new window.kakao.maps.Marker({
          position: markerPosition,
        });
        newMarker.setMap(newMap);
        setMarker(newMarker);
      }
    };

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap);
    } else {
      const checkKakao = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakao);
          window.kakao.maps.load(initMap);
        }
      }, 100);
      return () => clearInterval(checkKakao);
    }
  }, [initialLocation]);

  // 장소 검색
  const handleSearch = () => {
    if (!searchKeyword.trim() || !map) return;

    setIsSearching(true);
    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(searchKeyword, (data: KakaoPlaceSearchResult[], status: string) => {
      setIsSearching(false);
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data.slice(0, 5)); // 최대 5개
      } else {
        setSearchResults([]);
        alert("검색 결과가 없습니다.");
      }
    });
  };

  // 검색 결과에서 장소 선택
  const handleSelectPlace = (place: KakaoPlaceSearchResult) => {
    const lat = parseFloat(place.y);
    const lng = parseFloat(place.x);

    // 지도 이동
    const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
    map!.setCenter(moveLatLng);
    map!.setLevel(3);

    // 기존 마커 제거 후 새 마커
    if (marker) {
      marker.setMap(null);
    }
    const newMarker = new window.kakao.maps.Marker({ position: moveLatLng });
    newMarker.setMap(map);
    setMarker(newMarker);

    // 선택된 장소 저장
    const locationData: LocationData = {
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      lat,
      lng,
    };
    setSelectedPlace(locationData);
    onSelect(locationData);

    // 검색 결과 초기화
    setSearchResults([]);
    setSearchKeyword("");
  };

  // 선택 취소
  const handleClear = () => {
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    setSelectedPlace(null);
    onSelect({ name: "", address: "", lat: 0, lng: 0 });
  };

  return (
    <div className="space-y-3">
      {/* 검색 입력 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="구장명 또는 주소 검색"
            className="w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* 검색 결과 목록 */}
      {searchResults.length > 0 && (
        <ul className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-white">
          {searchResults.map((place, idx) => (
            <li
              key={idx}
              onClick={() => handleSelectPlace(place)}
              className="p-3 hover:bg-green-50 cursor-pointer"
            >
              <p className="font-medium text-gray-900">{place.place_name}</p>
              <p className="text-sm text-gray-500">
                {place.road_address_name || place.address_name}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* 지도 */}
      <div ref={mapRef} className="w-full h-48 rounded-lg bg-gray-200" />

      {/* 선택된 장소 표시 */}
      {selectedPlace && selectedPlace.name && (
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
          <div>
            <p className="font-medium text-green-800 flex items-center gap-1">
             
              <Pin className="w-4 h-4 text-red-500" /> {selectedPlace.name}
            </p>
            <p className="text-sm text-green-600">{selectedPlace.address}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-green-600 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
