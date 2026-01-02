export const fetchProfileImageBlob = async (
  name: string,
  accessToken: string,
) => {
  try {
    const res = await fetch(
      `/api/common/user/profile_image_data?name=${encodeURIComponent(name)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
};
