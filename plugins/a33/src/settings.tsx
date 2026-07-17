import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { useProxy } from "@vendetta/storage";

const { ScrollView } = findByProps("ScrollView");
const { TableRowGroup, TableSwitchRow, Stack, TextInput, TableRow } = findByProps(
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
  const [newKeyword, setNewKeyword] = React.useState("");

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (kw && !storage.keywords.includes(kw)) {
      storage.keywords = [...storage.keywords, kw];
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => {
    storage.keywords = storage.keywords.filter((k: string) => k !== kw);
  };

  const exportKeywords = () => {
    Clipboard.setString(JSON.stringify(storage.keywords));
    showToast("Exported to clipboard");
  };

  const importKeywords = async () => {
    const text = await Clipboard.getString();
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        storage.keywords = parsed;
        showToast("Imported successfully");
      } else {
        showToast("Invalid JSON format");
      }
    } catch (e) {
      showToast("Invalid JSON format");
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
      <Stack spacing={8}>

        <TableRowGroup title="Keywords Setup">
          <Stack spacing={4} style={{ padding: 10 }}>
            <TextInput
              placeholder="Enter keyword or phrase..."
              value={newKeyword}
              onChange={(v: string) => setNewKeyword(v)}
              onSubmitEditing={addKeyword}
            />
            <RN.TouchableOpacity 
              onPress={addKeyword} 
              style={{ backgroundColor: "#5865F2", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 4 }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Add Keyword</Text>
            </RN.TouchableOpacity>
          </Stack>

          {storage.keywords.map((kw: string, index: number) => (
            <TableRow
              key={index}
              label={kw}
              trailing={
                <RN.TouchableOpacity 
                  onPress={() => removeKeyword(kw)} 
                  style={{ padding: 6, backgroundColor: "#ED4245", borderRadius: 6 }}
                >
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>X</Text>
                </RN.TouchableOpacity>
              }
            />
          ))}

          <Stack spacing={4} style={{ padding: 10, flexDirection: "row", justifyContent: "space-between" }}>
            <RN.TouchableOpacity 
              onPress={exportKeywords} 
              style={{ backgroundColor: "#4F545C", padding: 10, borderRadius: 8, flex: 1, marginRight: 4, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Export JSON</Text>
            </RN.TouchableOpacity>
            <RN.TouchableOpacity 
              onPress={importKeywords} 
              style={{ backgroundColor: "#4F545C", padding: 10, borderRadius: 8, flex: 1, marginLeft: 4, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Import JSON</Text>
            </RN.TouchableOpacity>
          </Stack>
        </TableRowGroup>

        <TableRowGroup title="Tracking Target">
          <TableSwitchRow
            label="Track Everyone"
            value={storage.trackMode === "everyone"}
            onValueChange={() => (storage.trackMode = "everyone")}
          />
          <TableSwitchRow
            label="Track Friends Only"
            value={storage.trackMode === "friends"}
            onValueChange={() => (storage.trackMode = "friends")}
          />
          <TableSwitchRow
            label="Track Custom Users"
            value={storage.trackMode === "custom"}
            onValueChange={() => (storage.trackMode = "custom")}
          />
          {storage.trackMode === "custom" && (
            <Stack spacing={4} style={{ padding: 10 }}>
              <TextInput
                placeholder="123456789, 987654321"
                value={storage.customIds}
                onChange={(v: string) => (storage.customIds = v)}
              />
            </Stack>
          )}
        </TableRowGroup>

        <TableRowGroup title="Tracking Locations">
          <TableSwitchRow
            label="Track Servers"
            value={storage.trackServers}
            onValueChange={(v: boolean) => (storage.trackServers = v)}
          />
          <TableSwitchRow
            label="Track Group DMs"
            value={storage.trackGroups}
            onValueChange={(v: boolean) => (storage.trackGroups = v)}
          />
          <TableSwitchRow
            label="Track DMs"
            value={storage.trackDMs}
            onValueChange={(v: boolean) => (storage.trackDMs = v)}
          />
        </TableRowGroup>

        <TableRowGroup title="Matching Rules">
          <TableSwitchRow
            label="Exact Match"
            value={storage.exactMatch}
            onValueChange={(v: boolean) => (storage.exactMatch = v)}
          />
          <TableSwitchRow
            label="Case Sensitive"
            value={storage.caseSensitive}
            onValueChange={(v: boolean) => (storage.caseSensitive = v)}
          />
          <TableSwitchRow
            label="Match in a Sentence"
            value={storage.inSentence}
            onValueChange={(v: boolean) => (storage.inSentence = v)}
          />
        </TableRowGroup>

        <TableRowGroup title="Advanced Notifications">
          <TableSwitchRow
            label="Send Notifications to Channel"
            value={storage.sendNotificationToChannel}
            onValueChange={(v: boolean) => (storage.sendNotificationToChannel = v)}
          />
          {storage.sendNotificationToChannel && (
            <Stack spacing={4} style={{ padding: 10 }}>
              <TextInput
                placeholder="Enter Target Channel ID..."
                value={storage.targetChannelId}
                onChange={(v: string) => (storage.targetChannelId = v)}
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
