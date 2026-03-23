import { before, after } from "@vendetta/patcher";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findInReactTree } from "@vendetta/utils";
import { findByProps } from "@vendetta/metro";
import { React, clipboard } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import { Forms } from "@vendetta/ui/components";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const { FormRow, FormIcon } = Forms;

const unpatch = before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message;
    if (!message || key !== "MessageLongPressActionSheet") return;

    // البحث في المرفقات أو الـ Embeds لجلب الرابط
    const proxyUrl = 
        message.attachments?.[0]?.proxy_url || 
        message.attachments?.[0]?.proxyURL ||
        message.embeds?.[0]?.image?.proxyURL ||
        message.embeds?.[0]?.image?.proxy_url;

    if (!proxyUrl) return;

    component.then((instance: any) => {
        const unpatchAfter = after("default", instance, (_, component) => {
            React.useEffect(() => () => unpatchAfter(), []);

            // 1. البحث عن المجموعة التي تحتوي على أزرار مثل "Save Image" أو "Copy Media Link"
            // هذا سيعطينا المجموعة التي يجب أن نضيف زرنا إليها.
            const actionSheetRows = findInReactTree(
                component,
                (x) => Array.isArray(x?.props?.children) && x?.type?.name === "ActionSheetRowGroup" && x.props.children.length > 0
            );

            // 2. إذا وجدنا مجموعة تحتوي على أزرار أخرى
            if (actionSheetRows) {
                const actionSheetGroup = actionSheetRows;
                const ActionSheetRow = actionSheetGroup.props.children[0].type;

                // 3. نقوم بإنشاء المكون الخاص بالزر مع الأيقونة واللون
                const copyAction = () => {
                    LazyActionSheet.hideActionSheet();
                    clipboard.setString(proxyUrl);
                    showToast("Copied Proxy Link", getAssetIDByName("toast_copy_link"));
                };

                // 4. إضافة الزر الجديد إلى نهاية المجموعة
                actionSheetGroup.props.children.push(
                    <ActionSheetRow
                        label="Copy Proxy Link"
                        icon={{
                            $$typeof: Symbol.for("react.element"),
                            type: FormIcon,
                            props: {
                                source: getAssetIDByName("ic_link"),
                                style: { opacity: 1 } // ضمان ظهور الأيقونة
                            },
                        }}
                        onPress={copyAction}
                        key="copy-proxy-link"
                    />,
                );
            }
        });
    });
});

export const onUnload = () => unpatch();
