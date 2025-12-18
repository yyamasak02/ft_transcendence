import type { Component } from "@/types/component";
import type { Route } from "@/types/routes";
import { useConnect } from "./hooks/connectHook";
import { ActionTypes, EventTypes } from "./consts/consts";
import type { Stomp } from "./consts/consts";

export class TestWebRTCPage implements Component {
  private containerElement: HTMLElement | null;
  private hostRoomIdElement: HTMLInputElement | null;
  private joinRoomIdElement: HTMLInputElement | null;
  private holdButton: HTMLButtonElement | null;
  private holdCloseButton: HTMLButtonElement | null;
  private submitButton: HTMLButtonElement | null;
  private closeButton: HTMLButtonElement | null;

  constructor() {}

  render = () => {
    return `
    <div class="flex flex-col items-center justify-center min-h-screen bg-black text-green-400 font-mono text-center" id="test-web-rtc-container">
      <div class="mb-6">
        <label for="host_room_id" class="block text-sm font-bold uppercase">ホストID</label>
        <input
          type="text"
          id="host_room_id"
          name="host_room_id"
          readonly
          class="mt-1 w-full px-3 py-2 bg-black text-green-300 border border-green-400 focus:outline-none"
        />
      </div>
      <div>
        <button 
          type="submit"
          id="hold_button"
          class="text-white hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium focus:outline-none"
        >Hold</button>
        <button 
          type="submit"
          id="hold_close_button"
          class="text-white hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium focus:outline-none"
        >Close</button>
      </div>
      <div class="mb-6">
        <label for="join_room_id" class="block text-sm font-bold uppercase">参加ID</label>
        <input
          type="text"
          id="join_room_id"
          name="join_room_id"
          required
          class="mt-1 w-full px-3 py-2 bg-black text-green-300 border border-green-400 focus:outline-none"
        />
      </div>
      <div>
        <button 
          type="submit"
          id="connect_button"
          class="text-white hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium focus:outline-none"
        >Connect</button>
        <button 
          type="submit"
          id="close_button"
          class="text-white hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium focus:outline-none"
        >Close</button>
      </div>
    </div>
    `;
  };

  private handleServerMessage = (message: Stomp) => {
    if (EventTypes.CREATED_ROOM === message.event_type) {
      this.hostRoomIdElement.value = message.payload.newRoomId;
    }
  };

  private cleanMessage = () => {
    this.hostRoomIdElement.value = "";
    console.log("clean room Id");
  };

  init = () => {
    this.containerElement = document.querySelector("#test-web-rtc-container");
    // TODO エラー処理
    if (this.containerElement == null) {
      return;
    }
    this.hostRoomIdElement = this.containerElement.querySelector(
      "#host_room_id",
    ) as HTMLInputElement;
    this.joinRoomIdElement = this.containerElement.querySelector(
      "#join_room_id",
    ) as HTMLInputElement;
    this.holdButton = this.containerElement.querySelector(
      "#hold_button",
    ) as HTMLButtonElement;
    this.holdCloseButton = this.containerElement.querySelector(
      "#hold_close_button",
    ) as HTMLButtonElement;
    this.submitButton = this.containerElement.querySelector(
      "#connect_button",
    ) as HTMLButtonElement;
    this.closeButton = this.containerElement.querySelector(
      "#close_button",
    ) as HTMLButtonElement;
    const { connect, disconnect } = useConnect({
      onMessageReceived: this.handleServerMessage,
      onSocketClosed: this.cleanMessage,
    });
    if (this.holdButton) {
      this.holdButton.addEventListener("click", () => {
        connect({ action: ActionTypes.CREATE, joinRoomId: null });
      });
    }
    if (this.holdCloseButton) {
      this.holdCloseButton.addEventListener("click", () => disconnect());
      console.log("Hello");
    }
    if (this.submitButton) {
      this.submitButton.addEventListener("click", () => {
        this.joinRoomIdElement?.setCustomValidity("");
        if (!this.joinRoomIdElement?.checkValidity()) {
          this.joinRoomIdElement?.setCustomValidity("必須であ～る.");
          this.joinRoomIdElement?.reportValidity();
          return;
        }
        // TODO IDが一致する場合
        const joinRoomId = this.joinRoomIdElement?.value ?? "";
        connect({ action: ActionTypes.JOIN, joinRoomId: joinRoomId });
      });
    }
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => disconnect());
    }
  };
}

const testPage = new TestWebRTCPage();

export const TestWebRTCRoute: Record<string, Route> = {
  "/test_rtc": {
    linkLabel: "TestWebRTC",
    content: testPage.render(),
    onMount: (container) => {
      console.log(container);
      testPage.init();
    },
  },
};
