import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

export default function Settings() {
  useProxy(storage);

  return (
    <RN.ScrollView style={{ flex: 1, backgroundColor: "#2f3136" }}>
      <RN.View style={{ padding: 16 }}>
        <RN.Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Terminal Logs
        </RN.Text>
        <RN.View style={{ backgroundColor: "#1e1f22", borderRadius: 8, padding: 10, minHeight: 400 }}>
          {storage.logs && storage.logs.length > 0 ? (
            storage.logs.map((log: any, i: number) => (
              <RN.View key={i} style={{ marginBottom: 4 }}>
                <RN.Text style={{ fontFamily: "monospace", fontSize: 12 }}>
                  <RN.Text style={{ color: "#8e9297" }}>[{log.time}] </RN.Text>
                  <RN.Text style={{ color: log.color }}>{log.message}</RN.Text>
                </RN.Text>
              </RN.View>
            ))
          ) : (
            <RN.Text style={{ color: "#72767d", fontFamily: "monospace" }}>No activity...</RN.Text>
          )}
        </RN.View>
        <RN.TouchableOpacity
          onPress={() => { storage.logs = []; }}
          style={{ marginTop: 16, backgroundColor: "#5865f2", padding: 12, borderRadius: 8, alignItems: "center" }}
        >
          <RN.Text style={{ color: "#fff", fontWeight: "bold" }}>Clear Logs</RN.Text>
        </RN.TouchableOpacity>
      </RN.View>
    </RN.ScrollView>
  );
}

