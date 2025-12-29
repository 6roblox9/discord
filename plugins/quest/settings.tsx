import { React, ReactNative as RN } from "@vendetta/metro/common"
import { storage } from "@vendetta/plugin"

export default function Settings(){
  const logs = storage.logs || []

  return (
    <RN.ScrollView style={{flex:1,backgroundColor:'#2f3136',padding:12}}>
      {logs.map((l:string,i:number)=>(
        <RN.Text key={i} style={{color:'#ccc',marginBottom:4}}>
          {l}
        </RN.Text>
      ))}
    </RN.ScrollView>
  )
}

