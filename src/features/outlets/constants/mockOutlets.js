import { OUTLET_STATUS, OUTLET_TYPES } from "./outletConstants";

// Sample outlet records shaped exactly like what useAddOutletForm's `submit`
// now produces: no more outletName / outletAddress / registrationType /
// registeredWith — name & address live inside `location`, and there's a
// verified `whatsapp` number + an `outletType` (Outlet vs Franchise).
export const MOCK_OUTLETS = [
  {
    id: "out_1",
    storeId: "TRY-10234",
    status: OUTLET_STATUS.ACTIVE,
    joinedDate: "2025-11-04",
    outletType: OUTLET_TYPES.OUTLET,
    whatsapp: {
      number: "9876543210",
      isBrandNumber: false,
      verified: true,
    },
    locationMode: "search",
    location: {
      name: "Toni & Guy Ahmedabad",
      address: "Shop 4, SG Highway, Bodakdev, Ahmedabad, Gujarat 380054",
      lat: 23.0338,
      lng: 72.5081,
      placeId: "ChIJmockplaceid001",
      addressComponents: [],
      source: "search",
    },
  },
  {
    id: "out_2",
    storeId: "TRY-10235",
    status: OUTLET_STATUS.ACTIVE,
    joinedDate: "2025-12-18",
    outletType: OUTLET_TYPES.FRANCHISE,
    whatsapp: {
      number: "9123456780",
      isBrandNumber: true,
      verified: true,
    },
    locationMode: "search",
    location: {
      name: "Andiappan Yoga Academy",
      address: "12 Lake View Road, Anna Nagar, Chennai, Tamil Nadu 600040",
      lat: 13.0850,
      lng: 80.2101,
      placeId: "ChIJmockplaceid002",
      addressComponents: [],
      source: "search",
    },
  },
  {
    id: "out_3",
    storeId: "TRY-10236",
    status: OUTLET_STATUS.NOT_ACTIVE,
    joinedDate: "2026-01-22",
    outletType: OUTLET_TYPES.OUTLET,
    whatsapp: {
      number: "9988776655",
      isBrandNumber: false,
      verified: false, // not yet verified — card should show "—" style state cleanly
    },
    locationMode: "live",
    location: {
      name: "Current Location",
      address: "44 MG Road, Indiranagar, Bengaluru, Karnataka 560038",
      lat: 12.9719,
      lng: 77.6412,
      placeId: "ChIJmockplaceid003",
      addressComponents: [],
      source: "live",
    },
  },
  {
    id: "out_4",
    storeId: "TRY-10237",
    status: OUTLET_STATUS.ACTIVE,
    joinedDate: "2026-02-09",
    outletType: OUTLET_TYPES.FRANCHISE,
    whatsapp: {
      number: "9012345678",
      isBrandNumber: false,
      verified: true,
    },
    locationMode: "search",
    location: {
      name: "Urban Bites Franchise - Koramangala",
      address: "80 Ft Road, Koramangala 4th Block, Bengaluru, Karnataka 560034",
      lat: 12.9352,
      lng: 77.6146,
      placeId: "ChIJmockplaceid004",
      addressComponents: [],
      source: "search",
    },
  },
  {
    id: "out_5",
    storeId: "TRY-10238",
    status: OUTLET_STATUS.NOT_ACTIVE,
    joinedDate: "2026-03-30",
    outletType: OUTLET_TYPES.OUTLET,
    whatsapp: {
      number: "9765432109",
      isBrandNumber: true,
      verified: true,
    },
    locationMode: "search",
    location: {
      name: "SaraFood Retail - Powai",
      address: "Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076",
      lat: 19.1197,
      lng: 72.9051,
      placeId: "ChIJmockplaceid005",
      addressComponents: [],
      source: "search",
    },
  },
];