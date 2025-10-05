import "dotenv/config";
import { Client, Context, StorageLocalStorage } from "@mtkruto/node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { extractVlessUris, keepTryingAsync } from "./utils/utils";
import { send_config, sendChatHistoryConfigs } from "./lib/sendConfigs";
const readline = createInterface({ input, output });
const prompt = (q): Promise<string> =>
  new Promise((r) => readline.question(q + " ", r));

if (!process.env.APP_API_ID) throw new Error("APP_API_ID not specified");
if (!process.env.APP_API_HASH) throw new Error("APP_API_HASH not specified");
const APP_API_ID = +process.env.APP_API_ID;
const APP_API_HASH = process.env.APP_API_HASH;
const ONLY_AUTH = process.env.ONLY_AUTH && process.env.ONLY_AUTH == "true";

async function main() {
  const client = new Client({
    storage: new StorageLocalStorage("my_client"),
    apiId: APP_API_ID,
    apiHash: APP_API_HASH,
  });

  await client.start({
    phone: () => prompt("Enter your telegram phone number:"),
    code: () => prompt("Enter the code you received:"),
    password: () => prompt("Enter your account's password:"),
  });
  console.log("finished authentication");

  if (ONLY_AUTH) process.exit(0);

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

async function handleUpdates(client: Client<Context>) {
  client.on("message:text", (ctx) => {
    if (!ctx.message.out) {
      const vless_uris = extractVlessUris(ctx.message.text);
      vless_uris.forEach((uri) => send_config(uri));
      console.log("new message vless_uris:", vless_uris.length);
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

main();
