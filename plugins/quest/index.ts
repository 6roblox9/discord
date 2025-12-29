import { findByProps } from "@vendetta/metro";
import Settings from "./settings";
import { log, clearLogs } from "./logger";

const { getToken } = findByProps("getToken");

let isUnloaded = false;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36';

function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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
    client_launch_id: randomUUID(),
    browser_user_agent: USER_AGENT,
    browser_version: '37.6.0',
    os_sdk_version: '19045',
    client_build_number: 471091,
    native_build_number: 72186,
    client_event_source: null,
    launch_signature: randomUUID(),
    client_heartbeat_session_id: randomUUID(),
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
        if (charCode > 0xFF) throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
        block = block << 8 | charCode;
    }
    return output;
}

function getHeaders(contentType = false) {
    const headers: any = {
        Authorization: getToken(),
        "User-Agent": USER_AGENT,
        "x-super-properties": toBase64(PROPS)
    };
    if (contentType) headers["Content-Type"] = "application/json";
    return headers;
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
    throw new Error("Request failed after retries");
}

async function fetchQuests() {
    const r = await retry(() =>
        fetch('https://discord.com/api/v10/quests/@me', {
            headers: getHeaders()
        })
    );
    return r ? r.json() : { quests: [] };
}

async function enroll(id: string) {
    await retry(() =>
        fetch(`https://discord.com/api/v10/quests/${id}/enroll`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ location: 11, is_targeted: false, metadata_raw: null })
        })
    );
}

async function video(id: string, ts: number) {
    const r = await retry(() =>
        fetch(`https://discord.com/api/v10/quests/${id}/video-progress`, {
            method: 'POST',
            headers: getHeaders(true),
            body: JSON.stringify({ timestamp: ts })
        })
    );
    return r ? r.json() : {};
}

async function heartbeat(id: string, app: string, terminal: boolean) {
    const r = await retry(() =>
        fetch(`https://discord.com/api/v10/quests/${id}/heartbeat`, {
            method: 'POST',
            headers: getHeaders(true),
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

            const r = await video(id, Math.min(need, done + 7 + Math.random()));
            done += 7;

            if (Date.now() - lastPrint >= 10000) {
                log('C', `${questName} ${Math.min(done, need)}/${need} remaining ${Math.max(0, need - done)}`);
                lastPrint = Date.now();
            }

            if (r.completed_at) break;
            await sleep(2000);
        }
    } else {
        while (true) {
            if (isUnloaded) break;

            const r = await heartbeat(id, q.config.application.id, false);
            done = r.progress?.[task]?.value || done;

            if (Date.now() - lastPrint >= 10000) {
                log('C', `${questName} ${done}/${need} remaining ${Math.max(0, need - done)}`);
                lastPrint = Date.now();
            }

            if (r.completed_at) break;
            await sleep(30000);
        }
        if (!isUnloaded) {
            await heartbeat(id, q.config.application.id, true);
        }
    }

    log('G', `${questName} ${task} completed`);
}

async function processQuest(initialQuest: any) {
    let q = initialQuest;
    if (!q.user_status?.enrolled_at) await enroll(q.id);

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

        if (!pending.length) break;

        await runTask(q, pending[0]);
        await sleep(3000);
    }

    if (q) log('G', `${q.config.messages.quest_name} fully completed`);
}

async function main() {
    if (!getToken()) {
        log('X', 'Error: No Token found.');
        return;
    }

    log('Y', 'Checking for Quests...');
    
    try {
        const data = await fetchQuests();
        const quests = (data.quests || []).filter((q: any) => 
            !q.user_status?.completed_at && 
            new Date(q.config.expires_at) > new Date()
        );

        if (quests.length === 0) {
            log('X', 'No active quests found. Stopping.');
            return;
        }

        log('Y', `Found ${quests.length} active quests.`);

        for (const q of quests) {
            if (isUnloaded) break;
            await processQuest(q);
        }

        log('G', 'All quests finished');

    } catch (e: any) {
        log('X', `Error: ${e.message}`);
    }
}

export default {
    onLoad: () => {
        isUnloaded = false;
        clearLogs();
        log('C', 'Auto Quest Plugin Started');
        main();
    },
    onUnload: () => {
        isUnloaded = true;
        log('X', 'Plugin Unloaded.');
    },
    settings: Settings,
};
