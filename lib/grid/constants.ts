export const GRID_SIZE = 1000;
export const TOTAL_PIXELS = GRID_SIZE * GRID_SIZE; // 1,000,000
export const PIXEL_PRICE_USD_CENTS = 100; // $1.00
export const PIXEL_PRICE_GBP_PENCE = 100; // £1.00

// Zoom levels: 1x = 1 CSS px per grid pixel, up to 16x
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 16;
export const DEFAULT_ZOOM = 1;

// Pending reservations expire after this many minutes
export const RESERVATION_EXPIRY_MINUTES = 15;

// Platform fee on resales (2%)
export const PLATFORM_FEE_RATE = 0.02;
