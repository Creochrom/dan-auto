"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Car } from "lucide-react";
import {
  resolveVehicleImage,
  vehicleImageFallbackChain,
} from "@/lib/vehicle-images";

type Props = {
  makeModel: string;
  unknown?: boolean;
  className?: string;
  heightClass?: string;
};

export function VehicleHeroImage({
  makeModel,
  unknown,
  className = "",
  heightClass = "h-[96px]",
}: Props) {
  const resolved = useMemo(
    () => resolveVehicleImage(makeModel, { unknown }),
    [makeModel, unknown]
  );
  const fallbacks = useMemo(
    () => vehicleImageFallbackChain(makeModel, unknown),
    [makeModel, unknown]
  );

  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrcIndex(0);
    setFailed(false);
  }, [makeModel, unknown]);

  const src = fallbacks[srcIndex] ?? resolved.url;
  const alt = resolved.alt;
  const isLocal = src.startsWith("/");

  const handleError = useCallback(() => {
    setSrcIndex((i) => {
      if (i < fallbacks.length - 1) return i + 1;
      setFailed(true);
      return i;
    });
  }, [fallbacks.length]);

  if (failed) {
    return (
      <div
        className={`flex w-full items-center justify-center bg-gradient-to-br from-[#1a1814] to-black ${heightClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <Car className="h-10 w-10 text-[#d4a63c]/35" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={480}
      height={192}
      unoptimized={isLocal}
      onError={handleError}
      className={`w-full object-cover object-center ${heightClass} ${className}`}
    />
  );
}
