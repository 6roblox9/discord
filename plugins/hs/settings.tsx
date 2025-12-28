// settings.tsx
import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const getToken = findByProps("getToken").getToken;

function applyValue(value: number) {
  const token = getToken();
  if (!token) return showToast("Failed to get token");

  if (value === 0) {
    fetch("https://discord.com/api/v9/hypesquad/online", {
      method: "DELETE",
      headers: { Authorization: token },
    })
      .then(res => showToast(res.ok ? "HypeSquad removed" : `Failed: ${res.status}`))
      .catch(e => showToast(`Error: ${e.message}`));
    return;
  }

  if (![1, 2, 3].includes(value)) {
    showToast("Only 0-3 allowed");
    return;
  }

  fetch("https://discord.com/api/v9/hypesquad/online", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ house_id: value }),
  })
    .then(res => showToast(res.ok ? `HypeSquad set to ${value}` : `Failed: ${res.status}`))
    .catch(e => showToast(`Error: ${e.message}`));
}

export default function Settings() {
  const [val, setVal] = React.useState(storage.hsValue ?? "");

  return (
    <RN.ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#2f3136" }}>
      {/* Instructions */}
      <RN.View style={{ marginBottom: 16 }}>
        <RN.Text style={{ color: "#fff", fontSize: 16, marginBottom: 6 }}>
          💡 Instructions:
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          - Use commands in Discord: /hs1, /hs2, /hs3 to select HypeSquad house.
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          - Use /hsr to remove your HypeSquad house.
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          - Here you can set a value from 0 to 3:
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          0 = Remove HypeSquad
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          1 = First house
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          2 = Second house
        </RN.Text>
        <RN.Text style={{ color: "#fff", marginBottom: 4 }}>
          3 = Third house
        </RN.Text>
      </RN.View>

      {/* Input */}
      <RN.View style={{ marginBottom: 12 }}>
        <RN.TextInput
          placeholder="Enter 0-3"
          placeholderTextColor="#ccc"
          value={val}
          onChangeText={setVal}
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: "#7289da",
            padding: 10,
            borderRadius: 8,
            color: "#fff",
            fontSize: 16,
            backgroundColor: "#202225",
          }}
        />
      </RN.View>

      {/* Apply Button */}
      <RN.TouchableOpacity
        onPress={() => {
          storage.hsValue = val;
          applyValue(Number(val));
        }}
        style={{
          backgroundColor: "#7289da",
          paddingVertical: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <RN.Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
          Apply
        </RN.Text>
      </RN.TouchableOpacity>
    </RN.ScrollView>
  );
}

