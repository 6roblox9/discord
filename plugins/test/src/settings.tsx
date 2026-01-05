import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableRow, TableSwitchRow, Stack, TextInput } = findByProps(
  "TableSwitchRow",
  "TableCheckboxRow",
  "TableRowGroup",
  "Stack",
  "TableRow"
);

storage.userIds ??= [];
storage.trackFriends ??= true;
storage.trackMessages ??= true;
storage.trackTyping ??= true;
storage.trackVoice ??= true;
storage.trackProfile ??= true;
storage.trackDM ??= true;
storage.trackGroupDM ??= true;
storage.trackServers ??= true;

export default function Settings() {
  useProxy(storage);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [newUserId, setNewUserId] = React.useState("");

  const addUserId = () => {
    if (!newUserId.trim()) {
      showToast("Please enter a user ID", getAssetIDByName("Small"));
      return;
    }

    const userIds = storage.userIds || [];
    if (!userIds.includes(newUserId.trim())) {
      storage.userIds = [...userIds, newUserId.trim()];
      setNewUserId("");
      forceUpdate();
      showToast("User ID added", getAssetIDByName("Check"));
    } else {
      showToast("User ID already exists", getAssetIDByName("Warning"));
    }
  };

  const removeUserId = (userId: string) => {
    storage.userIds = storage.userIds.filter((id: string) => id !== userId);
    forceUpdate();
    showToast("User ID removed", getAssetIDByName("Check"));
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
      <Stack spacing={8}>
        <TableRowGroup title="Tracking Settings">
          <TableSwitchRow
            label="Track Friends"
            subLabel="Enable tracking for your friends"
            value={storage.trackFriends}
            onValueChange={(value: boolean) => {
              storage.trackFriends = value;
              forceUpdate();
            }}
          />
          <TableSwitchRow
            label="Track Messages"
            subLabel="Show notifications when tracked users send messages"
            value={storage.trackMessages}
            onValueChange={(value: boolean) => {
              storage.trackMessages = value;
              forceUpdate();
            }}
          />
          <TableSwitchRow
            label="Track Typing"
            subLabel="Show notifications when tracked users start typing"
            value={storage.trackTyping}
            onValueChange={(value: boolean) => {
              storage.trackTyping = value;
              forceUpdate();
            }}
          />
          <TableSwitchRow
            label="Track Voice"
            subLabel="Show notifications when tracked users join voice"
            value={storage.trackVoice}
            onValueChange={(value: boolean) => {
              storage.trackVoice = value;
              forceUpdate();
            }}
          />
          <TableSwitchRow
            label="Track Profile"
            subLabel="Show notifications when tracked users update profile/status"
            value={storage.trackProfile}
            onValueChange={(value: boolean) => {
              storage.trackProfile = value;
              forceUpdate();
            }}
          />
        </TableRowGroup>

        <TableRowGroup title="Channel Filter">
          <TableSwitchRow
            label="DM"
            subLabel="Track activities in direct messages"
            value={storage.trackDM}
            onValueChange={(value: boolean) => {
              storage.trackDM = value;
              forceUpdate();
            }}
          />
          <TableSwitchRow
            label="Group DM"
            subLabel="Track activities in group chats"
            value={storage.trackGroupDM}
            onValueChange={(value: boolean) => {
              storage.trackGroupDM = value;
              forceUpdate();
            }}
          />
          <TableSwitchRow
            label="Servers"
            subLabel="Track activities in servers"
            value={storage.trackServers}
            onValueChange={(value: boolean) => {
              storage.trackServers = value;
              forceUpdate();
            }}
          />
        </TableRowGroup>

        <TableRowGroup title="Add User ID">
          <Stack spacing={4}>
            <TextInput
              placeholder="Enter user ID"
              value={newUserId}
              onChange={setNewUserId}
              isClearable
              onSubmitEditing={addUserId}
              returnKeyType="done"
            />
          </Stack>
        </TableRowGroup>

        <TableRowGroup>
          <TableRow
            label="Add User ID"
            subLabel="Add a specific user ID to track"
            trailing={<TableRow.Arrow />}
            onPress={addUserId}
          />
        </TableRowGroup>

        {storage.userIds && storage.userIds.length > 0 && (
          <TableRowGroup title="Tracked User IDs">
            {storage.userIds.map((userId: string, index: number) => (
              <TableRow
                key={index}
                label={userId}
                trailing={
                  <RN.TouchableOpacity
                    onPress={() => removeUserId(userId)}
                    style={{
                      padding: 8,
                      backgroundColor: "#ff4d4d",
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <RN.Image
                      source={getAssetIDByName("TrashIcon")}
                      style={{ width: 14, height: 14, tintColor: "#ffffff" }}
                    />
                  </RN.TouchableOpacity>
                }
              />
            ))}
          </TableRowGroup>
        )}

        <TableRowGroup title="About User Tracking">
          <TableRow
            label="How it Works"
            subLabel="Track specific users by their Discord user IDs"
          />
          <TableRow
            label="Finding User IDs"
            subLabel="Enable Developer Mode in Discord settings, then open user profile and select three dots in right top, and copy their ID"
          />
          <TableRow
            label="Friends vs Specific Users"
            subLabel="Enable 'Track Friends' to track all friends, or add specific user IDs"
          />
        </TableRowGroup>
      </Stack>
    </ScrollView>
  );
}
