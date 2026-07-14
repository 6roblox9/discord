import { after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { findInReactTree } from "@vendetta/utils";
import { showToast } from "@vendetta/ui/toasts";

const APIUtils = findByProps("getAPIBaseURL", "del");
const ActionSheet = findByProps("ActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow");
const { showConfirmationAlert } = findByProps("showConfirmationAlert");
const React = findByProps("createElement");

let patches = [];

export default {
  onLoad() {
    patches.push(
      after("render", ActionSheet, (args, res) => {
        const dangerGroup = findInReactTree(res, (x) => x?.key === "gdm-destructive");
        if (!dangerGroup) return res;

        const children = React.Children.toArray(dangerGroup.props.children);
        const leaveRow = dangerGroup.props.children.find((c) => c?.props?.variant === "danger");
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
                onConfirm: async () => {
                  if (!channelId) return;
                  try {
                    await APIUtils.del({
                      url: `/channels/${channelId}`,
                      query: "silent=true"
                    });
                    showToast("Left silently");
                  } catch {
                    showToast("Failed to leave silently");
                  }
                },
                cancelText: "Cancel"
              });
            }
          })
        );

        const clonedGroup = React.cloneElement(dangerGroup, {}, children);
        const sheetChildren = React.Children.map(res.props.children, (child) =>
          child === dangerGroup ? clonedGroup : child
        );

        return React.cloneElement(res, {}, sheetChildren);
      })
    );
  },
  onUnload() {
    for (const unpatch of patches) unpatch();
    patches = [];
  }
};
