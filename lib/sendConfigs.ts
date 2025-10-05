import {
  ChatPChannel,
  ChatPGroup,
  ChatPSupergroup,
  Client,
  Context,
  MessageText,
} from "@mtkruto/node";
import axios from "axios";
import { extractVlessUris, keepTryingAsync } from "../utils/utils";

const CONFIG_TESTER_URL =
  process.env.CONFIG_TESTER_URL ?? "http://127.0.0.1:5574/add-config";
const CHAT_HISTORY_LIMIT = process.env.CHAT_HISTORY_LIMIT
  ? +process.env.CHAT_HISTORY_LIMIT
  : 50;

export async function sendChatHistoryConfigs(
  client: Client<Context>,
  chat: ChatPGroup | ChatPChannel | ChatPSupergroup,
) {
  const messages = await keepTryingAsync(() =>
    client.getHistory(chat.id, { limit: CHAT_HISTORY_LIMIT }),
  );
  const text_messages: MessageText[] = messages.filter(
    (m) => !!(m as any).text && !m.out,
  ) as MessageText[];
  const vless_uris: string[] = [];
  text_messages.forEach((tm) => vless_uris.push(...extractVlessUris(tm.text)));
  console.log(
    "got text messages:",
    text_messages.length,
    "vless_uris:",
    vless_uris.length,
  );
  vless_uris.forEach((uri) => send_config(uri));
}

export function send_config(config_uri: string) {
  // console.log("sending config", config_uri);
  axios.post(CONFIG_TESTER_URL, { config: config_uri }).catch((err) => {
    console.log("[warning] failed to send config to config tester", err);
  });
}
