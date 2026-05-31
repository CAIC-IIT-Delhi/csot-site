export const HOSTELS = [
  "Aravali",
  "Dronagiri",
  "Girnar",
  "Himadri",
  "Jwalamukhi",
  "Kailash",
  "Karakoram",
  "Kumaon",
  "Nalanda",
  "Nilgiri",
  "Sahyadri",
  "Saptagiri",
  "Satpura",
  "Shivalik",
  "Udaigiri",
  "Vindhyachal",
  "Zanskar",
  "Day scholar",
] as const;

export type Hostel = (typeof HOSTELS)[number];
