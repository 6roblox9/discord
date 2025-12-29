import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

export default function Settings() {
    useProxy(storage);

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: "#2f3136", padding: 15 }}>
            <RN.Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                Quest Automator Status
            </RN.Text>
            
            <RN.View style={{ backgroundColor: "#202225", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: "#7289da" }}>
                {storage.logs && storage.logs.length > 0 ? (
                    storage.logs.map((log: any, i: number) => (
                        <RN.View key={i} style={{ marginBottom: 8 }}>
                            <RN.Text style={{ fontSize: 12, color: "#8e9297" }}>
                                [{log.time}] <RN.Text style={{ color: log.color }}>{log.message}</RN.Text>
                            </RN.Text>
                        </RN.View>
                    ))
                ) : (
                    <RN.Text style={{ color: "#72767d" }}>Waiting for tasks...</RN.Text>
                )}
            </RN.View>

            <RN.TouchableOpacity 
                onPress={() => { storage.logs = []; }}
                style={{ marginTop: 20, backgroundColor: "#4e5d94", padding: 10, borderRadius: 5, alignItems: 'center' }}
            >
                <RN.Text style={{ color: "#fff" }}>Clear Terminal</RN.Text>
            </RN.TouchableOpacity>
        </RN.ScrollView>
    );
}

