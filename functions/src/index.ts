import { https, pubsub, logger } from "firebase-functions/v1";
import { getDisaportaldata } from "./lib/address_hazard";
import { PubSub } from "@google-cloud/pubsub";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

/**
 * ハザードマップポータルサイトから情報を取得するエンドポイント。クライアントからHTTPリクエストを受け取る。
 * 住所正規化のアクセス集中を防ぐため、
 * 1. リクエストされた住所をCloud Firestoreに格納
 * 2. Pub/Sub にCloud FirestoreのIDを通知
 * 3. Pub/Sub をトリガーにポータルサイトへアクセス
 * 4. 結果をFirestoreに格納
 * @param {string} address ハザードマップ情報を取得したい住所
 * @returns Firestoreのキー。クライアントはこのキーのデータを参照する
 */
exports.disaportaldata = https.onRequest(async (req, res) => {
  const address: string = req.query.address as string;
  if (!address) {
    res.status(400).send("Address is required");
    return;
  }
  logger.info(`address: ${address}`);
  // firestoreのキーにはbase64エンコードした住所を使用して、正規化前の住所を利用する
  // クライアントサイドでも同じキーを使用してデータの参照ができるようにしたい
  const firestoreId = Buffer.from(address).toString("base64");

  // すでに同じ住所のデータがあるかどうか確認。検索済みの住所なら、処理をしたくないので、キャッシュとして返す。
  const cachedData = await db.collection("disaportaldata").doc(firestoreId).get();
  if (cachedData.exists) {
    logger.info(`cache hit: ${firestoreId}`);
    res.status(200).send(firestoreId);
    return;
  }

  const pubSubClient = new PubSub();
  
  const data = Buffer.from(JSON.stringify({ address }));
  try {
    const messageId = await pubSubClient.topic("disaportaldata").publishMessage({data});
    logger.info(`Message ${messageId} published.`);
    res.status(200).send(firestoreId);
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
  }
});

exports.getDisaportaldata = pubsub.topic("disaportaldata").onPublish(async (message) => {
  const address: string = message.json.address as string;
  const id = Buffer.from(address).toString("base64");
  try {
    const disaportaldata = await getDisaportaldata(address);
    logger.info("getDisaportaldata success", disaportaldata);
    await db.collection("disaportaldata").doc(id).set(disaportaldata);
    return disaportaldata;
  } catch (error) {
    logger.error("getDisaportaldata error", error);
    await db.collection("disaportaldata").doc(id).set({ address, error: true });
    return error;    
  }

});