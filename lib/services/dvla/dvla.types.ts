/** Raw DVLA Vehicle Enquiry API payload (partial). */
export type DvlaRawVehicle = {
  registrationNumber?: string;
  make?: string;
  fuelType?: string;
  colour?: string;
  yearOfManufacture?: number;
  motStatus?: string;
  taxStatus?: string;
  motExpiryDate?: string;
  taxDueDate?: string;
  engineCapacity?: number;
  co2Emissions?: number;
  typeApproval?: string;
  wheelplan?: string;
  monthOfFirstRegistration?: string;
};

export type NormalizedDvlaVehicle = {
  registrationNumber: string;
  make: string;
  fuelType: string;
  motStatus: string;
  taxStatus: string;
  yearOfManufacture: number;
  colour: string;
  motExpiryDate: string | null;
  engineCapacity: number | null;
};

export class DvlaServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "DvlaServiceError";
    this.statusCode = statusCode;
  }
}
