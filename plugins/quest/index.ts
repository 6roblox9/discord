import { findByProps } from "@vendetta/metro";
import Settings from "./settings";
import { log, clearLogs } from "./logger";

const { getToken } = findByProps("getToken");

let isUnloaded = false;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36';

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
    client_launch_id: '80933496-6512-4217-86e5-42289632435f',
    browser_user_agent: USER_AGENT,
    browser_version: '37.6.0',
    os_sdk_version: '19045',
    client_build_number: 471091,
    native_build_number: 72186,
    client_event_source: null,
    launch_signature: '80933496-6512-4217-86e5-42289632435f',
    client_heartbeat_session_id: '80933496-6512-4217-86e5-42289632435f',
    client_app_state: 'focused'
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function toBase64(obj: any) {
    const str = JSON.stringify(obj);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    for (let block = 0, charCode, i = 0, map = chars;
        str.charAt(i | 0) || (map = '=', i % 1);
        output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
        charCode = str.charCodeAt(i += 3 / 4);
        block = block << 8 | charCode;
    }
    return output;
}

function getHeaders() {
    return {
        Authorization: getToken(),
        "User-Agent": USER_AGENT,
        "x-super-properties": toBase64(PROPS),
        "Content-Type": "application/json"
    };
}

async function retry(fn: () => Promise<any>, n = 5): Promise<any> {
    for (let i = 0; i < n; i++) {
        if (isUnloaded) return null;
        try {
            return await fn();
        } catch {
            await sleep(3000);
        }
    }
    return null;
}

async function fetchQuests() {
    const r = await retry(() =>
        fetch('https://discord.com/api/v9/quests/@me', {
            headers: getHeaders()
        })
    );
    return r ? r.json() : { quests: [] };
}

async function enroll(id: string) {
    await retry(() =>
        fetch(`https://discord.com/api/v9/quests/${id}/enroll`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ location: 11, is_targeted: false, metadata_raw: null })
        })
    );
}

async function video(id: string, ts: number) {
    const r = await retry(() =>
        fetch(`https://discord.com/api/v9/quests/${id}/video-progress`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ timestamp: ts })
        })
    );
    return r ? r.json() : {};
}

async function heartbeat(id: string, app: string, terminal: boolean) {
    const r = await retry(() =>
        fetch(`https://discord.com/api/v9/quests/${id}/heartbeat`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ application_id: app, terminal })
        })
    );
    return r ? r.json() : {};
}

async function getFreshQuest(id: string) {
    const data = await fetchQuests();
    return (data.quests || []).find((q: any) => q.id === id);
}

async function runTask(q: any, task: string) {
    if (isUnloaded) return;
    const questName = q.config.messages.quest_name;
    const id = q.id;
    const need = q.config.task_config.tasks[task].target;
    let done = q.user_status?.progress?.[task]?.value || 0;
    let lastPrint = 0;

    log('Y', `${questName} type: ${task}`);

    if (task.includes('WATCH_VIDEO')) {
        while (done < need) {
            if (isUnloaded) break;
            const ts = Math.min(need, done + 7 + Math.random());
            const r = await video(id, ts);
            done = ts;
            if (Date.now() - lastPrint >= 10000) {
                log('C', `${questName} ${Math.min(done, need).toFixed(0)}/${need}`);
                lastPrint = Date.now();
            }
            if (r.completed_at || (r.user_status && r.user_status.completed_at)) break;
            await sleep(2000);
        }
    } else {
        while (true) {
            if (isUnloaded) break;
            const r = await heartbeat(id, q.config.application.id, false);
            const status = r.user_status || r;
            done = status.progress?.[task]?.value || done;
            if (Date.now() - lastPrint >= 10000) {
                log('C', `${questName} ${done}/${need}`);
                lastPrint = Date.now();
            }
            if (status.completed_at) break;
            await sleep(30000);
        }
        if (!isUnloaded) await heartbeat(id, q.config.application.id, true);
    }
    log('G', `${questName} ${task} completed`);
}

async function processQuest(initialQuest: any) {
    let q = initialQuest;
    if (!q.user_status?.enrolled_at) {
        log('Y', `Enrolling in ${q.config.messages.quest_name}...`);
        await enroll(q.id);
        await sleep(2000);
    }

    while (true) {
        if (isUnloaded) break;
        q = await getFreshQuest(q.id);
        if (!q || q.user_status?.completed_at) break;

        const tasks = Object.keys(q.config.task_config.tasks);
        const pending = tasks.filter(t => {
            const need = q.config.task_config.tasks[t].target;
            const done = q.user_status?.progress?.[t]?.value || 0;
            return done < need;
        });

        if (pending.length === 0) break;
        await runTask(q, pending[0]);
        await sleep(3000);
    }
    log('G', `${q.config.messages.quest_name} fully finished`);
}

async function main() {
    if (!getToken()) {
        log('X', 'Error: No Token');
        return;
    }
    log('Y', 'Fetching quests...');
    try {
        const data = await fetchQuests();
        const quests = (data.quests || []).filter((q: any) => 
            !q.user_status?.completed_at && new Date(q.config.expires_at) > new Date()
        );

        log('Y', `Active quests to process: ${quests.length}`);

        for (const q of quests) {
            if (isUnloaded) break;
            await processQuest(q);
            await sleep(5000);
        }
        log('G', 'All available quests have been processed.');
    } catch (e: any) {
        log('X', `Error: ${e.message}`);
    }
}

export default {
    onLoad: () => {
        isUnloaded = false;
        clearLogs();
        log('C', 'Auto Quest Started');
        main();
    },
    onUnload: () => {
        isUnloaded = true;
    },
    settings: Settings,
};

