import type { Route } from "@/types/routes";
import { langManager, word, t, i18nAttr } from "@/i18n";
import { navigate } from "@/router";
import { getStoredAccessToken } from "@/utils/token-storage";
import { getCurrentPath, setReturnTo } from "@/router";
import {
  DEFAULT_PROFILE_IMAGE,
  getProfileImageSrc,
  isProfileImageKey,
} from "@/utils/profile-images";
import { formatMatchDate } from "@/utils/date-format";
import { fetchProfileImageBlob } from "@/utils/profile-image-fetch";
import type { FriendItem } from "@/types/friends";
import { escapeHtml } from "@/utils/escape";

type MatchItem = {
  id: number;
  ownerName: string;
  guestName?: string;
  ownerScore: number;
  guestScore: number;
  createdAt: string;
};

class UserProfileComponent {
  render = () => {
    return `
      <div class="min-h-[calc(100vh-64px)] w-full bg-slate-900">
        <div class="max-w-[1000px] mx-auto p-6 md:p-10">
          <div class="w-full bg-transparent">
            
            <div class="flex md:grid md:grid-cols-2 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory gap-6">
              
              <section class="flex-shrink-0 w-full md:w-full snap-center flex flex-col items-center">
                <div class="w-[90%] md:w-full flex flex-col items-center justify-start pt-10 pb-10 border border-slate-500 rounded-xl bg-slate-800/30">
                  <div id="user-profile-name"
                       class="
                        text-xl font-semibold tracking-wider text-center
                        mb-4 text-white
                       "></div>
                  <div class="mt-2.5 flex flex-col items-center gap-3">
                    <img id="user-profile-avatar"
                         class="w-40 h-40 object-cover border border-slate-300 rounded-lg"
                         src="${getProfileImageSrc(DEFAULT_PROFILE_IMAGE)}" ${i18nAttr("alt", "profile_image_alt")} />
                    <div id="user-profile-status" class="text-sm text-red-300 text-center"></div>
                  </div>
                  
                  <button id="user-profile-friend-request"
                          class="
                            mt-6 py-2 px-6 bg-slate-600
                            text-slate-100 font-semibold
                            border border-zinc-800 rounded-md
                            hover:bg-slate-700
                            active:scale-95 transition-transform
                          ">
                    ${t("friend_request_button")}
                  </button>
                  
                  <div id="user-profile-friend-msg"
                       class="mt-1.5 text-xs text-gray-300"></div>
                  
                  <button id="user-profile-back"
                          class="
                            mt-3.5 py-2.5 px-4 bg-slate-700
                            text-slate-200 font-semibold
                            border border-slate-600 rounded-md
                            hover:bg-slate-800
                            active:scale-95 transition-transform
                          ">
                    ${t("my_profile")}
                  </button>

                  <div class="mt-8 md:hidden text-slate-500 text-xs animate-pulse">
                    Swipe for Match Results →
                  </div>
                </div>
              </section>

              <section class="flex-shrink-0 w-full md:w-full snap-center">
                <div class="w-[90%] mx-auto md:w-full p-4 border border-slate-700 rounded-xl bg-slate-800/30 min-h-[300px]">
                  <h3 class="m-0 mb-3 text-base tracking-wider text-slate-300 border-b border-slate-700 pb-2">${t("match_results")}</h3>
                  <div id="user-profile-matches" class="flex flex-col gap-2.5 w-full">
                    </div>
                </div>
              </section>

            </div>
              <div id="slide-dots"
                   class="md:hidden flex justify-center gap-2 mt-4"
                   aria-label="Profile sections">
                <div class="dot w-4 h-2 rounded-full bg-indigo-600 transition-all duration-300"
                     aria-label="Section 1 of 2 (current)"
                     aria-current="true"></div>
                <div class="dot w-2 h-2 rounded-full bg-slate-700 transition-all duration-300"
                     aria-label="Section 2 of 2"></div>
              </div>
          </div>  
        </div>
      </div>
    `;
  };
}

const formatMatchDateByLang = (createdAt: string) =>
  formatMatchDate(createdAt, langManager.lang);

const MATCH_RESULT_CONFIG = {
  win: {
    symbol: "●",
  },
  lose: {
    symbol: "○",
  },
} as const;

type FriendInfo = {
  isFriend: boolean;
  friendId: number | null;
};

class UserProfileController {
  private nameEl: HTMLDivElement;
  private statusEl: HTMLDivElement;
  private avatarEl: HTMLImageElement;
  private friendButton: HTMLButtonElement;
  private friendMsg: HTMLDivElement;
  private backButton: HTMLButtonElement;
  private matchesEl: HTMLDivElement;

  constructor() {
    this.nameEl = document.getElementById("user-profile-name")! as HTMLDivElement;
    this.statusEl = document.getElementById("user-profile-status")! as HTMLDivElement;
    this.avatarEl = document.getElementById("user-profile-avatar")! as HTMLImageElement;
    this.friendButton = document.getElementById("user-profile-friend-request")! as HTMLButtonElement;
    this.friendMsg = document.getElementById("user-profile-friend-msg")! as HTMLDivElement;
    this.backButton = document.getElementById("user-profile-back")! as HTMLButtonElement;
    this.matchesEl = document.getElementById("user-profile-matches")! as HTMLDivElement;
  }

  // username, status
  setProfileHeader(name: string, online: boolean, isFriend: boolean) {
    if (!this.nameEl || !this.statusEl) return;

    const safeName = escapeHtml(name);
    this.nameEl.innerHTML = isFriend
      ? `<span class="text-yellow-200">&#9829;</span> ${safeName}`
      : safeName;

    const statusText = online ? word("user_profile_online") : word("user_profile_offline"); 
    this.statusEl.textContent = statusText;
    this.statusEl.classList.toggle("is-online", online);
    this.statusEl.classList.toggle("is-offline", !online);
  }

  // avatar
  async loadCustomProfileImage(name: string) {
    if (!this.avatarEl) return;
    const accessToken = getStoredAccessToken();
    if (!accessToken) return;

    const blob = await fetchProfileImageBlob(name, accessToken);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    this.avatarEl.src = url;
  }

  setProfileImage(profileImage: string | null, name: string) {
    if (!this.avatarEl) return;
    if (profileImage && isProfileImageKey(profileImage)) {
      this.avatarEl.src = getProfileImageSrc(profileImage);
      return;
    }
    void this.loadCustomProfileImage(name);
  }

  // friend request buttonに関する関数
  setupFriendAction(name: string, online: boolean, friendInfo: FriendInfo) {
    if (!this.friendButton) return;
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      this.friendButton.disabled = true;
      setReturnTo(getCurrentPath());
      navigate("/login");
      return;
    }
    
    this.friendButton.disabled = false;
      this.friendButton.innerHTML = friendInfo.isFriend
        ? t("friend_remove_button")
        : t("friend_request_button");

    this.friendButton.onclick = async (event) => {
      event.preventDefault();
      this.friendButton.disabled = true;
      this.setFriendMessage("");

      try {
        const res =
          friendInfo.isFriend && friendInfo.friendId
            ? await fetch("/api/common/user/friends/remove", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ friendId: friendInfo.friendId }),
              })
            : await fetch("/api/common/user/friends/request", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
              });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 401) {
            setReturnTo(getCurrentPath());
            navigate("/login");
            return;
          }
          this.setFriendMessage(
            body?.message ??
              word(
                friendInfo.isFriend
                  ? "friend_remove_failed"
                  : "friend_request_failed",
              ),
          );
          this.friendButton.disabled = false;
          return;
        }
        if (friendInfo.isFriend) {
          this.setFriendMessage(word("friend_remove_done"));
          this.setProfileHeader(name, online, false);
          this.setupFriendAction(name, online, {
            isFriend: false,
            friendId: null,
          });
          return;
        }
        this.setFriendMessage(word("friend_request_sent"));
      } catch {
        this.setFriendMessage(
          word(
            friendInfo.isFriend
              ? "friend_remove_failed"
              : "friend_request_failed",
          ),
        );
        this.friendButton.disabled = false;
      }
    };
  }

  setFriendMessage(message: string) {
    if (this.friendMsg) {
      this.friendMsg.textContent = message;
    }
  }

  // my profileに戻るボタン
  setupBack() {
    if (this.backButton) {
      this.backButton.addEventListener("click", () => {
        navigate("/me");
      });
    }
  }

  // match結果の表示
  setMatchMessage(message: string) {
    if (this.matchesEl) {
      this.matchesEl.textContent = message;
    }
  }

  renderMatches(items: MatchItem[], profileName: string) {
    if (!this.matchesEl) return;

    if (!items.length) {
      this.matchesEl.textContent = word("no_matches") ?? null;
      return;
    }

    this.matchesEl.innerHTML = "";

    items.forEach((item) => {
      const row = document.createElement("div");
      const isOwner = item.ownerName === profileName;
      const opponent = isOwner
        ? (item.guestName ?? word("unknown_user"))
        : (item.ownerName ?? word("unknown_user"));
      const safeOpponent = escapeHtml(opponent);
      const myScore = isOwner ? item.ownerScore : item.guestScore;
      const oppScore = isOwner ? item.guestScore : item.ownerScore;

      const formattedDate = formatMatchDateByLang(item.createdAt);

      const isWin = myScore > oppScore;
      const { symbol } = isWin
        ? MATCH_RESULT_CONFIG.win
        : MATCH_RESULT_CONFIG.lose;
      const resultText = isWin ? t("result_win") : t("result_lose");

      const baseClass = `
        flex items-center gap-4 rounded-lg border
        px-4 py-3 bg-slate-900/40 border-slate-700/80
      `;
      const rowStatusClass = isWin
        ? "border-l-4 border-l-emerald-500"
        : "border-l-4 border-l-rose-500 opacity-80";

      row.className = `${baseClass} ${rowStatusClass}`;

      row.innerHTML = `
        <div class="flex flex-col items-center justify-center gap-1 shrink-0">
          <span class="mt-0.5 text-xl text-slate-100 leading-none">${symbol}</span>
          <span class="text-xs font-semibold text-slate-400 tracking-tight">${resultText}</span>
        </div>
        <div class="flex flex-col flex-1 overflow-hidden">
          <div class="text-base font-semibold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">${safeOpponent}</div>
          <div class="text-xs text-slate-500 mt-0.5">${formattedDate}</div>
        </div>
        <div class="flex items-center gap-2 font-mono font-semibold text-xl ml-4">
          <span class="min-w-[20px] text-white">${myScore}</span>
          <span class="text-slate-600 text-base">-</span>
          <span class="min-w-[20px] text-slate-500">${oppScore}</span>
        </div>
      `;

      this.matchesEl.appendChild(row);
    });
  }

  async loadFriendStatus(name: string): Promise<FriendInfo> {
    const accessToken = getStoredAccessToken();
    if (!accessToken) return { isFriend: false, friendId: null };
    try {
      const res = await fetch("/api/common/user/friends", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setReturnTo(getCurrentPath());
          navigate("/login");
        }
        return { isFriend: false, friendId: null };
      }
      const body = await res.json().catch(() => ({}));
      const friends = Array.isArray(body?.friends) ? body.friends : [];
      const match = (friends as FriendItem[]).find(
        (friend) => friend?.name === name && friend?.status === "accepted",
      );
      return match?.id
        ? { isFriend: true, friendId: match.id }
        : { isFriend: false, friendId: null };
    } catch {
      return { isFriend: false, friendId: null };
    }
  }

  async loadProfile(name: string) {
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      setReturnTo(getCurrentPath());
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(
        `/api/common/user/profile?name=${encodeURIComponent(name)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setReturnTo(getCurrentPath());
        navigate("/login");
        return;
      }
      if (res.status === 404) {
        this.setMatchMessage(word("user_profile_not_found"));
        return;
      }
      if (!res.ok) {
        this.setMatchMessage(
          body?.message ?? word("match_results_fetch_failed"),
        );
        return;
      }
      const profileName = body.name ?? name ?? "";
      // const profileName = String(body.name ?? name);
      const online = Boolean(body.online);
      const friendInfo = await this.loadFriendStatus(profileName);
      this.setProfileHeader(profileName, online, friendInfo.isFriend);
      this.setupFriendAction(profileName, online, friendInfo);
      const profileImage = body?.profileImage ?? null;
      const profileImageKey =
        typeof profileImage === "string" ? profileImage : null;
      this.setProfileImage(profileImageKey, profileName);
      if (Array.isArray(body.matches)) {
        this.renderMatches(body.matches as MatchItem[], profileName);
      } else {
        this.setMatchMessage(word("match_results_fetch_failed"));
      }
    } catch (error) {
      console.error("Match results fetch failed", error);
      this.setMatchMessage(word("match_results_fetch_failed"));
    }
  }
}

const getProfileNameFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("name")?.trim() ?? "";
};

export const UserProfileRoute: Route = {
  linkLabel: "",
  content: () => new UserProfileComponent().render(),
  onMount: () => {
    const name = getProfileNameFromQuery();
    if (!name) {
      new UserProfileController().setMatchMessage(
        word("user_profile_not_found"),
      );
      return;
    }
    const controller = new UserProfileController();
    controller.setupBack();
    controller.loadProfile(name);

    const container = document.querySelector('.overflow-x-auto');
    const dots = document.querySelectorAll('.dot');

    if (container && dots.length > 0) {
      container.addEventListener('scroll', () => {
        const index = Math.round(container.scrollLeft / container.clientWidth);

        dots.forEach((dot, i) => {
          if (i === index) {
            // アクティブドット
            dot.classList.add('bg-indigo-600', 'w-4');
            dot.classList.remove('bg-slate-700', 'w-2');
          } else {
            // 非アクティブドット
            dot.classList.add('bg-slate-700', 'w-2');
            dot.classList.remove('bg-indigo-600', 'w-4');
          }
        });
      }, { passive: true });
    }
  },
  head: { title: "User Profile" },
};
