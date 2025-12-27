import { findByProps } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";
import { after } from "@vendetta/patcher";
import { Forms } from "@vendetta/ui/components";

const Gateway = findByProps("getSocket");
const Voice = findByProps("getVoiceStateForGuild");
const Button = Forms.FormButton;

let unpatch;

function sendFakeDeaf() {
  const socket = Gateway.getSocket();
  if (!socket) return;

  const guildId = Voice?.getCurrentVoiceChannel()?.guild_id;
  const channelId = Voice?.getCurrentVoiceChannel()?.channel_id;

  if (!guildId || !channelId) return;

  socket.send({
    op: 4,
    d: {
      guild_id: guildId,
      channel_id: channelId,
      self_mute: false,
      self_deaf: true
    }
  });
}

export default {
  onLoad() {
    unpatch = after("render", Forms, (_, ret) => {
      ret.props.children.push(
        React.createElement(
          Button,
          {
            text: "Fake Deafen",
            onPress: sendFakeDeaf
          }
        )
      );
      return ret;
    });
  },
  onUnload() {
    if (unpatch) unpatch();
  }
};

