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
  // Bài mẫu (đề minh hoạ tự soạn): mỗi đoạn là kế hoạch TỪNG CÂU theo khung Maps của Ms. Gigi
  const O = (f, text) => ({ f, text });
  const demo = {
    task_type: 'maps',
    outline: 'maps',
    subject: 'the village of Stokeford in 1930 and 2010',
    topic_vi: 'Hai bản đồ làng Stokeford năm 1930 và 2010.',
    prompt_text: 'The maps below show the village of Stokeford in 1930 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
    steps: [
      {
        title: 'Introduction: sự phát triển của làng Stokeford, 1930 → 2010',
        guide_vi: 'Một câu paraphrase đề: giữ đúng tên làng và hai mốc năm.',
        vocab: [{ phrase: 'illustrate', meaning_vi: 'minh hoạ' }, { phrase: 'the development of', meaning_vi: 'sự phát triển của' }, { phrase: 'the changes in', meaning_vi: 'những thay đổi ở' }, { phrase: 'between 1930 and 2010', meaning_vi: 'trong giai đoạn 1930–2010' }],
        sentences: [
          { f: [1, 2], status: 'fit', focus_vi: 'Paraphrase đề: bản đồ gì, ở đâu, năm nào.', options: [
            O(1, 'The maps illustrate the development of the village of Stokeford between 1930 and 2010.'),
            O(2, 'The maps illustrate the changes in the village of Stokeford between 1930 and 2010.'),
            O(1, 'The maps illustrate the development of Stokeford, a small village, between 1930 and 2010.'),
          ] },
        ],
        skipped: [],
      },
      {
        title: 'Overview: thêm khu dân cư và công trình mới, đường chính giữ nguyên',
        guide_vi: 'Thay đổi lớn nhất + điểm giữ nguyên. Không nêu vị trí chi tiết, không số liệu.',
        vocab: [{ phrase: 'underwent significant development', meaning_vi: 'được phát triển đáng kể' }, { phrase: 'the addition of', meaning_vi: 'sự bổ sung' }, { phrase: 'the redevelopment of', meaning_vi: 'sự tái phát triển' }, { phrase: 'remained unchanged', meaning_vi: 'không thay đổi' }],
        sentences: [
          { f: [1, 2], status: 'fit', focus_vi: 'Các thay đổi chính: thêm nhà ở & viện dưỡng lão, đất nông nghiệp bị tái phát triển.', options: [
            O(1, 'Overall, the village underwent significant development, with the addition of new housing and a retirement home and the redevelopment of its farmland.'),
            O(2, 'Overall, the area underwent significant transformation, with the conversion of farmland into housing and the construction of new facilities.'),
            O(1, 'Overall, Stokeford underwent considerable development, with additions of residential areas and the redevelopment of its southern farmland.'),
          ] },
          { f: [1, 2], status: 'fit', focus_vi: 'Điểm giữ nguyên: đường chính.', options: [
            O(1, 'Some areas, however, remained unchanged.'),
            O(1, 'The main road, however, remained unchanged.'),
            O(2, 'Meanwhile, the main road through the village remained unchanged.'),
          ] },
        ],
        skipped: [],
      },
      {
        title: 'Body 1: bố cục làng Stokeford năm 1930 (chỉ bản đồ 1)',
        guide_vi: 'Chỉ tả vị trí các công trình năm 1930, không nói thay đổi.',
        vocab: [{ phrase: 'the layout of … included several key features', meaning_vi: 'bố cục … gồm vài đặc điểm chính' }, { phrase: 'was located in', meaning_vi: 'nằm ở' }, { phrase: 'lay to the south of', meaning_vi: 'nằm về phía nam của' }, { phrase: 'was situated in', meaning_vi: 'nằm ở' }, { phrase: 'stood next to', meaning_vi: 'nằm cạnh' }],
        sentences: [
          { f: [1], status: 'fit', focus_vi: 'Câu mở đoạn: năm 1930.', options: [
            O(1, 'In 1930, the layout of the village included several key features.'),
            O(1, 'In 1930, the layout of Stokeford included several key features.'),
            O(1, 'In 1930, the layout of the village included several key features along a single main road.'),
          ] },
          { f: [2], status: 'fit', focus_vi: 'Vị trí nhà ở và trường học.', options: [
            O(2, 'A row of houses was located along the main road, close to a school in the center of the village.'),
            O(2, 'Most houses were located along the main road, adjacent to a school in the middle of the village.'),
            O(2, 'Houses were located on both sides of the main road, close to the school in the center.'),
          ] },
          { f: [3], status: 'fit', focus_vi: 'Đất nông nghiệp phía nam và cánh đồng ở rìa bản đồ.', options: [
            O(3, 'Farmland lay to the south of the houses, while open fields were situated at the edge of the map.'),
            O(3, 'A large area of farmland lay to the south of the main road, while open fields were situated at the edge of the map.'),
            O(3, 'The farmland lay to the south of the village centre, while open fields were situated in the northern part of the map.'),
          ] },
          { f: [4], status: 'replaced', why_vi: 'Khung K4 có vế “was surrounded by …”, nhưng trên bản đồ 1930 không có công trình nào được bao quanh bởi công trình khác, nên bỏ vế này.', alt_frame: 'Additionally, [Công trình 6] stood next to [Công trình 7].', focus_vi: 'Bưu điện cạnh trường học.', options: [
            O(4, 'Additionally, a post office stood next to the school.'),
            O(4, 'Additionally, a small post office stood next to the school on the main road.'),
            O(4, 'Additionally, a post office stood next to the school, in the center of the village.'),
          ] },
        ],
        skipped: [],
      },
      {
        title: 'Body 2: những thay đổi đến năm 2010 (bản đồ 2)',
        guide_vi: 'Chỉ chọn 3-4 thay đổi chính, mỗi câu một thay đổi kèm vị trí.',
        vocab: [{ phrase: 'experienced significant changes', meaning_vi: 'trải qua thay đổi lớn' }, { phrase: 'was transformed into', meaning_vi: 'được chuyển đổi thành' }, { phrase: 'was converted into', meaning_vi: 'được chuyển đổi chức năng thành' }, { phrase: 'was expanded to the west', meaning_vi: 'được mở rộng về phía tây' }, { phrase: 'was constructed in', meaning_vi: 'được xây ở' }],
        sentences: [
          { f: [1], status: 'fit', focus_vi: 'Câu mở đoạn: năm 2010, nhiều công trình mới.', options: [
            O(1, 'By 2010, the village experienced significant changes, with several new constructions.'),
            O(1, 'By 2010, the area experienced significant changes, with new housing and facilities.'),
            O(1, 'By 2010, Stokeford experienced significant changes, with several new constructions and conversions.'),
          ] },
          { f: [2], status: 'fit', focus_vi: 'Đất nông nghiệp → khu dân cư.', options: [
            O(2, 'The farmland in the south was transformed into a residential area, which was located on both sides of a new road.'),
            O(2, 'The southern farmland was replaced by a large housing estate, which was located on both sides of a new road.'),
            O(2, 'The farmland was converted into housing, which was located in the southern part of the village.'),
          ] },
          { f: [3], status: 'fit', focus_vi: 'Trường mở rộng về phía tây; đường chính giữ nguyên.', options: [
            O(3, 'The school was expanded to the west, while the main road remained unchanged in the center.'),
            O(3, 'The school was enlarged to the west, while the main road remained unchanged in the middle of the village.'),
            O(3, 'The school was expanded to the west, while the main road remained unchanged in the same position.'),
          ] },
          { f: [4], status: 'fit', focus_vi: 'Viện dưỡng lão mới ở phía bắc.', options: [
            O(4, 'A new retirement home was constructed in the northern part of the village, opposite the houses along the main road.'),
            O(4, 'A new retirement home was constructed in the north of the village, next to the main road.'),
            O(4, 'A new retirement home was constructed in the north, opposite the row of houses.'),
          ] },
          { f: [2], status: 'fit', focus_vi: 'Bưu điện → cửa hàng.', options: [
            O(2, 'Moreover, the post office was converted into a shop, which was located next to the school.'),
            O(2, 'In addition, the post office was converted into a shop, which was located in the same place.'),
            O(2, 'The post office was also converted into a shop, which was located next to the school.'),
          ] },
          { f: [5], status: 'fit', focus_vi: 'Kết quả chung của các thay đổi.', options: [
            O(5, 'These modifications resulted in a much more residential village with fewer open spaces.'),
            O(5, 'These modifications resulted in more housing and facilities for local residents.'),
            O(5, 'These modifications resulted in a reduction in open space in the south.'),
          ] },
        ],
        skipped: [],
      },
    ],
  };

  demo.paraphrase = [
    { word: 'show', meaning_vi: 'cho thấy', alternatives: [{ phrase: 'illustrate', meaning_vi: 'minh hoạ' }, { phrase: 'depict', meaning_vi: 'mô tả' }, { phrase: 'compare', meaning_vi: 'so sánh', note_vi: 'dùng khi có 2 bản đồ' }] },
    { word: 'the village', meaning_vi: 'ngôi làng', alternatives: [{ phrase: 'the settlement', meaning_vi: 'khu định cư' }, { phrase: 'the area', meaning_vi: 'khu vực' }, { phrase: 'Stokeford', meaning_vi: 'tên làng', note_vi: 'dùng tên riêng để đỡ lặp' }] },
    { word: 'in 1930 and 2010', meaning_vi: 'vào năm 1930 và 2010', alternatives: [{ phrase: 'between 1930 and 2010', meaning_vi: 'giữa 1930 và 2010' }, { phrase: 'over the 80-year period', meaning_vi: 'trong 80 năm' }, { phrase: 'over eight decades', meaning_vi: 'trong tám thập kỷ' }] },
    { word: 'houses', meaning_vi: 'nhà ở', alternatives: [{ phrase: 'housing', meaning_vi: 'nhà ở (danh từ chung)' }, { phrase: 'residential buildings', meaning_vi: 'các toà nhà dân cư' }, { phrase: 'homes', meaning_vi: 'nhà' }] },
    { word: 'farmland', meaning_vi: 'đất nông nghiệp', alternatives: [{ phrase: 'agricultural land', meaning_vi: 'đất canh tác' }, { phrase: 'farming area', meaning_vi: 'khu trồng trọt' }, { phrase: 'fields', meaning_vi: 'cánh đồng' }] },
    { word: 'retirement home', meaning_vi: 'viện dưỡng lão', alternatives: [{ phrase: 'care home for the elderly', meaning_vi: 'nhà chăm sóc người già' }, { phrase: 'nursing home', meaning_vi: 'viện dưỡng lão' }] },
    { word: 'school', meaning_vi: 'trường học', alternatives: [{ phrase: 'educational facility', meaning_vi: 'cơ sở giáo dục' }, { phrase: 'the school building', meaning_vi: 'toà nhà trường' }] },
    { word: 'post office', meaning_vi: 'bưu điện', alternatives: [{ phrase: 'postal office', meaning_vi: 'bưu cục' }] },
    { word: 'residential area', meaning_vi: 'khu dân cư', alternatives: [{ phrase: 'housing estate', meaning_vi: 'khu nhà ở' }, { phrase: 'neighbourhood', meaning_vi: 'khu phố' }] },
    { word: 'main road', meaning_vi: 'đường chính', alternatives: [{ phrase: 'the principal road', meaning_vi: 'con đường chính' }, { phrase: 'the main street', meaning_vi: 'phố chính' }] },
  ];

  // Ảnh đề minh hoạ cho bài mẫu: 2 bản đồ Stokeford vẽ bằng SVG (khớp nội dung bài mẫu)
  function demoMaps() {
    const W = 440, H = 380, top = 64;
    const houses = (x0, y, n) => Array.from({ length: n }, (_, i) => `<rect x="${x0 + i * 26}" y="${y}" width="17" height="14" rx="2" fill="#e9a46b" stroke="#8a5a2b"/>`).join('');
    const label = (x, y, t, size) => `<text x="${x}" y="${y}" font-size="${size || 13}" text-anchor="middle" fill="#1d281b">${t}</text>`;
    const panel = (ox, year, later) => {
      let g = `<g transform="translate(${ox},${top})"><rect width="${W}" height="${H}" fill="#f7f4ea" stroke="#9a9a95"/>`;
      // cánh đồng trống ở rìa phía bắc (năm 2010 thu hẹp)
      g += `<rect x="0" y="0" width="${later ? 200 : W}" height="62" fill="#dcefc9"/>` + label(later ? 100 : 120, 36, 'Open fields');
      if (later) g += `<rect x="232" y="12" width="120" height="58" rx="4" fill="#c9a2e0" stroke="#6b4a8a"/>` + label(292, 46, 'Retirement home', 12);
      // phía nam: đất nông nghiệp (1930) → khu dân cư + đường mới (2010)
      if (!later) g += `<rect x="0" y="250" width="${W}" height="${H - 250}" fill="#cfe3a6"/><rect x="0" y="250" width="${W}" height="${H - 250}" fill="url(#crop)"/>` + label(W / 2, 322, 'Farmland', 15);
      else {
        g += `<rect x="0" y="250" width="${W}" height="${H - 250}" fill="#efe3d1"/><rect x="204" y="214" width="16" height="${H - 214}" fill="#c9c9c4"/>`;
        for (let r = 0; r < 4; r++) g += houses(110, 262 + r * 28, 3) + houses(232, 262 + r * 28, 3);
        g += label(72, 316, 'Residential', 13) + label(72, 332, 'area', 13) + `<text x="212" y="${H - 8}" font-size="11" text-anchor="middle" fill="#55554f">New road</text>`;
      }
      // đường chính (giữ nguyên) + nhà dọc hai bên đường
      g += `<rect x="0" y="190" width="${W}" height="24" fill="#c9c9c4"/>` + `<text x="${W - 50}" y="206" font-size="12" text-anchor="middle" fill="#3d3d39">Main road</text>`;
      g += houses(16, 168, 6) + houses(16, 222, 6) + label(80, 160, 'Houses', 12);
      // trường học (2010 mở rộng về phía tây) và bưu điện → cửa hàng
      g += later ? `<rect x="176" y="112" width="92" height="64" rx="3" fill="#8fb3e0" stroke="#2f5d8f"/>` + label(222, 149, 'School')
        : `<rect x="214" y="120" width="54" height="56" rx="3" fill="#8fb3e0" stroke="#2f5d8f"/>` + label(241, 152, 'School');
      g += `<rect x="276" y="140" width="40" height="36" rx="3" fill="#e8d36a" stroke="#8a7a1f"/>` + label(296, 132, later ? 'Shop' : 'Post office', 12);
      // la bàn
      g += `<g transform="translate(${W - 26},${later ? 100 : 30})"><path d="M0 -14 L6 6 L0 2 L-6 6 Z" fill="#1d281b"/><text y="20" font-size="11" text-anchor="middle" fill="#1d281b">N</text></g>`;
      return g + `</g><text x="${ox + W / 2}" y="${top - 14}" font-size="18" font-weight="bold" text-anchor="middle" fill="#1d281b">Stokeford ${year}</text>`;
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2 + 60}" height="${H + top + 20}" viewBox="0 0 ${W * 2 + 60} ${H + top + 20}" font-family="Arial, Helvetica, sans-serif">
      <defs><pattern id="crop" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="#a9c97a" stroke-width="2"/></pattern></defs>
      <rect width="100%" height="100%" fill="#ffffff"/>${panel(20, 1930, false)}${panel(W + 40, 2010, true)}</svg>`;
    return { dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), mediaType: 'image/svg+xml', base64: '' };
  }
  const demoImage = demoMaps();

  return { demo, demoImage, changeVocab, positionVocab, writingStructures, sentenceStructures, formulaTip, rules, prepGroups, paraphrasing, tips };
})();
