import { getDisaportaldata } from "./lib/address_hazard";

function showHelp() {
  console.log(`
名前:
address_hazard

書式:
address_hazard [住所]

説明:
指定された住所に対応するハザードマップポータルサイトのデータを表示します。
`);
}

if (process.argv.length < 3) {
  showHelp();
} else {
  const address: string = process.argv[2];
  getDisaportaldata(address)
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.error(err);
    });
}
