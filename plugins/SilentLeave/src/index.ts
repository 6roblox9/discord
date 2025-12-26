import { findByProps } from '@vendetta/metro';
import { instead } from '@vendetta/patcher';
import { logger } from "@vendetta";
import Settings from "./Settings";

const HTTP = findByProps("del", "put", "post");

let unpatch: () => void;

export default {
    onLoad: () => {
        logger.log("SilentLeave: Plugin loaded and watching for group exits.");
        
        unpatch = instead("del", HTTP, (args, orig) => {
            const request = args[0];
            let url = typeof request === "string" ? request : request?.url;

            if (typeof url === "string" && url.includes("/channels/")) {
                logger.log(`SilentLeave: Intercepted DELETE -> ${url}`);
                
                if (!url.includes("silent=true")) {
                    const separator = url.includes("?") ? "&" : "?";
                    const newUrl = `${url}${separator}silent=true`;

                    logger.log(`SilentLeave: Modifying URL to -> ${newUrl}`);

                    if (typeof request === "string") {
                        args[0] = newUrl;
                    } else if (request?.url) {
                        request.url = newUrl;
                    }
                }
            }
            return orig(...args);
        });
    },
    onUnload: () => {
        logger.log("SilentLeave: Unloaded. Group exits will no longer be silent.");
        if (unpatch) unpatch();
    },
    settings: Settings,
}
