import { normalize } from "@geolonia/normalize-japanese-addresses";

/**
 * ハザードマップポータルサイトが配信するデータ
 */
export interface Disaportaldata {
  /** 正規化した結果得られた住所 */
  address: string;
  /** 洪水浸水想定地域 */
  flood: string;
  /** 高潮浸水想定地域 */
  takashio: string;
  /** 津波浸水想定地域 */
  tsunami: string;
  /** 土砂災害警戒区域（土石流） */
  dosekiryukeikai: string;
  /** 土砂災害警戒区域（急傾斜地の崩壊） */
  kyukeishakeikai: string;
  /** 土砂災害警戒区域（地すべり） */
  jisuberikeikai: string;
  /** 土石流危険渓流 */
  dosekiryukiken: string;
  /** 急傾斜地崩壊危険箇所 */
  kyukeisyachihoukai: string;
  /** 地すべり危険箇所 */
  jisuberikiken: string;
  /** 雪崩危険箇所 */
  nadarekiken: string;
  /** ハザードマップポータルサイト */
  disaportal: string;
}

const defaultZoomLevel = 17;

export async function getDisaportaldata(
  address: string,
  zoomLevel: number = defaultZoomLevel
): Promise<Disaportaldata> {
  const normalizedAddress = await normalize(address);
  switch (normalizedAddress.level) {
    case 0:
      throw new Error("住所が正しくありません");
    case 1:
    case 2:
      throw new Error("住所が曖昧です。町丁目まで入力してください");
    default:
      break;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lng = normalizedAddress.lng!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lat = normalizedAddress.lat!;

  const x = calculateLongitudeToPixelPoint(lng, zoomLevel);
  const y = calculateLatitudeToPixelPoint(lat, zoomLevel);

  return {
    address: `${normalizedAddress.pref}${normalizedAddress.city}${normalizedAddress.town}${normalizedAddress.addr}`,
    flood: `https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/${zoomLevel}/${x}/${y}.png`,
    takashio: `https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/${zoomLevel}/${x}/${y}.png`,
    tsunami: `https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/${zoomLevel}/${x}/${y}.png`,
    dosekiryukeikai: `https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/${zoomLevel}/${x}/${y}.png`,
    kyukeishakeikai: `https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/${zoomLevel}/${x}/${y}.png`,
    jisuberikeikai: `https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/${zoomLevel}/${x}/${y}.png`,
    dosekiryukiken: `https://disaportaldata.gsi.go.jp/raster/05_dosekiryukikenkeiryu/${zoomLevel}/${x}/${y}.png`,
    kyukeisyachihoukai: `https://disaportaldata.gsi.go.jp/raster/05_kyukeisyachihoukai/${zoomLevel}/${x}/${y}.png`,
    jisuberikiken: `https://disaportaldata.gsi.go.jp/raster/05_jisuberikikenkasyo/${zoomLevel}/${x}/${y}.png`,
    nadarekiken: `https://disaportaldata.gsi.go.jp/raster/05_nadarekikenkasyo/${zoomLevel}/${x}/${y}.png`,
    disaportal: `https://disaportal.gsi.go.jp/maps/index.html?ll=${lat},${lng}&z=${zoomLevel}&base=pale&ls=seamless%7Ctameike_raster%2C0.8%7Cflood_l2_kaokutoukai_kagan%2C0.8%7Cflood_l2_kaokutoukai_hanran%2C0.8%7Cflood_l2_keizoku%2C0.8%7Cflood_list%2C0.8%7Cflood_l1%2C0.8%7Cflood_list_l2%2C0.75%7Cdosha_kiken_nadare%2C0.8%7Cdosha_kiken_jisuberi%2C0.8%7Cdosha_kiken_kyukeisha%2C0.8%7Cdosha_kiken_dosekiryu%2C0.8%7Cdosha_keikai_jisuberi%2C0.8%7Cdosha_keikai_dosekiryu%2C0.8%7Cdosha_keikai_kyukeisha%2C0.8%7Cdisaster1%7Cdisaster2&disp=01000001111111100&vs=c1j0l0u0t0h0z0`,
  };
}

/**
 * 経度をピクセル座標系に変換する
 * @param 経度
 * @param zoomLevel ズームレベル
 *
 * @see http://hosohashi.blog59.fc2.com/blog-entry-5.html
 * @see https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
 */
function calculateLongitudeToPixelPoint(
  lng: number,
  zoomLevel: number
): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, zoomLevel));
}

/**
 * 緯度をピクセル座標系に変換する
 * @param lat 緯度
 * @param zoomLevel ズームレベル
 *
 * @see http://hosohashi.blog59.fc2.com/blog-entry-5.html
 * @see https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
 */
function calculateLatitudeToPixelPoint(lat: number, zoomLevel: number): number {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoomLevel)
  );
}
