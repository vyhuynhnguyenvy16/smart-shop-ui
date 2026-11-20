/**
 * Bộ nội dung sản phẩm tiếng Việt + ảnh sản phẩm (40 mẫu) cho Northline.
 *
 * Ảnh nằm trong /public/products/<slug>.webp (cắt 3:4, WebP).
 * Nguồn ảnh:
 *  - 28 ảnh chụp studio từ bộ "Shrine" của Material Design (Google), giấy phép
 *    Apache-2.0 — gói shrine_images (github.com/Erick121599/shrine_images, bản sao
 *    của gói flutter shrine_images).
 *  - 12 ảnh editorial có sẵn trong repo dự án (src/assets) cho các nhóm không có
 *    ảnh studio được cấp phép: áo khoác dáng dài, blazer, cardigan, quần jean,
 *    đầm hai dây, giày và túi tote.
 *
 * Chất liệu và giá là gợi ý dựa trên ảnh — chủ shop cần kiểm tra với hàng thật
 * trước khi áp dụng (trang Quản trị → Sản phẩm → "Áp dụng ảnh & mô tả tiếng Việt").
 */
export type SeedProduct = {
  slug: string;
  name: string;
  category: "Áo Quần" | "Áo Khoác" | "Quần Jean" | "Váy Đầm" | "Giày Dép" | "Túi Xách" | "Phụ Kiện";
  price: number;
  description: string;
  source: "shrine-apache-2.0" | "project-asset";
};

export const seedImagePath = (slug: string) => `/products/${slug}.webp`;

export const CATALOG_SEED: SeedProduct[] = [
  // ── Áo Quần ────────────────────────────────────────────────────────────
  {
    slug: "so-mi-trang-co-dien",
    name: "Sơ mi trắng cổ đức",
    category: "Áo Quần",
    price: 590000,
    description:
      "Sơ mi trắng cổ đức phom suông vừa, mặc đi làm hay đi chơi đều hợp. Vải cotton dệt chéo, đứng dáng mà vẫn mềm khi mặc cả ngày. Giặt máy nước lạnh, ủi ở nhiệt độ trung bình.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "so-mi-ke-soc-trang",
    name: "Sơ mi kẻ sọc mảnh",
    category: "Áo Quần",
    price: 620000,
    description:
      "Sơ mi nam kẻ sọc mảnh trên nền trắng, cổ bẻ và tay dài cài khuy. Đóng thùng với quần tây hoặc mặc ngoài với quần jean đều gọn. Giặt máy nước lạnh, phơi trên móc.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "so-mi-chambray-nam",
    name: "Sơ mi chambray nam",
    category: "Áo Quần",
    price: 650000,
    description:
      "Sơ mi chambray xanh nhạt, mặt vải giống denim nhưng mỏng và thoáng hơn. Có thể mặc như áo khoác nhẹ bên ngoài áo thun. Màu vải dịu dần đều sau mỗi lần giặt.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "so-mi-chambray-nu",
    name: "Sơ mi chambray nữ dáng rộng",
    category: "Áo Quần",
    price: 650000,
    description:
      "Sơ mi chambray dáng rộng, xắn tay hoặc mặc khoác ngoài đều đẹp. Phối cùng áo thun trắng và quần sáng màu cho ngày cuối tuần. Giặt máy nước lạnh với đồ cùng màu.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-thun-plaster",
    name: "Áo thun cotton màu kem",
    category: "Áo Quần",
    price: 290000,
    description:
      "Áo thun cổ tròn màu kem, vải cotton dày vừa, không bai cổ sau nhiều lần giặt. Phom suông nhẹ, mặc riêng hoặc làm lớp trong đều được.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-thun-surf",
    name: "Áo thun xanh nhạt",
    category: "Áo Quần",
    price: 290000,
    description:
      "Áo thun xanh nhạt cổ tròn, tay ngắn vừa vai. Màu sáng dễ phối với quần tối màu, hợp thời tiết nóng. Giặt máy, lộn trái để giữ màu.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-henley-walter",
    name: "Áo henley tay dài",
    category: "Áo Quần",
    price: 390000,
    description:
      "Áo henley trắng tay dài với hàng khuy ngắn ở cổ, vải thun gân co giãn nhẹ. Mặc riêng hay lót trong sơ mi, áo khoác đều gọn gàng.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-thun-ke-soc",
    name: "Áo thun kẻ sọc tay dài",
    category: "Áo Quần",
    price: 350000,
    description:
      "Áo thun sọc ngang đen trắng tay dài, kiểu áo thủy thủ cổ điển. Phối với quần jean và giày bệt cho ngày thường. Giặt máy nước lạnh.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-thun-cerise",
    name: "Áo thun gân hồng đất",
    category: "Áo Quần",
    price: 320000,
    description:
      "Áo thun gân ôm nhẹ màu hồng đất, cổ tròn, tay ngắn. Đóng thùng với quần jean lưng cao rất vừa vặn. Giặt tay hoặc giặt máy chế độ nhẹ.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-thun-xan-tay",
    name: "Áo thun xắn tay màu nghệ",
    category: "Áo Quần",
    price: 320000,
    description:
      "Áo thun màu nghệ ấm với tay xắn sẵn, phom rộng vừa. Một điểm màu dễ mặc cho tủ đồ trung tính.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-ba-lo-xam",
    name: "Áo ba lỗ xám dáng rộng",
    category: "Áo Quần",
    price: 250000,
    description:
      "Áo ba lỗ xám melange dáng rộng, vải mỏng thoáng cho ngày nóng. Mặc riêng hoặc lót trong sơ mi mở cúc.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-dap-cheo-ramona",
    name: "Áo đắp chéo thắt eo",
    category: "Áo Quần",
    price: 590000,
    description:
      "Áo đắp chéo tay dài màu xanh denim, dây buộc bên hông để chỉnh độ ôm eo. Mặc đi làm cùng quần tây hoặc quần jean đều thanh lịch.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-len-sea",
    name: "Áo len mỏng xanh sương",
    category: "Áo Quần",
    price: 690000,
    description:
      "Áo len cổ tròn dệt mỏng màu xanh sương, đủ ấm cho phòng máy lạnh hay sáng sớm se lạnh. Giặt tay nước lạnh, phơi phẳng để giữ dáng.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-ni-seabreeze",
    name: "Áo nỉ xanh bạc hà",
    category: "Áo Quần",
    price: 590000,
    description:
      "Áo nỉ cổ tròn màu xanh bạc hà, mặt trong bông mềm. Phom suông thoải mái, phối quần tối màu cho tổng thể nhẹ nhàng.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "bo-ni-clay",
    name: "Bộ nỉ hồng đất",
    category: "Áo Quần",
    price: 990000,
    description:
      "Bộ áo nỉ và quần jogger màu hồng đất, mặc ở nhà hay ra ngoài gần đều tiện. Áo và quần có thể phối riêng với đồ trơn màu.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "quan-tay-navy",
    name: "Quần tây xanh navy ống lửng",
    category: "Áo Quần",
    price: 690000,
    description:
      "Quần tây xanh navy ống suông, dài tới mắt cá, lưng có đỉa luồn thắt lưng. Phối sơ mi trắng và giày da cho vẻ gọn gàng.",
    source: "shrine-apache-2.0",
  },

  // ── Áo Khoác ───────────────────────────────────────────────────────────
  {
    slug: "ao-khoac-gentry",
    name: "Áo khoác field xanh rêu",
    category: "Áo Khoác",
    price: 1490000,
    description:
      "Áo khoác field xanh rêu với bốn túi hộp phía trước, vải kaki dày dặn. Lớp áo khoác ngoài bền bỉ cho mùa se lạnh, mặc nhiều năm vẫn đẹp.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "ao-khoac-kaki-olive",
    name: "Áo khoác kaki olive nữ",
    category: "Áo Khoác",
    price: 1290000,
    description:
      "Áo khoác kaki màu olive dáng suông, túi ngực có nắp. Khoác ngoài áo thun trắng và quần jean cho tổng thể năng động.",
    source: "project-asset",
  },
  {
    slug: "mang-to-dang-dai",
    name: "Măng tô đen dáng dài",
    category: "Áo Khoác",
    price: 2490000,
    description:
      "Măng tô đen dài qua gối, phom thẳng, cổ ve cổ điển. Phủ ngoài trang phục công sở trong những ngày lạnh mà vẫn gọn gàng.",
    source: "project-asset",
  },
  {
    slug: "blazer-xam-oversize",
    name: "Blazer xám dáng rộng",
    category: "Áo Khoác",
    price: 1690000,
    description:
      "Blazer xám than dáng rộng, vai mềm, một hàng khuy. Mặc cùng quần ống suông cùng tông hoặc khoác ngoài áo thun trơn.",
    source: "project-asset",
  },
  {
    slug: "cardigan-kem",
    name: "Cardigan len màu kem",
    category: "Áo Khoác",
    price: 790000,
    description:
      "Cardigan len cổ tim màu kem, cài khuy đen tương phản. Một lớp khoác nhẹ cho văn phòng có máy lạnh hoặc buổi tối se lạnh.",
    source: "project-asset",
  },

  // ── Quần Jean ──────────────────────────────────────────────────────────
  {
    slug: "quan-jean-ong-dung",
    name: "Quần jean ống đứng xanh đậm",
    category: "Quần Jean",
    price: 790000,
    description:
      "Quần jean ống đứng màu xanh đậm, lưng vừa, dài chạm mắt cá. Denim dày vừa phải, phối với áo thun trắng và giày da là đủ đẹp. Giặt lộn trái, nước lạnh.",
    source: "project-asset",
  },

  // ── Váy Đầm ────────────────────────────────────────────────────────────
  {
    slug: "dam-suong-sunshirt",
    name: "Đầm suông trắng tay ngắn",
    category: "Váy Đầm",
    price: 690000,
    description:
      "Đầm suông trắng dáng chữ A ngắn trên gối, tay ngắn, cổ tròn. Mặc cùng giày bệt cho ngày hè nhẹ nhàng.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "dam-hai-day-den",
    name: "Đầm hai dây đen dáng dài",
    category: "Váy Đầm",
    price: 890000,
    description:
      "Đầm hai dây đen dài tới bắp chân, dáng suông rủ. Đi tiệc với sandal cao gót hoặc khoác blazer cho buổi tối.",
    source: "project-asset",
  },

  // ── Giày Dép ───────────────────────────────────────────────────────────
  {
    slug: "giay-sneaker-da-xam",
    name: "Giày sneaker da trắng phối xám",
    category: "Giày Dép",
    price: 1290000,
    description:
      "Sneaker cổ thấp da trắng phối da lộn xám, đế cao su bám tốt. Kiểu dáng tối giản, đi cùng quần tây hay quần jean đều hợp.",
    source: "project-asset",
  },
  {
    slug: "giay-loafer-da-den",
    name: "Giày loafer da đen",
    category: "Giày Dép",
    price: 1490000,
    description:
      "Giày loafer da đen bóng nhẹ, mũi tròn, xỏ chân tiện lợi. Hợp với quần tây cho đi làm hay sự kiện.",
    source: "project-asset",
  },
  {
    slug: "boot-co-ngan-da",
    name: "Boot da cổ ngắn",
    category: "Giày Dép",
    price: 1890000,
    description:
      "Boot da nâu sẫm cổ ngắn, gót vuông vừa phải, đi lại cả ngày không mỏi. Phối với quần ống suông hoặc đầm dài.",
    source: "project-asset",
  },
  {
    slug: "sandal-quai-manh",
    name: "Sandal quai mảnh gót nhọn",
    category: "Giày Dép",
    price: 990000,
    description:
      "Sandal da đen quai mảnh, quai cài cổ chân, gót nhọn vừa. Đôi giày cho buổi tối, đi cùng đầm hoặc quần ống rộng.",
    source: "project-asset",
  },

  // ── Túi Xách ───────────────────────────────────────────────────────────
  {
    slug: "balo-da-vagabond",
    name: "Balo da xanh than",
    category: "Túi Xách",
    price: 1590000,
    description:
      "Balo da xanh than với hai túi trước có nắp, quai xách da nâu. Vừa laptop 13 inch và đồ dùng hằng ngày.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "tui-hobo-da-shrug",
    name: "Túi hobo da xanh navy",
    category: "Túi Xách",
    price: 1290000,
    description:
      "Túi hobo da mềm màu xanh navy, quai đeo vai, lòng túi rộng. Đựng vừa ví, sổ tay và áo khoác mỏng.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "tui-tote-da-nau",
    name: "Túi tote da nâu",
    category: "Túi Xách",
    price: 1790000,
    description:
      "Túi tote da nâu sô cô la khổ lớn, quai đeo vai dài. Chiếc túi đi làm đựng vừa laptop, tài liệu và đồ cá nhân.",
    source: "project-asset",
  },
  {
    slug: "tui-tote-den",
    name: "Túi tote da đen tối giản",
    category: "Túi Xách",
    price: 1690000,
    description:
      "Túi tote da đen phom đứng, đường may gọn, không logo. Dễ phối với trang phục công sở lẫn thường ngày.",
    source: "project-asset",
  },

  // ── Phụ Kiện ───────────────────────────────────────────────────────────
  {
    slug: "kinh-mat-stella",
    name: "Kính mát gọng trong màu mật ong",
    category: "Phụ Kiện",
    price: 590000,
    description:
      "Kính mát gọng nhựa trong màu mật ong, tròng nâu dịu mắt. Dáng gọng tròn vừa, hợp nhiều khuôn mặt.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "that-lung-da-whitney",
    name: "Thắt lưng da bò nâu",
    category: "Phụ Kiện",
    price: 490000,
    description:
      "Thắt lưng da bò nâu bản rộng, khóa kim loại màu đồng. Đeo với quần jean hay quần tây, da lên màu đẹp theo thời gian.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "day-chuyen-garden",
    name: "Dây chuyền hạt hai tầng",
    category: "Phụ Kiện",
    price: 390000,
    description:
      "Dây chuyền dài hai tầng xâu hạt nhỏ màu vàng và trắng ngà. Đeo cùng áo trơn cổ tròn để làm điểm nhấn nhẹ.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "khuyen-tai-strut",
    name: "Khuyên tai kim loại hình học",
    category: "Phụ Kiện",
    price: 350000,
    description:
      "Khuyên tai thả dáng hình học bằng kim loại màu vàng đồng. Nổi bật mà vẫn nhẹ tai, hợp với tóc búi gọn.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "tat-co-cao-varsity",
    name: "Tất cổ cao kẻ sọc (2 đôi)",
    category: "Phụ Kiện",
    price: 150000,
    description:
      "Set 2 đôi tất cotton cổ cao màu trắng, viền sọc xanh navy. Mềm, thấm hút tốt, đi cùng sneaker hằng ngày.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "moc-khoa-dan-weave",
    name: "Móc khóa da đan",
    category: "Phụ Kiện",
    price: 190000,
    description:
      "Móc khóa dây da đan màu xanh navy với vòng kim loại chắc chắn. Món quà nhỏ gọn, dễ tặng.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "mu-coi-gatsby",
    name: "Mũ cói vành rộng",
    category: "Phụ Kiện",
    price: 450000,
    description:
      "Mũ cói đan màu be, băng vải xám quanh thân mũ, vành rộng vừa che nắng. Hợp cho đi biển và dạo phố ngày hè.",
    source: "shrine-apache-2.0",
  },
  {
    slug: "khan-choang-ginger",
    name: "Khăn choàng kẻ caro",
    category: "Phụ Kiện",
    price: 490000,
    description:
      "Khăn choàng dệt kẻ caro tông xám và cam gừng, khổ dài quấn được nhiều vòng. Ấm cổ trong những ngày gió lạnh.",
    source: "shrine-apache-2.0",
  },
];
