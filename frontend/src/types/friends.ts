export type FriendStatus = "accepted" | "pending_incoming" | "pending_outgoing";

export type FriendItem = {
  id: number;
  name: string;
  profileImage: string | null;
  online: boolean;
  status: FriendStatus;
};
