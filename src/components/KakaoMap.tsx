"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao : any;
  }
}

interface KakaoMapProps {
  lat: number;
  lng: number;
  address: string;
}

export default function KakaoMap({ lat, lng, address }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // kakao 객체 로드 확인 후 지도 초기화
    const initMap = () => {
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3,
      };

      const map = new window.kakao.maps.Map(mapRef.current, options);

      const markerPosition = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
      });
      marker.setMap(map);

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${address}</div>`,
      });
      infowindow.open(map, marker);
    };

    // kakao 객체가 로드되었는지 확인
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap);
    } else {
      // 로드 안됐으면 대기 후 재시도
      const checkKakao = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakao);
          window.kakao.maps.load(initMap);
        }
      }, 100);

      // cleanup
      return () => clearInterval(checkKakao);
    }
  }, [lat, lng, address]);

  return <div ref={mapRef} className="w-full h-48 rounded-lg bg-gray-200" />;
}