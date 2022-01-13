import { https, logger } from "firebase-functions/v1";
import { getDisaportaldata } from "./lib/address_hazard";

exports.disaportaldata = https.onRequest((req, res) => {
  const address: string = req.query.address as string;
  if (!address) {
    res.status(400).send("Address is required");
    return;
  }
  logger.info(`address: ${address}`);
  getDisaportaldata(address)
    .then((data) => {
      logger.info("getDisaportaldata success", data);
      res.status(200).send(data);
    })
    .catch((err) => {
      logger.error("getDisaportaldata error", err);
      res.status(500).send(err);
    });
});
