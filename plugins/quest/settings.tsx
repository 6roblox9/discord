import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";

export default function Settings() {
  const [ids, setIds] = React.useState((storage.userIds ?? []).join(","));
  const [trackFriends, setTrackFriends] = React.useState(storage.trackFriends ?? true);

  function apply() {
    storage.userIds = ids.split(",").map(i => i.trim()).filter(Boolean);
    storage.trackFriends = trackFriends;
    showToast("settings applied");
  }

  return (
    <RN.ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#2f3136" }}>
      <RN.Text style={{ color: "#fff", fontSize: 16, marginBottom: 6 }}>
        Track Friends
      </RN.Text>

      <RN.Switch
        value={trackFriends}
        onValueChange={setTrackFriends}
        style={{ marginBottom: 16 }}
      />

      <RN.Text style={{ color: "#fff", fontSize: 16, marginBottom: 6 }}>
        Specific User IDs
      </RN.Text>

      <RN.TextInput
        value={ids}
        onChangeText={setIds}
        placeholder="123, 456, 789"
        placeholderTextColor="#aaa"
        style={{
          borderWidth: 1,
          borderColor: "#7289da",
          padding: 10,
          borderRadius: 8,
          color: "#fff",
          backgroundColor: "#202225",
          marginBottom: 16,
        }}
      />

      <RN.TouchableOpacity
        onPress={apply}
        style={{
          backgroundColor: "#7289da",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <RN.Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Apply
        </RN.Text>
      </RN.TouchableOpacity>
    </RN.ScrollView>
  );
}

