import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { useProxy } from "@vendetta/storage";
import { getAssetIDByName } from "@vendetta/ui/assets";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableRow, TableSwitchRow, Stack, TextInput } = findByProps(
  "TableSwitchRow",
  "TableRowGroup",
  "TableRow",
  "Stack"
);

storage.userIds ??= [];
storage.trackFriends ??= true;

storage.trackMessages ??= true;
storage.trackTyping ??= true;
storage.trackProfile ??= true;
storage.trackVoice ??= true;

storage.watchDM ??= true;
storage.watchGroup ??= true;
storage.watchServers ??= true;

export default function Settings() {
  useProxy(storage);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [newUserId, setNewUserId] = React.useState("");

  const addUserId = () => {
    if (!newUserId.trim()) return;
    if (!storage.userIds.includes(newUserId.trim())) {
      storage.userIds = [...storage.userIds, newUserId.trim()];
      setNewUserId("");
      forceUpdate();
      showToast("User ID added", getAssetIDByName("Check"));
    }
  };

  const removeUserId = (id: string) => {
    storage.userIds = storage.userIds.filter(x => x !== id);
    forceUpdate();
    showToast("User ID removed", getAssetIDByName("Check"));
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
      <Stack spacing={8}>
        <TableRowGroup title="Tracking Events">
          <TableSwitchRow label="Track Profile Changes" value={storage.trackProfile} onValueChange={v => storage.trackProfile = v} />
          <TableSwitchRow label="Track Started Typing" value={storage.trackTyping} onValueChange={v => storage.trackTyping = v} />
          <TableSwitchRow label="Track Sent Message" value={storage.trackMessages} onValueChange={v => storage.trackMessages = v} />
          <TableSwitchRow label="Track Voice Join" value={storage.trackVoice} onValueChange={v => storage.trackVoice = v} />
        </TableRowGroup>

        <TableRowGroup title="Channel Scope">
          <TableSwitchRow label="DM" value={storage.watchDM} onValueChange={v => storage.watchDM = v} />
          <TableSwitchRow label="Group DM" value={storage.watchGroup} onValueChange={v => storage.watchGroup = v} />
          <TableSwitchRow label="Servers" value={storage.watchServers} onValueChange={v => storage.watchServers = v} />
        </TableRowGroup>

        <TableRowGroup title="Users">
          <TableSwitchRow label="Track Friends" value={storage.trackFriends} onValueChange={v => storage.trackFriends = v} />
        </TableRowGroup>

        <TableRowGroup title="Add User ID">
          <TextInput
            placeholder="Enter user ID"
            value={newUserId}
            onChange={setNewUserId}
            onSubmitEditing={addUserId}
          />
          <TableRow label="Add User ID" onPress={addUserId} />
        </TableRowGroup>

        {storage.userIds.length > 0 && (
          <TableRowGroup title="Tracked Users">
            {storage.userIds.map(id => (
              <TableRow
                key={id}
                label={id}
                trailing={
                  <RN.TouchableOpacity onPress={() => removeUserId(id)}>
                    <RN.Image source={getAssetIDByName("TrashIcon")} style={{ width: 16, height: 16 }} />
                  </RN.TouchableOpacity>
                }
              />
            ))}
          </TableRowGroup>
        )}
      </Stack>
    </ScrollView>
  );
}

