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
  "Stack",
  "TableRow",
  "TextInput"
);
const { Text } = findByProps("Text", "View");
const { Clipboard } = RN;

export default function Settings() {
  useProxy(storage);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [newKeyword, setNewKeyword] = React.useState("");

  const addKeyword = () => {
    if (!newKeyword.trim()) {
      showToast("Please enter a keyword", getAssetIDByName("Small"));
      return;
    }

    const kw = newKeyword.trim();
    if (!storage.keywords.includes(kw)) {
      storage.keywords = [...storage.keywords, kw];
      setNewKeyword("");
      forceUpdate();
      showToast("Keyword added", getAssetIDByName("Check"));
    } else {
      showToast("Keyword already exists", getAssetIDByName("Warning"));
    }
  };

  const removeKeyword = (kw: string) => {
    storage.keywords = storage.keywords.filter((k: string) => k !== kw);
    forceUpdate();
    showToast("Keyword removed", getAssetIDByName("Check"));
  };

  const exportKeywords = () => {
    Clipboard.setString(JSON.stringify(storage.keywords));
    showToast("Exported to clipboard", getAssetIDByName("Check"));
  };

  const importKeywords = async () => {
    const text = await Clipboard.getString();
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        storage.keywords = parsed;
        forceUpdate();
        showToast("Imported successfully", getAssetIDByName("Check"));
      } else {
        showToast("Invalid JSON format", getAssetIDByName("Warning"));
      }
    } catch (e) {
      showToast("Invalid JSON format", getAssetIDByName("Warning"));
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
      <Stack spacing={8}>

        <TableRowGroup title="Add Keyword">
          <Stack spacing={4}>
            <TextInput
              placeholder="Enter keyword or phrase..."
              value={newKeyword}
              onChange={setNewKeyword}
              isClearable
              onSubmitEditing={addKeyword}
              returnKeyType="done"
            />
          </Stack>
        </TableRowGroup>

        <TableRowGroup>
          <TableRow
            label="Add Keyword"
            subLabel="Add this word or phrase to your tracking list"
            trailing={<TableRow.Arrow />}
            onPress={addKeyword}
          />
        </TableRowGroup>

        {storage.keywords && storage.keywords.length > 0 && (
          <TableRowGroup title="Tracked Keywords">
            {storage.keywords.map((kw: string, index: number) => (
              <TableRow
                key={index}
                label={kw}
                trailing={
                  <RN.TouchableOpacity
                    onPress={() => removeKeyword(kw)}
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

        <TableRowGroup title="Data Management">
          <TableRow
            label="Export JSON"
            subLabel="Copy your keywords list to clipboard"
            trailing={<TableRow.Arrow />}
            onPress={exportKeywords}
          />
          <TableRow
            label="Import JSON"
            subLabel="Load keywords list from clipboard"
            trailing={<TableRow.Arrow />}
            onPress={importKeywords}
          />
        </TableRowGroup>

        <TableRowGroup title="Tracking Target">
          <TableSwitchRow
            label="Track Everyone"
            value={storage.trackMode === "everyone"}
            onValueChange={() => { storage.trackMode = "everyone"; forceUpdate(); }}
          />
          <TableSwitchRow
            label="Track Friends Only"
            value={storage.trackMode === "friends"}
            onValueChange={() => { storage.trackMode = "friends"; forceUpdate(); }}
          />
          <TableSwitchRow
            label="Track Custom Users"
            value={storage.trackMode === "custom"}
            onValueChange={() => { storage.trackMode = "custom"; forceUpdate(); }}
          />
          <TableSwitchRow
            label="Ignore Bots"
            value={storage.ignoreBots}
            onValueChange={(v: boolean) => { storage.ignoreBots = v; forceUpdate(); }}
          />
          {storage.trackMode === "custom" && (
            <Stack spacing={4} style={{ padding: 10 }}>
              <TextInput
                placeholder="123456789, 987654321"
                value={storage.customIds}
                onChange={(v: string) => { storage.customIds = v; forceUpdate(); }}
              />
            </Stack>
          )}
        </TableRowGroup>

        <TableRowGroup title="Tracking Locations">
          <TableSwitchRow
            label="Track Servers"
            value={storage.trackServers}
            onValueChange={(v: boolean) => { storage.trackServers = v; forceUpdate(); }}
          />
          <TableSwitchRow
            label="Track Group DMs"
            value={storage.trackGroups}
            onValueChange={(v: boolean) => { storage.trackGroups = v; forceUpdate(); }}
          />
          <TableSwitchRow
            label="Track DMs"
            value={storage.trackDMs}
            onValueChange={(v: boolean) => { storage.trackDMs = v; forceUpdate(); }}
          />
        </TableRowGroup>

        <TableRowGroup title="Matching Rules">
          <TableSwitchRow
            label="Exact Match"
            value={storage.exactMatch}
            onValueChange={(v: boolean) => { storage.exactMatch = v; forceUpdate(); }}
          />
          <TableSwitchRow
            label="Case Sensitive"
            value={storage.caseSensitive}
            onValueChange={(v: boolean) => { storage.caseSensitive = v; forceUpdate(); }}
          />
          <TableSwitchRow
            label="Match in a Sentence"
            value={storage.inSentence}
            onValueChange={(v: boolean) => { storage.inSentence = v; forceUpdate(); }}
          />
        </TableRowGroup>

        <TableRowGroup title="Advanced Notifications">
          <TableSwitchRow
            label="Send Notifications to Channel"
            value={storage.sendNotificationToChannel}
            onValueChange={(v: boolean) => { storage.sendNotificationToChannel = v; forceUpdate(); }}
          />
          {storage.sendNotificationToChannel && (
            <Stack spacing={4} style={{ padding: 10 }}>
              <TextInput
                placeholder="Enter Target Channel ID..."
                value={storage.targetChannelId}
                onChange={(v: string) => { storage.targetChannelId = v; forceUpdate(); }}
              />
              <Text style={{ color: "#f23f42", fontSize: 12, marginTop: 4, fontWeight: "bold" }}>
                WARNING: You must own the target channel to maintain privacy and prevent spamming others.
              </Text>
            </Stack>
          )}
        </TableRowGroup>

      </Stack>
    </ScrollView>
  );
}
