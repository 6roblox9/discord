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
    if (!storage.logs) storage.logs = [];
    storage.logs.push({ time, color, message });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function retry(fn: Function, n = 5) {
    for (let i = 0; i < n; i++) {
        try { return await fn(); } catch { await sleep(3000); }
    }
}

async function apiRequest(endpoint: string, method = "GET", body?: any) {
    const token = getToken();
    const res = await retry(() => fetch(`https://discord.com/api/v10${endpoint}`, {
        method,
        headers: {
            Authorization: token,
            "Content-Type": "application/json",
            "x-super-properties": superProps,
            "User-Agent": PROPS.browser_user_agent
        },
        body: body ? JSON.stringify(body) : undefined
    }));
    return res.json();
}

async function getFreshQuest(id: string) {
    const data = await apiRequest("/quests/@me");
    return (data.quests || []).find((q: any) => q.id === id);
}

async function runTask(q: any, task: string) {
    const questName = q.config?.messages?.quest_name || "Unknown Quest";
    const id = q.id;
    const taskConfig = q.config?.task_config?.tasks[task];
    if (!taskConfig) return;

    const need = taskConfig.target;
    let done = q.user_status?.progress?.[task]?.value || 0;
    let lastPrint = 0;

    addLog("#faa81a", `${questName} type: ${task}`);

    if (task.includes('WATCH_VIDEO')) {
        while (done < need) {
            const r = await apiRequest(`/quests/${id}/video-progress`, "POST", { timestamp: Math.min(need, done + 7 + Math.random()) });
            done += 7;
            if (Date.now() - lastPrint >= 10000) {
                addLog("#00bfff", `${questName} ${Math.min(done, need)}/${need} remaining ${Math.max(0, need - done)}`);
                lastPrint = Date.now();
            }
            if (r.completed_at) break;
            await sleep(2000);
        }
    } else {
        while (true) {
            const r = await apiRequest(`/quests/${id}/heartbeat`, "POST", { application_id: q.config.application.id, terminal: false });
            done = r.progress?.[task]?.value || done;
            if (Date.now() - lastPrint >= 10000) {
                addLog("#00bfff", `${questName} ${done}/${need} remaining ${Math.max(0, need - done)}`);
                lastPrint = Date.now();
            }
            if (r.completed_at) break;
            await sleep(30000);
        }
        await apiRequest(`/quests/${id}/heartbeat`, "POST", { application_id: q.config.application.id, terminal: true });
    }
    addLog("#36e333", `${questName} ${task} completed`);
}

async function processQuest(initialQuest: any) {
    let q = initialQuest;
    if (!q || !q.config) return;

    if (!q.user_status?.enrolled_at) {
        await apiRequest(`/quests/${q.id}/enroll`, "POST", { location: 11, is_targeted: false, metadata_raw: null });
    }

    while (true) {
        q = await getFreshQuest(q.id);
        if (!q || q.user_status?.completed_at) break;

        const tasks = Object.keys(q.config?.task_config?.tasks || {});
        const pending = tasks.filter(t => {
            const taskConf = q.config.task_config.tasks[t];
            const done = q.user_status?.progress?.[t]?.value || 0;
            return done < taskConf.target;
        });

        if (!pending.length) break;

        await runTask(q, pending[0]);
        await sleep(3000);
    }

    if (q && q.config) {
        addLog("#36e333", `${q.config.messages.quest_name} fully completed`);
    }
}

async function main() {
    storage.logs = [];
    try {
        const user = await apiRequest("/users/@me");
        if (user.id) {
            addLog("#36e333", `Logged ${user.username}#${user.discriminator}`);
        }
        
        const data = await apiRequest("/quests/@me");
        const quests = (data.quests || []).filter((q: any) =>
            q.config &&
            !q.user_status?.completed_at &&
            new Date(q.config.expires_at) > new Date()
        );
        
        addLog("#faa81a", `Quests found: ${quests.length}`);
        for (const q of quests) {
            await processQuest(q);
            await sleep(2000);
        }
        addLog("#36e333", 'All quests finished');
    } catch (error) {
        addLog("#ff4747", `Fatal Error: ${error.message}`);
    }
}

export default {
    onLoad() {
        main();
    },
    onUnload() {},
    settings: Settings
};

