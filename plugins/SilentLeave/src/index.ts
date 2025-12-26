import { metro } from '@vendetta';
import { instead } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import Settings from "./Settings";

const RequestModule = metro.findByProps("get", "post", "del") || metro.findByProps("get", "post", "put");

let patches = [];

export default {
    onLoad: () => {
        storage.logs ??= [];
        const timestamp = new Date().toLocaleTimeString();
        storage.logs.unshift(`[${timestamp}] Advanced Network Monitor Started`);

        if (RequestModule) {
            const methods = ["del", "delete"]; 
            
            methods.forEach(method => {
                if (typeof RequestModule[method] === "function") {
                    patches.push(instead(method, RequestModule, (args, orig) => {
                        let requestObj = args[0];
                        let url = typeof requestObj === 'string' ? requestObj : requestObj?.url;

                        if (url && url.includes("/channels/")) {
                            const time = new Date().toLocaleTimeString();
                            
                            if (typeof requestObj === 'string') {
                                if (url.includes("silent=false")) {
                                    args[0] = url.replace("silent=false", "silent=true");
                                    storage.logs.unshift(`[${time}] URL Patched (String)`);
                                } else if (!url.includes("silent=")) {
                                    args[0] = url.includes("?") ? `${url}&silent=true` : `${url}?silent=true`;
                                    storage.logs.unshift(`[${time}] Silent Param Added`);
                                }
                            } else if (requestObj && typeof requestObj === 'object') {
                                if (requestObj.query) {
                                    requestObj.query.silent = true;
                                    storage.logs.unshift(`[${time}] Query Object Patched`);
                                } else {
                                    requestObj.url = url.includes("?") ? `${url}&silent=true` : `${url}?silent=true`;
                                    storage.logs.unshift(`[${time}] Object URL Patched`);
                                }
                            }
                        }
                        return orig(...args);
                    }));
                }
            });
        }
    },
    onUnload: () => {
        patches.forEach(unpatch => unpatch());
    },
    settings: Settings,
}
