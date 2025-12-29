import { React, ReactNative as RN } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";

export default function Settings() {
    useProxy(storage);

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: "#36393f", padding: 10 }}>
            <RN.Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: 'center' }}>
                Quest Auto-Completer Logs
            </RN.Text>
            
            <RN.View style={{ backgroundColor: "#202225", borderRadius: 8, padding: 10, minHeight: 300 }}>
                {storage.logs?.length > 0 ? (
                    storage.logs.map((log: any, i: number) => (
                        <RN.View key={i} style={{ marginBottom: 5, flexDirection: 'row' }}>
                            <RN.Text style={{ color: "#8e9297", fontSize: 12, marginRight: 5 }}>
                                [{log.time}]
                            </RN.Text>
                            <RN.Text style={{ color: log.color, fontSize: 13, fontWeight: '500' }}>
                                {log.message}
                            </RN.Text>
                        </RN.View>
                    ))
                ) : (
                    <RN.Text style={{ color: "#bbb", textAlign: 'center', marginTop: 20 }}>
                        No logs yet. Restart Discord to trigger.
                    </RN.Text>
                )}
            </RN.View>

            <RN.TouchableOpacity 
                onPress={() => { storage.logs = []; }}
                style={{ marginTop: 20, backgroundColor: "#f04747", padding: 12, borderRadius: 8, alignItems: 'center' }}
            >
                <RN.Text style={{ color: "#fff", fontWeight: "bold" }}>Clear Logs</RN.Text>
            </RN.TouchableOpacity>
        </RN.ScrollView>
    );
}

