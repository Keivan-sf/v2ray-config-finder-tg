import "dotenv/config";
import {
  Client,
  Context,
  StorageLocalStorage,
  MessageText,
  ChatGroup,
  ChatChannel,
  ChatPSupergroup,
  ChatPChannel,
  ChatPGroup,
} from "@mtkruto/node";
import axios from "axios";
const config_tester_url = "http://127.0.0.1:5574/add-config";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { keepTryingAsync } from "./utils";
const readline = createInterface({ input, output });
const prompt = (q): Promise<string> =>
  new Promise((r) => readline.question(q + " ", r));

if (!process.env.APP_API_ID) throw new Error("APP_API_ID not specified");
if (!process.env.APP_API_HASH) throw new Error("APP_API_HASH not specified");
const APP_API_ID = +process.env.APP_API_ID;
const APP_API_HASH = process.env.APP_API_HASH;

async function main() {
  const client = new Client({
    storage: new StorageLocalStorage("my_client"),
    apiId: APP_API_ID,
    apiHash: APP_API_HASH,
  });
  console.log("client constructed");

  console.log("going for auth");
  await client.start({
    phone: () => prompt("Enter your phone number:"),
    code: () => prompt("Enter the code you received:"),
    password: () => prompt("Enter your account's password:"),
  });
  console.log("finished authentication");

  console.log("handling updates");
  handleUpdates(client);
  getLastMessages(client);
  handleConnectionChange(client);
}

async function handleConnectionChange(client: Client<Context>) {
  client.on("connectionState", ({ connectionState }) => {
    console.log("New connection state:", connectionState);
  });
}

async function getLastMessages(client: Client<Context>) {
  const chats = await keepTryingAsync(() =>
    client.getChats({ from: "archived" }),
  );
  await sleep(1000);
  for (const chat of chats) {
    if (
      chat.chat.type !== "channel" &&
      chat.chat.type !== "supergroup" &&
      chat.chat.type !== "group"
    ) {
      continue;
    }
    sendChatHistoryConfigs(client, chat.chat);
    await sleep(1000);
  }
}

function send_config(config_uri: string) {
  // console.log("sending config", config_uri);
  axios.post(config_tester_url, { config: config_uri }).catch((err) => {
    console.log("[warning] failed to send config to config tester", err);
  });
}

async function handleUpdates(client: Client<Context>) {
  client.on("message:text", (ctx) => {
    if (!ctx.message.out) {
      const vless_uris = extractVlessUris(ctx.message.text);
      vless_uris.forEach((uri) => send_config(uri));
    }
  });
  client.on("newChat", async (ctx) => {
    if (
      ctx.newChat.chat.type !== "channel" &&
      ctx.newChat.chat.type !== "supergroup" &&
      ctx.newChat.chat.type !== "group"
    ) {
      return;
    }

    const chat = ctx.newChat.chat;
    sendChatHistoryConfigs(client, chat);
  });
}

async function sendChatHistoryConfigs(
  client: Client<Context>,
  chat: ChatPGroup | ChatPChannel | ChatPSupergroup,
) {
  const messages = await keepTryingAsync(() =>
    client.getHistory(chat.id, { limit: 50 }),
  );
  const text_messages: MessageText[] = messages.filter(
    (m: any) => !!m.text,
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

const extractVlessUris = (text: string): string[] => {
  const regex = /vless:\/\/[^\s"'<>]+/g;
  const matches = text.match(regex);
  return matches ?? [];
};

main();
