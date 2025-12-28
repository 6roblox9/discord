import { React } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { showToast } from "@vendetta/ui/toasts";
import { ScrollView, TextInput, View } from "@vendetta/metro/common";
import { Button } from "$/lib/redesign";

const getToken = () => {
  try {
    return require("@vendetta/metro").findByProps("getToken").getToken();
  } catch { return null; }
};

function applyValue(value: number) {
  const token = getToken();
  if (!token) return showToast("Failed to get token");

  if (value === 0) {
    fetch("https://discord.com/api/v9/hypesquad/online", {
      method: "DELETE",
      headers: { Authorization: token },
    }).then(r => showToast(r.ok ? "HypeSquad removed" : `Failed: ${r.status}`));
    return;
  }

  if (![1, 2, 3].includes(value)) {
    showToast("Only 0, 1, 2, 3 allowed");
    return;
  }

  fetch("https://discord.com/api/v9/hypesquad/online", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ house_id: value }),
  }).then(r => showToast(r.ok ? `HypeSquad set to ${value}` : `Failed: ${r.status}`));
}

export default function Settings() {
  const [val, setVal] = React.useState(storage.hsValue ?? "");

  return (
    <ScrollView style={{ flex: 1, padding: 12 }}>
      <View style={{ marginBottom: 12 }}>
        <TextInput
          placeholder="0 = remove, 1-3 = house"
          value={val}
          onChangeText={v => setVal(v)}
          style={{ borderWidth: 1, borderColor: "#555", padding: 8, borderRadius: 6, color: "#fff" }}
        />
      </View>

      <Button
        text="Apply"
        variant="primary"
        size="md"
        onPress={() => {
          storage.hsValue = val;
          applyValue(Number(val));
        }}
      />
    </ScrollView>
  );
}

