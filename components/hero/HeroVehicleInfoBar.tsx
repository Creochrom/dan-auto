"use client";

import { Calendar, Car, ExternalLink } from "lucide-react";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import {
  MOT_HISTORY_URL,
  formatMotDueDate,
  motCountdownLabel,
  vehicleQuickLabel,
} from "@/lib/vehicle-mot-display";

type Props = {
  report: VehicleReport;
  onBookMot: () => void;
};

export function HeroVehicleInfoBar({ report, onBookMot }: Props) {
  const { primary, secondary } = vehicleQuickLabel(report);
  const motDue = formatMotDueDate(
    report.profile.motExpiryDate,
    report.legacy.motDays
  );
  const countdown = motCountdownLabel(
    report.legacy.motDays,
    report.legacy.motStatus
  );
  const motUrgent = report.legacy.motStatus === "urgent";

  return (
    <div className="hero-vehicle-info-bar mt-3" role="status" aria-live="polite">
      <div className="hero-vehicle-info-bar__track">
        <div className="hero-vehicle-info-card hero-stat-chip">
          <span className="hero-vehicle-info-card__icon" aria-hidden>
            <Car className="h-3.5 w-3.5 text-[#d4a63c]" />
          </span>
          <span className="hero-vehicle-info-card__body">
            <span className="hero-vehicle-info-card__label">Vehicle</span>
            <span className="hero-vehicle-info-card__value">{primary}</span>
            <span className="hero-vehicle-info-card__sub">{secondary}</span>
          </span>
        </div>

        <div className="hero-vehicle-info-card hero-stat-chip">
          <span className="hero-vehicle-info-card__icon" aria-hidden>
            <Calendar className="h-3.5 w-3.5 text-[#d4a63c]" />
          </span>
          <span className="hero-vehicle-info-card__body">
            <span className="hero-vehicle-info-card__label">MOT due</span>
            <span className="hero-vehicle-info-card__value">{motDue}</span>
            <a
              href={MOT_HISTORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-vehicle-info-card__link"
            >
              MOT history
              <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" aria-hidden />
            </a>
          </span>
        </div>

        <button
          type="button"
          onClick={onBookMot}
          className={`hero-vehicle-info-card hero-vehicle-info-card--cta hero-stat-chip ${
            motUrgent ? "hero-vehicle-info-card--urgent" : ""
          }`}
        >
          <span className="hero-vehicle-info-card__body">
            <span className="hero-vehicle-info-card__label">Next MOT</span>
            <span className="hero-vehicle-info-card__value">{countdown}</span>
            <span className="hero-vehicle-info-card__cta">Book MOT</span>
          </span>
        </button>
      </div>
    </div>
  );
}
