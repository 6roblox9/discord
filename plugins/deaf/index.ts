import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { ScrollView, Button } from "@vendetta/ui/components";

const Gateway = findByProps("send");
const VoiceStore = findByProps("getVoiceStateForGuild", "getCurrentUser");

function fakeDeafen() {
  const userId = VoiceStore.getCurrentUser()?.id;
  if (!userId) return;

  const states = Object.values(VoiceStore.getVoiceStates?.() || {});
  const state = states.find(v => v.userId === userId);
  if (!state) return;

  Gateway.send({
    op: 4,
    d: {
      guild_id: state.guildId,
      channel_id: state.channelId,
      self_mute: false,
      self_deaf: true
    }
  });
}

export default {
  name: "Fake Deafen",
  description: "Send self_deaf true without real deafen",
  settings() {
    return React.createElement(
      ScrollView,
      null,
      React.createElement(Button, { text: "Fake Deafen", onPress: fakeDeafen })
    );
  }
};

