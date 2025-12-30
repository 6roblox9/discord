import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

export default function Settings() {
    useProxy(storage);

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: "#2f3136", padding: 16 }}>
            <RN.Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
                Quest Automator Logs
            </RN.Text>
            
            <RN.View style={{ backgroundColor: "#202225", borderRadius: 8, padding: 12, borderLeftWidth: 4, borderLeftColor: "#7289da" }}>
                {storage.logs && storage.logs.length > 0 ? (
                    storage.logs.map((log: any, i: number) => (
                        <RN.View key={i} style={{ marginBottom: 6, flexDirection: "row", flexWrap: "wrap" }}>
                            <RN.Text style={{ color: "#8e9297", fontSize: 12 }}>
                                [{log.time}] 
                            </RN.Text>
                            <RN.Text style={{ color: log.color, fontSize: 13, marginLeft: 6, fontWeight: "500" }}>
                                {log.message}
                            </RN.Text>
                        </RN.View>
                    ))
                ) : (
                    <RN.Text style={{ color: "#72767d", italic: true }}>
                        No activity recorded yet.
                    </RN.Text>
                )}
            </RN.View>

            <RN.TouchableOpacity 
                onPress={() => { storage.logs = []; }}
                style={{ marginTop: 20, backgroundColor: "#4e5d94", padding: 14, borderRadius: 8, alignItems: "center" }}
            >
                <RN.Text style={{ color: "#fff", fontWeight: "bold" }}>Clear Logs</RN.Text>
            </RN.TouchableOpacity>
        </RN.ScrollView>
    );
}

