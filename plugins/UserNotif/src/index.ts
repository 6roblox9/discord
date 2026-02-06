import { findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { storage } from "@vendetta/plugin";

const FluxDispatcher = findByProps("dispatch", "subscribe");
const UserStore = findByProps("getCurrentUser");

storage.platform ??= "desktop";

const getPlatform = (bypass: boolean, userId?: string) => {
  const p = storage.platform ?? "desktop";
  if (bypass || userId === UserStore.getCurrentUser()?.id) {
    switch (p) {
      case "desktop":
        return { browser: "Discord Client", vcIcon: 0 };
      case "web":
        return { browser: "Discord Web", vcIcon: 0 };
      case "ios":
        return { browser: "Discord iOS", vcIcon: 1 };
      case "android":
        return { browser: "Discord Android", vcIcon: 1 };
      case "xbox":
        return { browser: "Discord Embedded", vcIcon: 2 };
      case "playstation":
        return { browser: "Discord Embedded", vcIcon: 3 };
      default:
        return null;
    }
  }
  return null;
};

let unpatchIdentify: (() => void) | null = null;
let unpatchCallTile: (() => void) | null = null;

export default {
  onLoad() {
    const Identify = findByProps("_doIdentify");
    if (Identify?._doIdentify) {
      unpatchIdentify = after("_doIdentify", Identify, (_, ret) => {
        try {
          if (ret?.properties) {
            ret.properties = { ...ret.properties, ...getPlatform(true) };
          }
        } catch {}
        return ret;
      });
    }

    const CallTiles = findByProps("CallTile");
    if (CallTiles?.CallTile?.memo) {
      unpatchCallTile = after("memo", CallTiles.CallTile, ([props]) => {
        try {
          const r = getPlatform(false, props?.participantUserId);
          if (r?.vcIcon != null) props.platform = r.vcIcon;
        } catch {}
      });
    }
  },

  onUnload() {
    unpatchIdentify?.();
    unpatchCallTile?.();
  },

  settings: require("./settings").default,
};
