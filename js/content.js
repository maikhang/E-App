/* Nội dung dàn ý Task 1 – dạng MAPS.
 * Chép nguyên văn từ tài liệu của người dùng (bảng từ vựng A, B, cấu trúc viết,
 * bảng cấu trúc câu, lưu ý quan trọng, mẹo áp dụng). AI dùng các cụm trong file này
 * làm từ vựng ưu tiên (bắt buộc với dạng Maps); "Kho từ vựng" hiển thị toàn bộ. */
window.CONTENT = (function () {
  // A. Từ vựng miêu tả sự thay đổi (Dùng chủ yếu trong Body 2)
  const changeVocab = [
    { id: 'built', phrase: 'was built', meaning: 'Được xây dựng', usage: 'Miêu tả công trình mới được xây.', example: 'A school was built in the north.', note: 'Thường dùng trong Body 2 để chỉ công trình mới trên map 2.', sections: ['body2'] },
    { id: 'constructed', phrase: 'was constructed', meaning: 'Được xây dựng', usage: 'Tương tự “was built,” trang trọng hơn.', example: 'A shopping center was constructed in the center.', note: 'Có thể thay thế “was built” để đa dạng hóa.', sections: ['body2'] },
    { id: 'added', phrase: 'was added', meaning: 'Được bổ sung', usage: 'Chỉ việc thêm công trình mới.', example: 'A park was added to the east.', note: 'Nhẹ hơn “was built,” dùng khi công trình nhỏ hoặc bổ sung.', sections: ['body2'] },
    { id: 'demolished', phrase: 'was demolished', meaning: 'Bị phá bỏ', usage: 'Miêu tả công trình bị phá hủy.', example: 'The old houses were demolished.', note: 'Dùng trong Body 2 để chỉ công trình biến mất trên map 2.', sections: ['body2'] },
    { id: 'removed', phrase: 'was removed', meaning: 'Bị loại bỏ', usage: 'Tương tự “was demolished.”', example: 'The factory was removed.', note: 'Dùng khi công trình bị xóa bỏ hoàn toàn.', sections: ['body2'] },
    { id: 'replaced', phrase: 'was replaced by', meaning: 'Bị thay thế bằng', usage: 'Một công trình bị thay bằng công trình khác.', example: 'The park was replaced by a parking lot.', note: 'Dùng khi công trình cũ bị thay bằng công trình mới.', sections: ['body2'] },
    { id: 'converted', phrase: 'was converted into', meaning: 'Được chuyển đổi thành', usage: 'Công trình đổi mục đích sử dụng.', example: 'The factory was converted into a museum.', note: 'Dùng khi công trình giữ nguyên nhưng thay đổi chức năng.', sections: ['body2'] },
    { id: 'expanded', phrase: 'was expanded', meaning: 'Được mở rộng', usage: 'Công trình được tăng kích thước.', example: 'The road was expanded to the west.', note: 'Dùng khi công trình lớn hơn về diện tích.', sections: ['body2'] },
    { id: 'extended', phrase: 'was extended', meaning: 'Được kéo dài', usage: 'Công trình được kéo dài (thường là đường, sông).', example: 'The railway was extended to the south.', note: 'Thường dùng cho đường, cầu, hoặc tuyến giao thông.', sections: ['body2'] },
    { id: 'relocated', phrase: 'was relocated', meaning: 'Được di dời', usage: 'Công trình được chuyển vị trí.', example: 'The school was relocated to the south.', note: 'Dùng khi công trình chuyển sang nơi khác.', sections: ['body2'] },
    { id: 'unchanged', phrase: 'remained unchanged', meaning: 'Không thay đổi', usage: 'Công trình giữ nguyên.', example: 'The town hall remained unchanged.', note: 'Dùng khi công trình xuất hiện ở cả hai bản đồ, không đổi.', sections: ['body2', 'overview'] },
    { id: 'modernized', phrase: 'was modernized', meaning: 'Được hiện đại hóa', usage: 'Công trình được nâng cấp.', example: 'The library was modernized.', note: 'Dùng khi công trình được cải tạo về chất lượng.', sections: ['body2'] },
    { id: 'renovated', phrase: 'was renovated', meaning: 'Được cải tạo', usage: 'Tương tự “was modernized.”', example: 'The old building was renovated.', note: 'Dùng cho cải tạo, sửa chữa công trình.', sections: ['body2'] },
    { id: 'reduced', phrase: 'was reduced', meaning: 'Bị thu nhỏ', usage: 'Công trình giảm kích thước.', example: 'The forest was reduced in size.', note: 'Dùng khi diện tích công trình bị thu hẹp.', sections: ['body2'] },
    { id: 'experienced', phrase: 'experienced significant changes', meaning: 'Trải qua thay đổi lớn', usage: 'Miêu tả thay đổi tổng thể.', example: 'The town experienced significant changes.', note: 'Dùng trong Overview hoặc Body 2 để tóm tắt thay đổi.', sections: ['overview', 'body2'] },
    { id: 'underwent', phrase: 'underwent development', meaning: 'Được phát triển', usage: 'Miêu tả sự phát triển tổng thể.', example: 'The area underwent development with new facilities.', note: 'Dùng trong Overview hoặc Body 2, mang tính khái quát.', sections: ['overview', 'body2'] },
    { id: 'redeveloped', phrase: 'was redeveloped', meaning: 'Được tái phát triển', usage: 'Khu vực được xây dựng lại.', example: 'The northern area was redeveloped.', note: 'Bổ sung, dùng khi khu vực được cải tạo lớn.', sections: ['body2'] },
    { id: 'transformed', phrase: 'was transformed into', meaning: 'Được chuyển đổi thành', usage: 'Tương tự “was converted into.”', example: 'The farmland was transformed into a residential area.', note: 'Bổ sung, nhấn mạnh sự thay đổi lớn.', sections: ['body2'] },
    { id: 'addition', phrase: 'saw the addition of', meaning: 'Có thêm', usage: 'Chỉ sự bổ sung công trình mới.', example: 'The town saw the addition of a sports center.', note: 'Bổ sung, nhẹ hơn “was added.”', sections: ['overview', 'body2'] },
  ];

  // B. Từ vựng miêu tả vị trí (Dùng trong Body 1 và Body 2)
  const positionVocab = [
    { id: 'to_dir', phrase: 'to the north/south/east/west (of)', meaning: 'Về phía bắc/nam/đông/tây', usage: 'Chỉ hướng tương đối.', example: 'The park is to the north of the river.', note: 'Dùng khi mô tả vị trí so với điểm khác.' },
    { id: 'in_dir', phrase: 'in the north/south/east/west (of)', meaning: 'Ở khu vực bắc/nam/đông/tây', usage: 'Chỉ khu vực cụ thể.', example: 'The factory is in the east of the town.', note: 'Nhấn mạnh khu vực hơn là hướng.' },
    { id: 'center', phrase: 'in the center of', meaning: 'Ở trung tâm', usage: 'Chỉ vị trí trung tâm.', example: 'The town hall is in the center of the map.', note: 'Dùng cho vị trí trung tâm bản đồ.' },
    { id: 'middle', phrase: 'in the middle of', meaning: 'Ở giữa', usage: 'Tương tự “in the center of.”', example: 'A park is in the middle of the town.', note: 'Dùng thay thế “in the center of” để đa dạng.' },
    { id: 'central_part', phrase: 'in the central part of', meaning: 'Ở phần trung tâm', usage: 'Tương tự “in the center of,” trang trọng hơn.', example: 'The library is in the central part of the map.', note: 'Dùng trong văn phong học thuật.' },
    { id: 'next_to', phrase: 'next to', meaning: 'Bên cạnh', usage: 'Chỉ vị trí liền kề.', example: 'The school is next to the park.', note: 'Phổ biến, đơn giản.' },
    { id: 'adjacent_to', phrase: 'adjacent to', meaning: 'Kề bên', usage: 'Tương tự “next to,” trang trọng hơn.', example: 'The factory is adjacent to the river.', note: 'Dùng trong văn phong học thuật.' },
    { id: 'opposite', phrase: 'opposite', meaning: 'Đối diện', usage: 'Chỉ vị trí đối diện.', example: 'The shop is opposite the station.', note: 'Dùng khi hai công trình ở hai phía đối lập.' },
    { id: 'close_to', phrase: 'close to / near', meaning: 'Gần', usage: 'Chỉ vị trí gần nhau.', example: 'The houses are close to the river.', note: 'Phổ biến, có thể thay thế “adjacent to.”' },
    { id: 'surrounded_by', phrase: 'surrounded by', meaning: 'Được bao quanh bởi', usage: 'Chỉ công trình được bao quanh.', example: 'The park is surrounded by houses.', note: 'Dùng khi công trình có nhiều thứ bao quanh.' },
    { id: 'at_corner', phrase: 'at the corner of', meaning: 'Ở góc', usage: 'Chỉ vị trí tại giao điểm.', example: 'The shop is at the corner of the main road.', note: 'Dùng cho vị trí giao nhau (đường, khu vực).' },
    { id: 'along', phrase: 'along', meaning: 'Dọc theo', usage: 'Chỉ vị trí dọc theo tuyến.', example: 'Houses are built along the river.', note: 'Thường dùng cho đường, sông, hoặc tuyến dài.' },
    { id: 'lr_side', phrase: 'on the left/right side of the map', meaning: 'Ở phía trái/phải bản đồ', usage: 'Chỉ vị trí tổng quát.', example: 'The forest is on the right side of the map.', note: 'Dùng khi mô tả vị trí chung trên bản đồ.' },
    { id: 'top_bottom', phrase: 'at the top/bottom of the map', meaning: 'Ở phần trên/dưới bản đồ', usage: 'Chỉ vị trí ở đầu/đáy bản đồ.', example: 'The station is at the top of the map.', note: 'Dùng để định vị trên bản đồ.' },
    { id: 'corner', phrase: 'in the top-left/bottom-right corner', meaning: 'Ở góc trên-trái/dưới-phải', usage: 'Chỉ vị trí cụ thể ở góc.', example: 'The school is in the top-left corner.', note: 'Dùng khi công trình nằm ở góc bản đồ.' },
  ];

  // Các cấu trúc viết (dạng map)
  const writingStructures = [
    { group: 'Mô tả sự thay đổi lớn', items: ['has been replaced by', 'has been transformed into', 'has been converted into', 'has been expanded', 'was demolished to make way for'] },
    { group: 'Miêu tả sự xuất hiện hoặc biến mất', items: ['A new [building, road, etc.] has been built/constructed', 'The [structure] was removed/demolished', 'No significant changes occurred in...'] },
    { group: 'Từ chỉ vị trí (để mô tả chính xác vị trí trên bản đồ)', items: ['In the north/south/east/west', 'In the center of the map', 'Alongside the [river, road, etc.]', 'On the outskirts of [place]'] },
  ];

  // Bảng cấu trúc câu (sentence structures)
  const sentenceStructures = [
    { id: 'passive', name: 'Passive Voice', formula: 'S + was/were + V3', example: 'The tennis courts were replaced by a new gym.' },
    { id: 'there', name: 'There was/were', formula: 'There + was/were + N', example: 'There were two car parks on the campus in 1995.' },
    { id: 'time', name: 'Time Clause', formula: 'In + [Year], S + V', example: 'In 2005, the area was just a wasteland.' },
    { id: 'contrast', name: 'Contrast', formula: 'S + V..., while...', example: 'The library was small, while today it is much larger.' },
    { id: 'addition', name: 'Addition', formula: 'Moreover, S + V', example: 'Moreover, a new pond was dug in the garden.' },
  ];
  const formulaTip = { formula: 'Thời gian + Vật thể + Hành động + Vị trí', example: 'In 1995, a cafe was located next to the library.' };

  // Lưu ý quan trọng Task 1
  const rules = [
    { title: '1. Phân biệt "To the North" và "In the North"', points: [
      '<b>In the North of the city:</b> Cái đó nằm <b>trong</b> thành phố, ở khu vực phía Bắc.',
      '<b>To the North of the city:</b> Cái đó nằm <b>ngoài</b> thành phố, lệch về hướng Bắc.'] },
    { title: '2. Quy tắc dùng "Side"', points: ['Cứ có chữ <b>side</b> là dùng <b>On</b>.', '<i>Ví dụ:</i> <b>On</b> the northern <b>side</b> of the bridge.'] },
    { title: '3. Quy tắc dùng "Part"', points: ['Cứ có chữ <b>part</b> (phần) là dùng <b>In</b>.', '<i>Ví dụ:</i> <b>In</b> the eastern <b>part</b> of the village.'] },
  ];
  const prepGroups = [
    { group: 'Nhóm "IN"', use: 'Center, Middle, Corner, Part, Area.' },
    { group: 'Nhóm "AT"', use: 'Top, Bottom, Entrance, Intersection, Junction.' },
    { group: 'Nhóm "ON"', use: 'Side, Bank, Edge, Left/Right-hand side.' },
    { group: 'Nhóm "TO"', use: 'North/South/East/West of [Object].' },
  ];
  const paraphrasing = {
    intro: 'Thay vì chỉ dùng mãi một kiểu "The tree is to the left of the house", hãy đảo cấu trúc:',
    ways: [
      { name: 'Cách 1', text: 'The house is <b>located to the right of</b> the tree.' },
      { name: 'Cách 2', text: '<b>On the right-hand side of</b> the tree, a house can be seen.' },
      { name: 'Cách 3', text: 'The area <b>to the right of</b> the tree is occupied by a house.' },
    ],
  };

  // Mẹo áp dụng dàn ý và từ vựng
  const tips = [
    { title: 'Phân tích bản đồ', text: 'Dành 3 phút so sánh hai bản đồ:', sub: ['Map 1: Ghi chú vị trí các công trình (ví dụ: “park in the north, next to river”).', 'Map 2: Ghi chú thay đổi (xây mới, phá bỏ, mở rộng) và vị trí mới.'] },
    { title: 'Chọn lọc thông tin', text: 'Chỉ chọn 3-4 thay đổi chính và vị trí nổi bật để tránh bài viết quá dài.' },
    { title: 'Kết hợp từ vựng', text: 'Dùng từ vị trí (“in the north,” “adjacent to”) trong cả hai đoạn, và từ thay đổi (“was built,” “was demolished”) trong Body 2.' },
    { title: 'Đa dạng hóa', text: 'Xen kẽ “was built” với “was constructed,” “adjacent to” với “next to” để tránh lặp từ.' },
    { title: 'Thời gian', text: 'Dành 15 phút viết, 2 phút kiểm tra từ vựng và tính chính xác.' },
  ];

  // Bài mẫu có sẵn (đề minh hoạ tự soạn) để xem app hoạt động khi chưa chạy AI
  const demo = {
    task_type: 'maps',
    subject: 'the village of Stokeford in 1930 and 2010',
    topic_vi: 'Hai bản đồ làng Stokeford năm 1930 và 2010.',
    prompt_text: 'The maps below show the village of Stokeford in 1930 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    steps: [
      {
        title: 'Paraphrase đề: làng Stokeford, 1930 → 2010',
        guide_vi: 'Viết 1 câu: đổi “show” thành “illustrate/compare”, giữ đúng tên làng Stokeford và hai mốc 1930, 2010. Không chép nguyên câu đề.',
        vocab: [{ phrase: 'illustrate', meaning_vi: 'minh hoạ' }, { phrase: 'the changes that took place in', meaning_vi: 'những thay đổi diễn ra ở' }, { phrase: 'between 1930 and 2010', meaning_vi: 'trong giai đoạn 1930–2010' }, { phrase: 'the layout of', meaning_vi: 'cách bố trí của' }],
        options: [
          'The two maps illustrate the changes that took place in the village of Stokeford between 1930 and 2010.',
          'The maps compare the layout of the village of Stokeford in 1930 with its layout in 2010.',
          'The diagrams show how the village of Stokeford developed over the 80-year period from 1930 to 2010.',
        ],
      },
      {
        title: 'Overview: Stokeford chuyển từ làng nông nghiệp sang khu dân cư',
        guide_vi: 'Hai ý lớn: (1) đất nông nghiệp phía nam biến thành khu dân cư, có thêm công trình mới; (2) đường chính giữ nguyên. Không đưa vị trí chi tiết hay năm cụ thể vào câu thứ hai.',
        vocab: [{ phrase: 'experienced significant changes', meaning_vi: 'trải qua thay đổi lớn' }, { phrase: 'underwent development', meaning_vi: 'được phát triển' }, { phrase: 'remained unchanged', meaning_vi: 'không thay đổi' }, { phrase: 'residential', meaning_vi: 'thuộc khu dân cư' }],
        options: [
          'Overall, Stokeford experienced significant changes over the period, becoming far more residential as its farmland gave way to housing. However, the main road running through the village remained unchanged.',
          'Overall, the village underwent development with new facilities, the most noticeable being a large residential area and a retirement home. By contrast, the main road and the school site stayed in the same place.',
          'Overall, Stokeford was transformed from a small farming community into a much larger residential village, while its basic road layout remained unchanged.',
        ],
      },
      {
        title: 'Body 1: Làng Stokeford năm 1930 (Map 1)',
        guide_vi: 'Miêu tả vị trí các công trình chính trên bản đồ 1930: nhà dọc đường chính, trường ở trung tâm, bưu điện cạnh trường, đất nông nghiệp ở phía nam. Dùng công thức Thời gian + Vật thể + Hành động + Vị trí.',
        vocab: [{ phrase: 'was located', meaning_vi: 'nằm ở' }, { phrase: 'along the main road', meaning_vi: 'dọc đường chính' }, { phrase: 'in the center of', meaning_vi: 'ở trung tâm' }, { phrase: 'next to / adjacent to', meaning_vi: 'bên cạnh' }, { phrase: 'was occupied by', meaning_vi: 'được chiếm bởi' }],
        options: [
          'In 1930, Stokeford was a small farming village. Houses were located along the main road, and a school could be seen in the center of the village, next to the post office. The area in the south of the village was occupied by farmland, which stretched as far as the edge of the map.',
          'In 1930, there were only a few houses, all built along the main road. The village school stood in the middle of the village, with a post office adjacent to it, while the whole southern part of Stokeford was farmland. Apart from these buildings, the village had very few facilities.',
          'Looking at the first map, Stokeford in 1930 consisted mainly of houses along the main road. In the center of the village, a school could be seen next to the post office. Moreover, a large area of farmland was located in the south, covering almost half of the village.',
        ],
      },
      {
        title: 'Body 2: Những thay đổi đến năm 2010 (Map 2)',
        guide_vi: 'Chọn 3-4 thay đổi chính: đất nông nghiệp → khu dân cư, viện dưỡng lão mới ở phía bắc, trường mở rộng về phía tây, bưu điện → cửa hàng. Kết bằng điểm giữ nguyên (đường chính). Đa dạng hóa: was built / was constructed.',
        vocab: [{ phrase: 'was transformed into', meaning_vi: 'được chuyển đổi thành' }, { phrase: 'was built / was constructed', meaning_vi: 'được xây dựng' }, { phrase: 'was expanded', meaning_vi: 'được mở rộng' }, { phrase: 'was converted into', meaning_vi: 'được chuyển đổi thành' }, { phrase: 'to the west', meaning_vi: 'về phía tây' }],
        options: [
          'By 2010, the farmland in the south had been transformed into a residential area. A new retirement home was built in the north of the village, and the school was expanded to the west. Moreover, the post office was converted into a shop, while the main road remained unchanged. As a result, the village became noticeably more densely populated.',
          'In 2010, the most striking change was the conversion of the southern farmland into a large housing estate. A retirement home was constructed in the north, and the school was extended to the west. The post office next to the school was converted into a shop, while the main road running through the village remained unchanged.',
          'Over the following eighty years, the southern farmland was redeveloped as a residential area. In addition, Stokeford saw the addition of a retirement home in the north, while the school grew larger to the west. Finally, the post office became a shop, but no significant changes occurred to the main road, which still ran through the middle of Stokeford.',
        ],
      },
    ],
  };

  return { demo, changeVocab, positionVocab, writingStructures, sentenceStructures, formulaTip, rules, prepGroups, paraphrasing, tips };
})();
