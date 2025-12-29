import { findByProps } from "@vendetta/metro"
import { showToast } from "@vendetta/ui/toasts"
import { storage } from "@vendetta/plugin"

const getToken = findByProps("getToken").getToken

let running = false

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36'

const PROPS = {
  os: 'Windows',
  browser: 'Discord Client',
  release_channel: 'stable',
  client_version: '1.0.9215'
}

const sleep = (ms:number)=>new Promise(r=>setTimeout(r,ms))
const time = ()=>new Date().toLocaleTimeString()

function log(type:string,msg:string){
  storage.logs.push(`[${time()}] ${msg}`)
}

async function req(url:string,method='GET',body?:any){
  const token = getToken()
  if(!token) throw new Error("No token")

  const r = await fetch(url,{
    method,
    headers:{
      Authorization: token,
      'User-Agent': USER_AGENT,
      'x-super-properties': btoa(JSON.stringify(PROPS)),
      'Content-Type':'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })
  return r.json()
}

async function fetchQuests(){
  return req('https://discord.com/api/v10/quests/@me')
}

async function enroll(id:string){
  await req(`https://discord.com/api/v10/quests/${id}/enroll`,'POST',{
    location:11,is_targeted:false,metadata_raw:null
  })
}

async function video(id:string,ts:number){
  return req(`https://discord.com/api/v10/quests/${id}/video-progress`,'POST',{timestamp:ts})
}

async function heartbeat(id:string,app:string,terminal:boolean){
  return req(`https://discord.com/api/v10/quests/${id}/heartbeat`,'POST',{
    application_id:app,terminal
  })
}

async function runTask(q:any,task:string){
  const need = q.config.task_config.tasks[task].target
  let done = q.user_status?.progress?.[task]?.value || 0

  log('Y',`${q.config.messages.quest_name} ${task}`)

  if(task.includes('WATCH_VIDEO')){
    while(done < need){
      await video(q.id,Math.min(need,done+7))
      done += 7
      log('C',`${done}/${need}`)
      await sleep(2000)
    }
  }else{
    while(done < need){
      const r = await heartbeat(q.id,q.config.application.id,false)
      done = r.progress?.[task]?.value || done
      log('C',`${done}/${need}`)
      await sleep(30000)
    }
    await heartbeat(q.id,q.config.application.id,true)
  }

  log('G',`${task} completed`)
}

async function processQuest(q:any){
  if(!q.user_status?.enrolled_at) await enroll(q.id)

  while(true){
    const fresh = (await fetchQuests()).quests.find((x:any)=>x.id===q.id)
    if(!fresh || fresh.user_status?.completed_at) break

    const tasks = Object.keys(fresh.config.task_config.tasks)
    const pending = tasks.filter(t=>{
      const need = fresh.config.task_config.tasks[t].target
      const done = fresh.user_status?.progress?.[t]?.value || 0
      return done < need
    })

    if(!pending.length) break
    await runTask(fresh,pending[0])
    await sleep(3000)
  }

  log('G',`${q.config.messages.quest_name} done`)
}

async function start(){
  if(running) return
  running = true
  storage.logs = []

  const data = await fetchQuests()
  const quests = (data.quests||[]).filter((q:any)=>
    !q.user_status?.completed_at &&
    new Date(q.config.expires_at)>new Date()
  )

  if(!quests.length){
    log('X','No quests')
    running=false
    return
  }

  for(const q of quests) await processQuest(q)

  log('G','All quests finished')
  running=false
}

export default {
  onLoad(){
    start()
  },
  onUnload(){
    running=false
  }
}

