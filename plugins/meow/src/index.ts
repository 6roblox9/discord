import { before } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";
import { findInReactTree } from "@vendetta/utils";

const { FormRow, FormIcon } = Forms;

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
  const message = msg?.message;
  if (key !== "MessageLongPressActionSheet" || !message) return;
  
  const proxyUrl = message?.attachments?.[0]?.proxy_url;
  if (!proxyUrl) return;

  component.then((instance) => {
    const unpatch = after("default", instance, (_, component) => {
      React.useEffect(
        () => () => {
          unpatch();
        },
        [],
      );

      const actionSheetContainer = findInReactTree(
        component,
        (x) => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
      );
      const buttons = findInReactTree(
        component,
        (x) => x?.[0]?.type?.name === "ButtonRow",
      );

      if (buttons) {
        buttons.push(
          <FormRow
            label="Copy Proxy Link"
            leading={
              <FormIcon
                style={{ opacity: 1 }}
                source={getAssetIDByName("ic_link")}
              />
            }
            onPress={() => {
              clipboard.setString(proxyUrl);
              showToast("Copied proxy link to clipboard", getAssetIDByName("toast_copy_link"));
            }}
          />
        );
      } else if (actionSheetContainer && actionSheetContainer[1]) {
        const middleGroup = actionSheetContainer[1];

        const ActionSheetRow = middleGroup.props.children[0].type;

        const copyProxyLinkButton = (
          <ActionSheetRow
            label="Copy Proxy Link"
            icon={{
              $$typeof: middleGroup.props.children[0].props.icon.$$typeof,
              type: middleGroup.props.children[0].props.icon.type,
              key: null,
              ref: null,
              props: {
                IconComponent: () => (
                  <FormIcon
                    style={{ opacity: 1 }}
                    source={getAssetIDByName("ic_link")}
                  />
                ),
              },
            }}
            onPress={() => {
              clipboard.setString(proxyUrl);
              showToast("Copied proxy link to clipboard", getAssetIDByName("toast_copy_link"));
            }}
            key="copy-proxy-link"
          />
        );

        middleGroup.props.children.push(copyProxyLinkButton);
      }
    });
  });
});

export const onUnload = () => unpatch();
