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
exports.disaportaldataTask = https.onRequest(async (req, res) => {
  const address: string = req.query.address as string;
  if (!address) {
    res.status(400).send("Address is required");
    return;
  }
  logger.info(`address: ${address}`);

  // すでに同じ住所のデータがあるかどうか確認。検索済みの住所なら、処理をしたくないので、キャッシュとして返す。
  const cachedData = await db
    .collection("disaportaldata")
    .where("originalAddress", "==", address)
    .get();
  if (!cachedData.empty) {
    const cache = cachedData.docs[0];
    logger.info(`cache hit: ${cache.id}`);
    res.status(200).send(cache.id);
    return;
  }

  const pubSubClient = new PubSub();

  // firestoreに正規化前の住所を保存し、IDをPub/Subに通知
  // Pub/SubにIdが通知されると、getDisaportaldataでハザードマップポータルの情報を取得する

  const doc = await db
    .collection("disaportaldata")
    .add({ originalAddress: address });
  const data = Buffer.from(JSON.stringify({ id: doc.id, address: address }));
  try {
    const messageId = await pubSubClient
      .topic("disaportaldata")
      .publishMessage({ data });
    logger.info(`Message ${messageId} published.`);
    res.status(200).send(doc.id);
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
  }
});

// Pub/Subが通知したid内のデータからハザードマップポータルのデータを取得し、
// firestoreを更新する
exports.getDisaportaldata = pubsub
  .topic("disaportaldata")
  .onPublish(async (message) => {
    const id: string = message.json.id;
    const address: string = message.json.address as string;

    try {
      const disaportaldata = await getDisaportaldata(address);
      logger.info("getDisaportaldata success", disaportaldata);
      const data = { ...disaportaldata, originalAddress: address };
      await db.collection("disaportaldata").doc(id).set(data);
      return disaportaldata;
    } catch (error) {
      logger.error("getDisaportaldata error", error);
      await db
        .collection("disaportaldata")
        .doc(id)
        .set({ originalAddress: address, error: true });
      return error;
    }
  });

exports.disaportaldata = https.onRequest(async (req, res) => {
  const id: string = req.query.id as string;
  if (!id) {
    res.status(400).send("Id is required");
    return;
  }
  const data = await db.collection("disaportaldata").doc(id).get();
  if (!data.exists) {
    res.status(404).send("Data not found");
    return;
  } else {
    res.status(200).send(data.data());
    return;
  }
});