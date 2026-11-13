/**
 * App-wide settings. Empty strings mean "not set yet": the related button stays hidden or
 * shows a friendly message. None of these values are secrets.
 */
export const APP_NAME = 'Hookd';
export const APP_TAGLINE = 'React in 10 minutes a day';
export const APP_VERSION = '1.0';
export const DAILY_GOAL_MINUTES = 10;

// The three values below are fallbacks: the admin can change them for everyone (remote config).

/** Help website. It must never link to the sales site (Google Play payments policy). */
export const HELP_URL = '';
/** Support inbox used by the Contact screen. */
export const CONTACT_EMAIL = '';
/** WhatsApp number in international format, digits only (example: 212600000000). */
export const CONTACT_WHATSAPP = '';
export const CONTACT_REPLY_TIME = '24 hours';
