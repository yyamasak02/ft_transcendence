import home from "@/pages/home/style.css?url";
import pingpong3D from "@/pages/pingpong_3D/style.css?url";
import pingpong3DConfig from "@/pages/pingpong_3D_config/style.css?url";
import login from "@/pages/login/style.css?url";
import register from "@/pages/register/style.css?url";
import notFound from "@/pages/404/style.css?url";
import me from "@/pages/me/style.css?url";
import googleSignup from "@/pages/google_signup/style.css?url";
import twoFactor from "@/pages/two_factor/style.css?url";
import usernameChange from "@/pages/username_change/style.css?url";
import userProfile from "@/pages/user_profile/style.css?url";

export const routeStyles = {
  home,
  pingpong3D,
  pingpong3DConfig,
  login,
  register,
  me,
  googleSignup,
  twoFactor,
  notFound,
  usernameChange,
  userProfile,
} as const;
