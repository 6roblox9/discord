import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { metro } from "@vendetta";
import { Forms } from "@vendetta/ui/components";

const { ScrollView, Text, View } = metro.findByProps("ScrollView", "Text", "View");
const { FormSection, FormRow } = Forms;

export default () => {
    useProxy(storage);

    return (
        <ScrollView style={{ flex: 1 }}>
            <FormSection title="Plugin Logs">
                {storage.logs?.length > 0 ? (
                    storage.logs.map((log: string, index: number) => (
                        <FormRow
                            key={index}
                            label={log}
                            labelStyle={{ fontSize: 10, fontFamily: "monospace" }}
                        />
                    ))
                ) : (
                    <FormRow label="No activity detected yet" />
                )}
            </FormSection>
            <View style={{ padding: 20 }}>
                <Text 
                    style={{ color: "#ff4444", textAlign: "center", fontWeight: "bold" }} 
                    onPress={() => storage.logs = []}
                >
                    CLEAR LOGS
                </Text>
            </View>
        </ScrollView>
    );
};
