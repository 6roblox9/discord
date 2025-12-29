import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";

export default function Settings() {
  const logs = storage.logs || [];

  return (
    <RN.ScrollView style={{ flex: 1, backgroundColor: "#2f3136", padding: 16 }}>
      <RN.View style={{ marginBottom: 16 }}>
        <RN.Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
          Quest Auto Solver
        </RN.Text>
        <RN.Text style={{ color: "#b9bbbe", marginTop: 4 }}>
          Runs once on Discord launch
        </RN.Text>
      </RN.View>

      <RN.TouchableOpacity
        onPress={() => storage.logs = []}
        style={{
          backgroundColor: "#5865f2",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          marginBottom: 16
        }}
      >
        <RN.Text style={{ color: "#fff", fontWeight: "bold" }}>
          Clear Logs
        </RN.Text>
      </RN.TouchableOpacity>

      <RN.View>
        {logs.length === 0 && (
          <RN.Text style={{ color: "#b9bbbe" }}>
            No logs
          </RN.Text>
        )}
        {logs.map((l: string, i: number) => (
          <RN.Text key={i} style={{ color: "#fff", marginBottom: 4 }}>
            {l}
          </RN.Text>
        ))}
      </RN.View>
    </RN.ScrollView>
  );
}
