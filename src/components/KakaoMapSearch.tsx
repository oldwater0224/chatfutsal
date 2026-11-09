"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import {
  fieldInputClass,
  focusRingClass,
  iconButtonBaseClass,
  iconButtonClass,
  primaryButtonClass,
} from "./ui/styles";

import { KakaoMap, KakaoMarker, KakaoPlaceSearchResult } from "@/src/types";

interface LocationData {
  name: string; // 구장명
  address: string; // 주소
  lat: number; // 위도
  lng: number; // 경도
}

interface KakaoMapSearchProps {
  onSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  /** 바깥 label과 검색 입력을 잇는 id */
  inputId?: string;
}

export default function KakaoMapSearch({
  onSelect,
  initialLocation,
  inputId,
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
        alert("검색 결과가 없어요");
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
            id={inputId}
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="구장명 또는 주소 검색"
            className={`${fieldInputClass} pr-12`}
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setSearchResults([]);
              }}
              aria-label="검색어 지우기"
              className={`absolute right-1 top-1/2 -translate-y-1/2 ${iconButtonBaseClass} text-gray-500 hover:text-gray-700`}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          aria-label="구장 검색"
          className={`${primaryButtonClass} w-12 h-12 shrink-0`}
        >
          <Search className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* 검색 결과 목록 */}
      {searchResults.length > 0 && (
        <ul className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-48 overflow-y-auto bg-white">
          {searchResults.map((place, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleSelectPlace(place)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 cursor-pointer transition-colors ${focusRingClass} focus-visible:ring-inset`}
              >
                <span className="block text-[15px] font-medium text-gray-900">{place.place_name}</span>
                <span className="block mt-1 text-[13px] text-gray-600">
                  {place.road_address_name || place.address_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 지도 */}
      <div ref={mapRef} className="w-full h-48 rounded-xl bg-gray-100" />

      {/* 선택된 장소 표시 */}
      {selectedPlace && selectedPlace.name && (
        <div className="flex items-center justify-between gap-2 py-3 pl-4 pr-1 rounded-xl border border-green-600">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[15px] font-medium text-gray-900">
              <MapPin className="w-4 h-4 shrink-0 text-gray-500" aria-hidden="true" />
              <span className="truncate">{selectedPlace.name}</span>
            </p>
            <p className="mt-1 text-[13px] text-gray-600 truncate">{selectedPlace.address}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="선택한 구장 지우기"
            className={iconButtonClass}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
