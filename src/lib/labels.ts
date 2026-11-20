/**
 * Vietnamese display names for variant colours. Variant data from the API keeps
 * its own value (used to match variants); only what the shopper reads changes.
 */
const COLORS: Record<string, string> = {
  black: "Đen",
  white: "Trắng",
  "off white": "Trắng ngà",
  ivory: "Trắng ngà",
  cream: "Kem",
  beige: "Be",
  sand: "Cát",
  brown: "Nâu",
  tan: "Nâu da bò",
  camel: "Nâu lạc đà",
  chocolate: "Nâu sô cô la",
  grey: "Xám",
  gray: "Xám",
  charcoal: "Xám than",
  "light grey": "Xám nhạt",
  "light gray": "Xám nhạt",
  navy: "Xanh navy",
  blue: "Xanh dương",
  "light blue": "Xanh nhạt",
  denim: "Xanh denim",
  green: "Xanh lá",
  olive: "Xanh rêu",
  khaki: "Kaki",
  mint: "Xanh bạc hà",
  red: "Đỏ",
  burgundy: "Đỏ đô",
  wine: "Đỏ rượu vang",
  pink: "Hồng",
  "dusty pink": "Hồng đất",
  orange: "Cam",
  yellow: "Vàng",
  mustard: "Vàng nghệ",
  gold: "Vàng đồng",
  silver: "Bạc",
  purple: "Tím",
  multicolor: "Nhiều màu",
};

export function colorLabel(value: string) {
  return COLORS[value.trim().toLowerCase()] ?? value;
}
