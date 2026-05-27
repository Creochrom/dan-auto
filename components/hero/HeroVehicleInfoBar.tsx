"use client";

import type { ReactNode, SVGProps } from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { VehicleBrandIcon } from "@/components/hero/VehicleBrandIcon";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import {
  MOT_HISTORY_URL,
  formatMotDueDate,
  motCountdownDisplay,
  vehicleIdentity,
} from "@/lib/vehicle-mot-display";

type Props = {
  report: VehicleReport;
  onBookMot: () => void;
};

function CardInner({
  icon,
  label,
  value,
  footer,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  footer: ReactNode;
}) {
  return (
    <span className="hero-vehicle-info-card__inner">
      <span className="hero-vehicle-info-card__icon-slot">{icon}</span>
      <span className="hero-vehicle-info-card__body">
        <span className="hero-vehicle-info-card__label">{label}</span>
        <span className="hero-vehicle-info-card__title">{value}</span>
        <span className="hero-vehicle-info-card__footer">{footer}</span>
      </span>
    </span>
  );
}

export function HeroVehicleInfoBar({ report, onBookMot }: Props) {
  const { title, meta } = vehicleIdentity(report);
  const motDue = formatMotDueDate(
    report.profile.motExpiryDate,
    report.legacy.motDays
  );
  const countdown = motCountdownDisplay(
    report.legacy.motDays,
    report.legacy.motStatus
  );
  const motUrgent = report.legacy.motStatus === "urgent";

  return (
    <div className="hero-vehicle-info-bar mt-3" role="status" aria-live="polite">
      <div className="hero-vehicle-info-bar__track">
        <div className="hero-vehicle-info-card hero-vehicle-info-card--vehicle hero-stat-chip">
          <CardInner
            icon={<VehicleBrandIcon makeModel={title} />}
            label="Vehicle"
            value={title}
            footer={meta}
          />
        </div>

        <a
          href={MOT_HISTORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hero-vehicle-info-card hero-vehicle-info-card--mot hero-stat-chip"
        >
          <CardInner
            icon={<Calendar className="hero-vehicle-info-card__icon-svg" aria-hidden />}
            label="MOT due"
            value={motDue}
            footer={<span className="hero-vehicle-info-card__action">View MOT history</span>}
          />
        </a>

        <button
          type="button"
          onClick={onBookMot}
          className={`hero-vehicle-info-card hero-vehicle-info-card--cta hero-stat-chip ${
            motUrgent ? "hero-vehicle-info-card--urgent" : ""
          }`}
        >
          <CardInner
            icon={<Calendar className="hero-vehicle-info-card__icon-svg" aria-hidden />}
            label="Next MOT"
            value={countdown.headline}
            footer={
              <span className="hero-vehicle-info-card__cta">
                Book MOT
                <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
              </span>
            }
          />
        </button>
      </div>
    </div>
  );
}
