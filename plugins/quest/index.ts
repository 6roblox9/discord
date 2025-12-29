import { findByProps } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import Settings from "./settings";

const getToken = findByProps("getToken").getToken;

const PROPS = {
    os: 'Windows',
    browser: 'Discord Client',
    release_channel: 'stable',
    client_version: '1.0.9215',
    os_version: '10.0.19045',
    os_arch: 'x64',
    app_arch: 'x64',
    system_locale: 'en-US',
    has_client_mods: false,
    client_launch_id: Math.random().toString(36),
    browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36',
    browser_version: '37.6.0',
    os_sdk_version: '19045',
    client_build_number: 471091,
    native_build_number: 72186,
    client_event_source: null,
    launch_signature: Math.random().toString(36),
    client_heartbeat_session_id: Math.random().toString(36),
    client_app_state: 'focused'
};

const superProps = btoa(JSON.stringify(PROPS));

function addLog(color: string, message: string) {
    const time = new Date().toLocaleTimeString();
    const newLog = { time, color, message };
    if (!storage.logs) storage.logs = [];
    storage.logs.push(newLog);
}

async function apiRequest(endpoint: string, method = "GET", body?: any) {
    const token = getToken();
    const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
        method,
        headers: {
            Authorization: token,
            "Content-Type": "application/json",
            "x-super-properties": superProps,
            "User-Agent": PROPS.browser_user_agent
        },
        body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
}

async function runQuests() {
    storage.logs = []; 
    addLog("#36e333", "Checking for quests...");

    try {
        const data = await apiRequest("/quests/@me");
        const quests = (data.quests || []).filter((q: any) => !q.user_status?.completed_at && new Date(q.config.expires_at) > new Date());

        if (quests.length === 0) {
            addLog("#faa81a", "No active quests found.");
            return;
        }

        addLog("#00bfff", `Found ${quests.length} quests.`);

        for (const q of quests) {
            const questName = q.config.messages.quest_name;
            const id = q.id;

            if (!q.user_status?.enrolled_at) {
                await apiRequest(`/quests/${id}/enroll`, "POST", { location: 11, is_targeted: false, metadata_raw: null });
                addLog("#00ff7f", `Enrolled in: ${questName}`);
            }

            const tasks = Object.keys(q.config.task_config.tasks);
            for (const task of tasks) {
                const need = q.config.task_config.tasks[task].target;
                let done = q.user_status?.progress?.[task]?.value || 0;

                addLog("#ffeb3b", `Starting task: ${task} for ${questName}`);

                while (done < need) {
                    if (task.includes("WATCH_VIDEO")) {
                        const r = await apiRequest(`/quests/${id}/video-progress`, "POST", { timestamp: Math.min(need, done + 7) });
                        done += 7;
                        if (r.completed_at) break;
                        await new Promise(r => setTimeout(r, 2500));
                    } else {
                        const r = await apiRequest(`/quests/${id}/heartbeat`, "POST", { application_id: q.config.application.id, terminal: false });
                        done = r.progress?.[task]?.value || done;
                        if (r.completed_at) break;
                        await new Promise(r => setTimeout(r, 30000));
                    }
                }
                addLog("#36e333", `Finished task: ${task}`);
            }
        }
        addLog("#36e333", "All quests completed!");
    } catch (e) {
        addLog("#ff4747", `Error: ${e.message}`);
    }
}

export default {
    onLoad() {
        runQuests();
    },
    onUnload() {},
    settings: Settings
};

