export type ProfileImageKey =
  | "Robot"
  | "Snowman"
  | "Sniper"
  | "Suicider"
  | "Queen";

export const PROFILE_IMAGES: Array<{
  key: ProfileImageKey;
  label: string;
  src: string;
}> = [
  { key: "Robot", label: "Robot", src: "/characters/Robot/default.png" },
  { key: "Snowman", label: "Snowman", src: "/characters/Snowman/default.png" },
  { key: "Sniper", label: "Sniper", src: "/characters/Sniper/default.png" },
  { key: "Suicider", label: "Suicider", src: "/characters/Suicider/default.png" },
  { key: "Queen", label: "Queen", src: "/characters/Queen/default.png" },
];

export const DEFAULT_PROFILE_IMAGE: ProfileImageKey = "Robot";

export const isProfileImageKey = (value: string | null | undefined): value is ProfileImageKey =>
  PROFILE_IMAGES.some((item) => item.key === value);

export const getProfileImageSrc = (key?: string | null) => {
  const found = PROFILE_IMAGES.find((item) => item.key === key);
  const defaultImage = PROFILE_IMAGES.find(
    (item) => item.key === DEFAULT_PROFILE_IMAGE,
  );
  return found?.src ?? defaultImage?.src ?? PROFILE_IMAGES[0].src;
};
