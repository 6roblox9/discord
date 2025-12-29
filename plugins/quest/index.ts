import { findByProps } from "@vendetta/metro";
import Settings from "./settings";
import { log, clearLogs } from "./logger";

const { getToken } = findByProps("getToken");
const { getSuperPropertiesBase64 } = findByProps("getSuperPropertiesBase64");

let isUnloaded = false;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function getHeaders() {
    return {
        Authorization: getToken(),
        "x-super-properties": getSuperPropertiesBase64(),
        "Content-Type": "application/json"
    };
}

async function fetchQuests() {
    const res = await fetch('https://discord.com/api/v9/quests/@me', { headers: getHeaders() });
    return res.json();
}

async function enroll(id: string) {
    await fetch(`https://discord.com/api/v9/quests/${id}/enroll`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ location: 11 })
    });
}

async function sendVideoProgress(id: string, timestamp: number) {
    const res = await fetch(`https://discord.com/api/v9/quests/${id}/video-progress`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ timestamp })
    });
    return res.json();
}

async function sendHeartbeat(id: string, applicationId: string, terminal: boolean) {
    const res = await fetch(`https://discord.com/api/v9/quests/${id}/heartbeat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
            application_id: applicationId, 
            terminal 
        })
    });
    return res.json();
}

async function runTask(quest: any, taskType: string) {
    if (isUnloaded) return;

    const questName = quest.config.messages.quest_name;
    const taskConfig = quest.config.task_config.tasks[taskType];
    const target = taskConfig.target;
    
    let currentProgress = quest.user_status?.progress?.[taskType]?.value || 0;

    log('Y', `Starting ${questName} [${taskType}]`);
    log('C', `Progress: ${currentProgress}/${target}`);

    if (taskType.includes('WATCH_VIDEO') || taskType === 'QUEST_TASK_WATCH_VIDEO') {
        while (currentProgress < target) {
            if (isUnloaded) return;
            
            const increment = 7 + Math.random();
            const newTimestamp = Math.min(target, currentProgress + increment);
            
            const res = await sendVideoProgress(quest.id, newTimestamp);
            
            currentProgress += 7;
            log('C', `Watching... ${Math.min(currentProgress, target).toFixed(0)}/${target}`);

            if (res.user_status?.completed_at) break;
            await sleep(2000);
        }
    } else {
        while (currentProgress < target) {
            if (isUnloaded) return;

            const res = await sendHeartbeat(quest.id, quest.config.application.id, false);
            currentProgress = res.user_status?.progress?.[taskType]?.value || currentProgress;
            
            log('C', `Playing... ${currentProgress}/${target}`);

            if (res.user_status?.completed_at) break;
            await sleep(30000);
        }
        await sendHeartbeat(quest.id, quest.config.application.id, true);
    }

    log('G', `Task ${taskType} Completed!`);
}

async function processQuest(initialQuest: any) {
    let q = initialQuest;
    log('G', `Found Quest: ${q.config.messages.quest_name}`);

    if (!q.user_status?.enrolled_at) {
        log('Y', 'Enrolling...');
        await enroll(q.id);
        await sleep(1000);
        const data = await fetchQuests();
        q = data.quests.find((x: any) => x.id === q.id);
    }

    const tasks = Object.keys(q.config.task_config.tasks);
    
    for (const task of tasks) {
        if (isUnloaded) break;

        const target = q.config.task_config.tasks[task].target;
        const progress = q.user_status?.progress?.[task]?.value || 0;

        if (progress < target) {
            await runTask(q, task);
            await sleep(2000);
        }
    }

    log('G', `Quest ${q.config.messages.quest_name} Done.`);
}

async function main() {
    if (!getToken()) {
        log('R', 'Error: No Token found.');
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

        log('G', 'All operations finished.');

    } catch (e: any) {
        log('R', `Error: ${e.message}`);
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
        log('R', 'Plugin Unloaded.');
    },
    settings: Settings,
};

