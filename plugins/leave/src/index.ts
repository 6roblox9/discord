import { registerCommand, unregisterAllCommands } from "@vendetta/commands";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { showConfirmationAlert } from "@vendetta/ui/alerts";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import React from "@vendetta/react";

const ChannelStore = findByProps("getChannel");
const APIUtils = findByProps("getAPIBaseURL", "del");
const ActionSheet = findByProps("ActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow");

const patches = [];

const loadCommands = () => {
  registerCommand({
    name: "leave silent",
    description: "Leave the current Group DM silently",
    options: [],
    predicate: (ctx) => {
      const channelId = ctx?.channel?.id;
      const channel = ChannelStore.getChannel(channelId);
      return !!channel && channel.type === 3;
    },
    execute: async (_, ctx) => {
      try {
        await APIUtils.del({
          url: `/channels/${ctx.channel.id}`,
          query: "silent=true"
        });
        showToast("Left Group DM successfully.");
      } catch {
        showToast("Failed to leave Group DM.");
      }
    }
  });
};

const patchActionSheet = () => {
  patches.push(
    after("render", ActionSheet, (args, res) => {
      const dangerGroup = findInReactTree(res, x => x?.key === "gdm-destructive");
      if (!dangerGroup) return res;

      const children = React.Children.toArray(dangerGroup.props.children);
      const leaveRow = dangerGroup.props.children.find(c => c?.props?.variant === "danger");
      const leaveIcon = leaveRow?.props?.icon?.props?.IconComponent;

      const props = args[0];
      const channelId = props?.header?.props?.icon?.props?.channel?.id;

      children.push(
        React.createElement(ActionSheetRow, {
          label: "Leave Silently",
          variant: "danger",
          icon: React.createElement(ActionSheetRow.Icon, { IconComponent: leaveIcon }),
          onPress: () => {
            showConfirmationAlert({
              title: "Leave Group",
              content: "Are you sure you want to leave this group silently?",
              confirmText: "Leave Silently",
              confirmColor: "red",
              onConfirm: () => {
                if (!channelId) return;
                try {
                  APIUtils.del({
                    url: `/channels/${channelId}`,
                    query: "silent=true"
                  });
                  showToast("Left silently");
                } catch {
                  showToast("Failed to leave silently");
                }
              },
              cancelText: "Cancel",
              onCancel: () => {}
            });
          }
        })
      );

      const clonedGroup = React.cloneElement(dangerGroup, {}, children);
      const sheetChildren = React.Children.map(res.props.children, child =>
        child === dangerGroup ? clonedGroup : child
      );

      return React.cloneElement(res, {}, sheetChildren);
    })
  );
};

export default {
  onLoad() {
    loadCommands();
    patchActionSheet();
  },
  onUnload() {
    unregisterAllCommands();
    for (const unpatch of patches) unpatch();
  }
};
