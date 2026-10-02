/* Dàn ý IELTS Writing Task 1 – Ms. Gigi (Lokilukita).
 * Chép từ tài liệu "IELTS WRITING Ms.Gigi". Mọi gợi ý AI phải đi theo đúng dàn ý ở đây;
 * giao diện cũng hiển thị khung câu từ file này (không phụ thuộc AI). */
window.GIGI = (function () {
  /* ---------- 6 dạng dàn ý ---------- */
  const OUTLINES = {
    trend: {
      name: 'Line graph / Bar chart có thời gian',
      short: 'Line / Bar (xu hướng)',
      when: 'Biểu đồ có trục thời gian (nhiều năm): line graph, bar chart theo năm, table theo năm.',
      intro: {
        rule: '1 câu: Name + Verb + Object of Description + Time.',
        frames: [
          'The line graph / The bar chart + shows / illustrates / presents / demonstrates + the number of / the amount of / the quantity of / the percentage of / the proportion of / the figure for + [chủ thể] + from ... to ... / between ... and ... / over a period of ... years from ... to ...',
        ],
        notes: ['number of = đếm được; amount of = không đếm được; quantity of = cả hai', 'percentage of = % phần so với tổng; proportion of = tỷ lệ giữa các phần; figure for = số liệu tổng quan'],
      },
      overview: {
        rule: '2 câu: 2 xu hướng khác nhau + cái cao nhất / phổ biến nhất. Không có số liệu.',
        frames: [
          'Overall, it is obvious that while [S] + [V], the opposite was true for [cái còn lại].',
          'In addition, [...] was the most popular [...] at the end of the period.',
          '(Nếu cùng xu hướng) All [...] show a similar trend in percentage changes.',
        ],
      },
      body1: {
        rule: 'Chia theo thời gian (hoặc theo nhóm xu hướng: Body 1 nhóm tăng trưởng). Viết số liệu NĂM ĐẦU TIÊN rồi xu hướng các năm tiếp theo.',
        frames: [
          'In [năm đầu], the percentage of [A] was [..]%, while the proportions for [B] and [C] were [..]% and [..]% respectively.',
          'Over the next [..] years, [câu thể hiện xu hướng tăng/giảm và so sánh].',
        ],
      },
      body2: {
        rule: 'Giai đoạn còn lại (hoặc nhóm biến động/giảm), xu hướng + so sánh, kết bằng điểm cuối.',
        frames: [
          'From [..] to [..] (Between [..] and [..]), [câu thể hiện xu hướng tăng/giảm và so sánh].',
          '[A] was overtaken by [B] in [năm]. / The two figures intersected at [điểm] in [năm].',
        ],
      },
      rules: [
        '4 xu thế: Tăng (rise, jump, grow, climb, go up, increase, soar) · Giảm (fall, drop, decline, decrease, go down, plunge, plummet) · Dao động (fluctuate) · Ổn định (remain stable, remain steady).',
        'Trạng từ: sharply, quickly, rapidly, steeply / considerably, significantly, substantially / steadily, gradually, moderately / slightly, slowly.',
        'Thêm số liệu: by (mức thay đổi: increased by 10%), to (mức đạt tới: rose to 10%), at (ổn định: remained at 10%), from ... to ...; around/about, nearly.',
        '3 cấu trúc: S + V + adv (… increased significantly) · There + be + a + adj + noun + in … (There was a significant increase in …) · Time + saw/witnessed/experienced + a + adj + noun + in … (The first five years witnessed a significant increase in …).',
        '“witness”: chủ ngữ là Period/Year/Decade ✅, Country/City/Market ✅, Chart/Graph ⚠️ không nên, Percentage/Number/Figure ❌, Age group ❌.',
        'Kết hợp xu hướng: [xu hướng 1], followed by [xu hướng 2] · saw a sharp increase before leveling off at … · A was overtaken by B in [năm] · The gap between A and B narrowed until they met at the same level.',
        'So sánh: whereas, while (2 xu hướng trái ngược), in contrast, compared to, respectively.',
      ],
      sample: `The line graph illustrates the percentage of commuters using cars, buses, and bicycles in Metro City between 2000 and 2025.
Overall, it is obvious that while the proportion of car users witnessed a downward trend, the opposite was true for bus and bicycle commuters. In addition, bus commuting is projected to become the most popular method at the end of the period.
In 2000, the percentage of car commuters was the highest at approximately 60%, while the proportions for bus and bicycle users were around 25% and 5% respectively. Over the next 10 years, the figure for car usage experienced a gradual decline to roughly 55%. In contrast, the percentages of people traveling by bus and bicycle saw a slight increase, reaching about 30% and 10%.
From 2010 to 2025, the proportion of people driving cars continued to drop significantly, falling to about 35% at the end of the period. Meanwhile, the figures for bus and bicycle commuters experienced a steady growth. Notably, the proportion of bus users overtook that of car users in 2023, before climbing to nearly 40% in 2025, whereas the figure for bicycles ended at approximately 20%.`,
    },

    compare: {
      name: 'Bar / Pie / Table so sánh (không thời gian)',
      short: 'Bar / Pie / Table (so sánh)',
      when: 'Số liệu tại một thời điểm hoặc vài thời điểm rời rạc để so sánh các hạng mục: pie chart, bar chart không theo năm, table, 2 biểu đồ.',
      intro: {
        rule: '1 câu: Name + Verb + Object of Description + Time.',
        frames: ['The pie chart / The bar chart / The table + illustrates / shows + [chủ thể chính xác] + in [năm/nơi].'],
      },
      overview: {
        rule: '1 câu: hạng mục cao nhất, thấp nhất, và nhóm giống/khác nhau. Không có số liệu. (2 biểu đồ: nối miếng to nhất của mỗi hình bằng While/Whereas.)',
        frames: [
          'Overall, [danh mục nổi bật nhất] had the [highest/lowest] [number/proportion/sales], while [danh mục khác] recorded the [lowest/highest] figures, and [danh mục khác] showed [similar/different] values.',
          '(2 biểu đồ) While [A] and [B] are the most dominant [...] in the first chart, [C] is the [...] in the second one.',
        ],
      },
      body1: {
        rule: 'Đi từ số TO đến số NHỎ: quán quân → á quân → số trung bình. (2 biểu đồ: Body 1 = biểu đồ 1.)',
        frames: [
          'Looking at the [chart] more closely, [category A] accounted for [..]%, making it the dominant category.',
          'This was followed by [category B] at [..]%, which was (nearly double / slightly lower / roughly the same as) [category C].',
          'Meanwhile, [category D] represented [..]%, showing a noticeable difference compared with [another category].',
        ],
      },
      body2: {
        rule: 'Các số nhỏ còn lại + điểm nổi bật để so sánh. (2 biểu đồ: Body 2 = biểu đồ 2, đối chiếu ngược với biểu đồ 1, tả "thằng đột biến" và "thằng đặc biệt".)',
        frames: [
          'By contrast, the smallest proportion was seen in [category E], at only [..]%.',
          'Similarly, [category F] also had a relatively modest figure, standing at [..]%.',
          'It is also worth noting that [G] and [H] were identical, at [..]% each.',
          'Another striking feature is that [the combined share of A and B exceeded half the total / one category was more than three times as large as another].',
          '(2 biểu đồ) Turning to the [chart 2], the highest proportion/number was seen in [E], at [..]%. By contrast, [F] had the lowest figure, standing at [..]%.',
        ],
      },
      rules: [
        'Pie: “account for, make up, constitute, represent, a larger share than, the lion’s share” CHỈ dùng khi dữ liệu là % và tổng 100%. Không nói “Product A accounted for 500 units”.',
        'Bar (số tuyệt đối): dùng outweigh, surpass, exceed, double, lag behind; recorded/registered, stood at, reached, attracted (người), sold/produced/earned; “There were 500 visitors in City A, compared to only 200 in City B.”',
        'Số liệu không chính xác 100% → approximately, about, roughly. Chênh lệch nhỏ: slightly, marginally; lớn: far, significantly.',
        'Tránh lặp higher than/lower than — xen kẽ outweigh, surpass, in contrast.',
        'Phân số: 100% = all/every · 75% = three quarters · 50% = a half · 33% = about a third · 25% = a quarter · 0 = no/none.',
        'MỨC ĐỘ 1 – cao nhất (mở đoạn): [Chủ thể] tops the list / ranks first, accounting for [số] · [Chủ thể] recorded/registered the highest figure/proportion, standing at [số] · [Chủ thể] was the most dominant motive/factor, at [số].',
        'MỨC ĐỘ 2 – so sánh hơn + đối lập: While the figure for [A] was [số], that of [B] was significantly lower/higher, at [số] · The figure for [A] stood at [số]. In stark contrast, [B] registered only [số] · [A] was higher/lower than [B] ([số A] compared to [số B]).',
        'MỨC ĐỘ 3 – gấp nhiều lần (Band 7+): The figure for [A] was double/triple/nearly triple that of [B] · [A] was [số] times higher than that of [B] · [A] was only a third/a quarter of the [B] total.',
        'Câu ghép: mệnh đề quan hệ (…50%, which was the highest figure in the chart) · While/Whereas (While Group A accounted for 50%, Group B represented only 10%) · respectively (A and B stood at 10% and 20% respectively).',
      ],
      sample: `The pie charts illustrate the survey responses from foreign language teachers in Britain regarding the primary reasons their students choose to learn a foreign language, alongside their perceptions of recent changes in these motivations.
Overall, it is evident that travel and business are the most dominant motives for language acquisition, whereas buying property overseas is perceived as the reason experiencing the most significant recent growth.
Regarding the primary motives, travel tops the list, accounting for the highest proportion at 33%. Business is the second most common reason, registered at 26%, followed closely by purchasing real estate abroad at 19%. In stark contrast, personal development and social contacts each represent a mere 7%, while general interest accounts for the lowest figure at only 3%.
Looking at the second chart, a striking 34% of teachers reported a recent increase in students learning languages to buy property overseas. Business also saw a notable rise according to 19% of respondents, while social contacts registered a 15% increase. Whereas travel was the most popular overall motive in the first chart, it was noted as a growing factor by only 3% of educators in the second one.`,
    },

    maps: {
      name: 'Maps (thay đổi qua thời gian)',
      short: 'Maps',
      when: 'Hai (hoặc nhiều) bản đồ của một nơi ở các năm khác nhau, hoặc bản đồ hiện tại + quy hoạch.',
      intro: {
        rule: '1 câu.',
        frames: ['The maps illustrate the development of [place] between [year X] and [year Y].', 'The maps illustrate the changes in [place] between [..] and [..].'],
      },
      overview: {
        rule: '1 câu (+ câu ngắn giữ nguyên): thay đổi chính, không vị trí chi tiết.',
        frames: [
          'Overall, the area underwent [significant/considerable] development, with [new constructions / additions of facilities] and the [removal/redevelopment] of [công trình cũ]. Some areas, however, remained unchanged.',
          'Overall, the area underwent significant transformation, with [main change 1] and [main change 2]. Meanwhile, [trend/contrast] was also noticeable.',
        ],
      },
      body1: {
        rule: 'CHỈ miêu tả vị trí các công trình trên bản đồ đầu tiên, không đề cập thay đổi.',
        frames: [
          'Mở đoạn: In [thời điểm 1], the layout of [khu vực] included several key features.',
          'Chi tiết vị trí: [Công trình 1] was located in [the north/center], [adjacent to/close to] [Công trình 2].',
          'Vị trí khác: [Công trình 3] lay to the [north/south] of [Công trình 4], while [Công trình 5] was situated in [the top-left corner / at the edge of the map].',
          'Vị trí bổ sung: Additionally, [Công trình 6] stood next to [Công trình 7] and was surrounded by [Công trình 8].',
        ],
      },
      body2: {
        rule: 'Miêu tả thay đổi và vị trí trên bản đồ 2 (chỉ 3-4 thay đổi chính).',
        frames: [
          'Mở đoạn: By [thời điểm 2], the area experienced significant changes, with [new constructions/removals].',
          'Thay đổi và vị trí: [Công trình 1] was [demolished / replaced by / converted into] [công trình mới], which was located in [the north].',
          'Thay đổi khác: [Công trình 2] was [expanded/relocated] to [the south], while [Công trình 3] remained unchanged in [the center].',
          'Vị trí bổ sung: A new [Công trình 4] was constructed in [the top-left corner], [next to/opposite] [Công trình 5].',
          '(Kết quả) These modifications resulted in [a reduction in open space / more facilities for students].',
        ],
      },
      rules: [
        'In the North of the city = bên TRONG thành phố · To the North of the city = bên NGOÀI, lệch về hướng Bắc.',
        'Có “side” → ON (on the northern side of the bridge) · Có “part” → IN (in the eastern part of the village).',
        'Nhóm IN: center, middle, corner, part, area · AT: top, bottom, entrance, intersection, junction · ON: side, bank, edge, left/right-hand side · TO: north/south/east/west of [object].',
        'Paraphrase vị trí: The house is located to the right of the tree · On the right-hand side of the tree, a house can be seen · The area to the right of the tree is occupied by a house.',
        'Đồng nghĩa: xây mới erected // constructed / built · phá bỏ demolished // knocked down · mở rộng enlarged // expanded · thay thế replaced by // made way for · chuyển chỗ relocated to · hiện đại hoá modernized // renovated.',
        'Lỗi hay gặp: liệt kê quá nhiều chi tiết · dùng hiện tại đơn (phải dùng quá khứ) · lặp từ · quên so sánh hai thời điểm.',
        'Thời gian: In 1990 / In the first map · By 2020 / In the second map / In the final map · Over the 30 years / Over the two decades · From … to …',
        'Mẹo: Thời gian + Vật thể + Hành động + Vị trí (In 1995, a cafe was located next to the library).',
      ],
      sample: `The maps illustrate the development of the village of Ryemouth between 1995 and present.
Overall, the area underwent significant development, with the addition of new recreational facilities and the removal of the fishing port, while some residential areas remained unchanged.
In 1995, the layout of the village included several key features. A housing area was located in the north-west, close to a main road and a small cluster of houses. A shop lay to the south of the housing area, while a forest park was situated in the center of the map. Additionally, a hotel stood next to the forest park, and a fish market stood next to a fishing port with a pier by the sea in the south.
By present, the area experienced significant changes, with several new constructions and removals. The fish market and the fishing port in the south were demolished and replaced by new apartments, which were located along the coast. The shop was converted into a restaurant, while the hotel remained unchanged in the center-right. A new golf course was constructed in the north-east, and the forest park was replaced by tennis courts. Furthermore, a new car park was constructed next to the hotel.`,
    },

    floorplan: {
      name: 'Maps dạng building / floor plan (1 sơ đồ)',
      short: 'Floor plan',
      when: 'Một sơ đồ mặt bằng tòa nhà/khu vực, không có thay đổi theo thời gian.',
      intro: { rule: '1 câu.', frames: ['The diagram illustrates the layout of [building/area] and the arrangement of [rooms/facilities/exits].'] },
      overview: {
        rule: '1-2 câu: bố cục chung + đặc điểm nổi bật nhất.',
        frames: [
          'Overall, the building is divided into [..] main sections, including [..], [..] and [..].',
          'The [most noticeable feature] is [central hall/exits/key room], and [additional feature] can also be observed.',
          'Overall, the building has a symmetrical layout centred around a main hall. / Overall, the central area serves as the main access point, with most facilities arranged around it.',
        ],
      },
      body1: {
        rule: 'Các khu vực chính theo hướng và trung tâm.',
        frames: [
          'On the [north/south/west/east] side, there is [room/facility].',
          'In the centre of the building, [main hall/lobby] is located, which connects to [other areas].',
          'Surrounding this central area are [classrooms/offices/rooms].',
        ],
      },
      body2: {
        rule: 'Lối đi, kết nối và tiện ích phụ.',
        frames: [
          'The building is equipped with [stairs/lifts/emergency exits], providing access to [upper floors/outdoor area].',
          'In addition, [corridor/pathway] runs through the [centre/side], linking [..] to [..].',
          'There are also [fire exits/toilets/storage rooms] situated [in the corners/along the hallway].',
        ],
      },
      rules: [
        'Vị trí: to the left/right of …, adjacent to …, opposite …, between … and …, next to …, at the end of the corridor …, at the entrance …, near the main entrance …',
        'Layout verbs: occupies, is positioned, is located, is situated, is found, lies.',
        'Kết nối: is connected to, gives access to, leads to, opens into, branches off into, provides direct access to.',
        'Kích thước: occupies the largest area, takes up most of the space, covers approximately half of the building, is considerably larger than …',
      ],
      sample: '',
    },

    process_man: {
      name: 'Process nhân tạo (sản xuất)',
      short: 'Process (nhân tạo)',
      when: 'Quy trình sản xuất / chế biến có đầu vào và thành phẩm.',
      intro: { rule: '1 câu.', frames: ['The diagram demonstrates / illustrates the process of [V-ing …].'] },
      overview: {
        rule: '1-2 câu: số giai đoạn, bắt đầu và kết thúc.',
        frames: [
          'Overall, this process comprises [số] main stages, beginning with [đầu vào] and ending with [đầu ra].',
          'Overall, there are [..] main stages in the process, beginning with [..] and ending with [..].',
        ],
      },
      body1: {
        rule: 'Các bước đầu, dùng bị động thì hiện tại.',
        frames: ['At the first stage in the process, [bước 1]. After that, [bước 2]. Following this, [bước 3].'],
      },
      body2: {
        rule: 'Các bước còn lại đến thành phẩm.',
        frames: [
          'Subsequently, [bước 4]. Once this is completed, [bước 5] occurs, followed by [bước 6].',
          'In the final stage, [bước cuối], which results in [thành phẩm].',
        ],
      },
      rules: [
        'Từ nối trình tự: First/Firstly/Initially · Next/Then · After that/Subsequently · Finally/In the final step.',
        'Động từ (bị động hiện tại): is/are done, is/are produced, is transformed into, is carried out.',
        'Đưa vào máy: be fed into, be introduced into · Di chuyển: be transferred to, be conveyed to, be moved to · Xử lý: undergo, be processed in, be subjected to.',
        'Kéo dài nội dung: (1) thêm thời gian/địa điểm/dụng cụ có trong hình (dried using hot air in a special machine for 24 hours) · (2) mệnh đề rút gọn before V-ing / after being V3 / which is then … · (3) tả trạng thái trước và sau (the trimmed logs are fed into a machine to be cut into small wood chips) · (4) gom bước nhỏ thành giai đoạn lớn (The entire process can be divided into two main phases, starting with … and ending with …).',
      ],
      sample: `The diagram illustrates the process of how olive oil is produced.
Overall, this process comprises several main stages, beginning with harvesting the olives and ending with storing the oil in a tank.
At the first stage in the process, olives are harvested from trees and put into a collection vat. After that, they are moved to be de-leafed and washed. Following this, the olives are crushed in an olive mill to create olive paste. Next, the paste is put into a malaxer at a temperature of under 27°C.
Subsequently, the mixture is pressed in a centrifugal press. From this stage, pomace is separated and transported to refining factories for further processing. Meanwhile, the remaining virgin oils are directed into two parallel stages: separation and decantation. Through these processes, waste water, solids, and other residues are removed. Finally, the cleaned oil is collected and stored in a storage tank.`,
    },

    process_nat: {
      name: 'Process tự nhiên (vòng đời / chu trình)',
      short: 'Process (tự nhiên)',
      when: 'Vòng đời sinh vật, chu trình tự nhiên (nước, đá…), lặp lại.',
      intro: { rule: '1 câu.', frames: ['The diagram illustrates the life cycle / natural process of [đối tượng].'] },
      overview: {
        rule: '1 câu: chu trình lặp lại, số giai đoạn, đầu và cuối.',
        frames: ['Overall, this is a cyclical process with [số] stages, beginning with [A] and ending with [B], after which the cycle repeats itself.'],
      },
      body1: { rule: 'Các giai đoạn đầu.', frames: ['Initially, [bước 1]. Following this, [bước 2]. At the next stage, [bước 3].'] },
      body2: {
        rule: 'Các giai đoạn cuối, khép lại chu trình.',
        frames: ['In the subsequent stage, [bước 4]. Finally, [bước cuối], which completes the cycle as it returns to the original stage.'],
      },
      rules: [
        'Từ nối trình tự: Initially · Following this · At the next stage · In the subsequent stage · Finally.',
        'Thêm chi tiết có trong hình: thời gian (for about 5 to 6 months), kích thước (between 3 and 8cm long), nơi sống (in the upper river).',
      ],
      sample: `The diagram illustrates the natural process of the life cycle of a salmon.
Overall, this is a cyclical process with three main stages, beginning with eggs in the upper river and ending with the adult salmon in the open ocean, after which the cycle repeats itself.
Initially, salmon eggs are laid in the upper river, where they stay for about 5 to 6 months. Following this, they hatch and develop into "fry", which are between 3 and 8cm long. At the next stage, these fry migrate to the lower river, where they grow into "smolt", reaching a length of 12 to 15cm. They stay in this fast-flowing water for about 4 years.
In the subsequent stage, the salmon move to the open ocean, where they continue to develop for approximately 5 years. Finally, they reach the adult salmon stage, with a size of 70 to 76cm. This stage completes the cycle as they return to the upper river to lay new eggs.`,
    },
  };

  /* ---------- Quy tắc chung cho mọi dạng ---------- */
  const GENERAL = {
    golden: [
      'Quy tắc “trọc lốc”: không để danh từ sự vật đứng một mình làm chủ ngữ chỉ xu hướng. Sai: Petroleum increased → Đúng: Petroleum production increased.',
      'Giữ nguyên vẹn chủ thể gốc (car sales, energy consumption, coffee production, visitor numbers); chỉ được bỏ từ chỉ tỷ lệ (percentage/proportion). Sai: Cars increased by 10% → Đúng: Car sales increased by 10%. Sai: Visitors increased → Đúng: The number of visitors increased. Sai: People unemployed rose → Đúng: The rate of unemployment rose.',
      'Lần 1 (mở bài/overview) dùng từ sát đề nhất; lần 2 (body) mới thay bằng đồng nghĩa tương đương. Không dịch bừa: Spending ≠ Sales.',
      'Xác định đúng chủ thể (“Chinese food”, không phải “Chinese” hay “Chinese restaurant”).',
      'Không dùng văn mẫu chung chung: gọi đúng tên chủ thể, quốc gia, hạng mục, số liệu của đề.',
    ],
    subjects: [
      { group: 'Sản xuất & tiêu thụ', items: 'The production/consumption/sales of + [thing] · [thing] + production/consumption levels · The amount/number of + [thing] + produced/consumed/sold · The figure for + [thing]' },
      { group: 'Dân số & nhân khẩu', items: 'The proportion/percentage of the population aged + [age] · The + [age] + age group/bracket/category · The percentage of people/citizens who were aged + [age] · The figure for individuals in the + [age] + bracket' },
      { group: 'Khảo sát & sở thích', items: 'The percentage/proportion of + [đối tượng] + choosing/selecting · The figure for + [lý do] + as a primary motive/factor · Market shares / Leisure preferences / Participation rates' },
      { group: 'Kinh tế & chi tiêu', items: 'The expenditure on / spending on + [hạng mục] · The amount of money spent on + [hạng mục] · National/Household spending on + [hạng mục] · Food/Housing/Transport expenditure' },
    ],
    changeTricks: [
      'Chiêu 1 (Noun → Verb): The consumption of water → How water was consumed.',
      'Chiêu 2 (mệnh đề): chèn Who/Which/How giữa câu.',
      'Chiêu 3 (tính từ quốc gia): The population of Japan → Japanese population; The energy consumption in France → French energy consumption.',
    ],
    synonyms: [
      'Sales → Revenue; The amount sold (tiền hoặc số lượng bán ra)',
      'Spending/Expenditure → Outlays; Money spent (chỉ khi đơn vị tiền tệ)',
      'Purchases → The number of items bought; Consumer acquisitions',
      'Production → Output; The amount produced · Generation (điện) → Electricity output · Manufacturing → Industrial production',
      'Consumption → Use/Usage; Intake (đồ ăn/thức uống) · Demand → Consumer need; The level of demand',
      'Population → The number of inhabitants; Residents · Visitors/Tourists → Arrivals; Holidaymakers · Rate (%) → Percentage/Proportion; Ratio',
    ],
    pieBar: [
      'Dẫn đầu: [Chủ thể] + took the lead / led the chart + with + [%] (Chinese food took the lead with 34%).',
      'Chiếm: [Chủ thể] + accounted for / made up / constituted + [%].',
      'Đứng thứ hai: [Chủ thể] + ranked second, accounting for + [%].',
      'Gộp câu: [Chủ thể 1] + V + [%], followed (closely) by + [Chủ thể 2] + at + [%].',
      'Góc nhìn người khảo sát: [%] of people + chose/preferred/consumed + [Chủ thể] · Bị động: [Chủ thể] + was chosen / was preferred by + [%] of people.',
    ],
    trendBasic: [
      'Tăng: [Chủ thể] + experienced/saw/witnessed + an upward trend / a significant increase.',
      'Giảm: [Chủ thể] + underwent/saw/experienced + a sharp decline / a downward trend.',
      'Động từ: rose/grew/surged/skyrocketed/climbed · dropped/fell/plummeted/decreased.',
      'Đỉnh: reached/hit a peak of + [số] + in [năm] · Dao động/chững: fluctuated / remained stable / plateaued.',
      'Mức độ: tăng increase/go up → rise/grow/climb → surge/soar/show marked growth · giảm decrease/go down → fall/drop/decline → plunge/show a marked decline · phục hồi show signs of recovery → recover/bounce back → see a rebound · ổn định stay the same → remain stable/level off → plateau · dao động fluctuate → fluctuate considerably/oscillate · đỉnh peak at / reach a peak of · đáy hit a low of / fall to its lowest point.',
    ],
    band7: [
      'Biến động nối tiếp: S + V + adv, before [V-ing] + adv (The figure rose sharply to 50%, before dropping gradually to 20%).',
      'Đạt đỉnh: S + peaked at + [số], which was the highest figure recorded in the chart.',
      'Chạm đáy: S + hit a low of + [số], followed by a slight recovery to …',
      'Hai xu hướng đối lập: S A + V + adv, whereas / in contrast, S B experienced an opposite trend.',
      'Ổn định: S + experienced a period of stability / minor fluctuations around [số].',
      'Bổ sung thông tin: S + V + [số], accounting for / making up [tỉ lệ], before reaching …',
      'Không lặp chủ ngữ (phân từ): The number of users increased, reaching 50. Dấu phẩy trước before V-ing, accounting for, peaking at.',
    ],
  };

  const STEP_KEYS = ['intro', 'overview', 'body1', 'body2'];

  function outlineFor(taskType, hint) {
    if (hint && OUTLINES[hint]) return hint;
    if (taskType === 'maps') return 'maps';
    if (taskType === 'process') return 'process_man';
    if (taskType === 'line') return 'trend';
    return 'compare';
  }

  /* Đoạn dàn ý đưa cho AI (tiếng Việt + khung tiếng Anh) */
  function promptBlock(ids) {
    const parts = ids.map(id => {
      const o = OUTLINES[id];
      const sec = k => `  ${k.toUpperCase()} — ${o[k].rule}\n` + o[k].frames.map(f => '    • ' + f).join('\n');
      return `### OUTLINE "${id}": ${o.name}\nUse when: ${o.when}\n${STEP_KEYS.map(sec).join('\n')}\n  RULES:\n${o.rules.map(r => '    - ' + r).join('\n')}` +
        (o.sample ? `\n  MODEL ESSAY (follow this style and paragraph plan):\n${o.sample.split('\n').map(l => '    ' + l).join('\n')}` : '');
    });
    return parts.join('\n\n');
  }
  function generalBlock() {
    return [
      'GOLDEN RULES (Ms. Gigi):', ...GENERAL.golden.map(r => '- ' + r),
      'SUBJECT FORMULAS:', ...GENERAL.subjects.map(s => `- ${s.group}: ${s.items}`),
      'PARAPHRASE TRICKS:', ...GENERAL.changeTricks.map(r => '- ' + r),
      'SYNONYMS (same meaning only):', ...GENERAL.synonyms.map(r => '- ' + r),
      'BAND 7+ SENTENCE UPGRADES:', ...GENERAL.band7.map(r => '- ' + r),
    ].join('\n');
  }

  /* Kiểm tra nhanh một đoạn theo quy tắc Ms. Gigi */
  function lint(text, outline, step) {
    const t = String(text || '');
    const out = [];
    if (!t.trim()) return out;
    const sentences = t.split(/(?<=[.!?])\s+/).filter(s => s.trim()).length;
    if (step === 0 && sentences > 1) out.push('Introduction chỉ nên có 1 câu.');
    if (step === 1 && !/^\s*overall\b/i.test(t)) out.push('Overview nên bắt đầu bằng “Overall,”.');
    if (step === 1 && !/^process/.test(outline) && /\d/.test(t)) out.push('Overview không đưa số liệu.');
    if (outline !== 'compare' && /\b(account(ed|s)? for|made up|makes? up|constitut(ed|es?))\b/i.test(t) && !/%|per ?cent|proportion|share/i.test(t)) out.push('“account for / make up / constitute” chỉ dùng cho tỷ lệ % (tổng 100%).');
    if (/\b(accounted for|made up|constituted)\s+(about |around |approximately |nearly |only )?\d[\d.,]*(?![\d.,])(?!\s*(%|per ?cent))/i.test(t)) out.push('“accounted for / made up” + số tuyệt đối là sai — chỉ dùng với %. Dùng recorded / stood at / reached.');
    if (/\b(the )?(percentage|number|figure|proportion|age group)\b[^.]{0,20}\bwitness(ed|es)?\b/i.test(t)) out.push('“witness” không đi với chủ ngữ Percentage/Number/Figure/Age group — dùng Period/Year/Country làm chủ ngữ.');
    if (outline === 'maps' && step === 2 && /\b(was|were) (built|constructed|demolished|replaced|converted|expanded|removed|relocated)\b/i.test(t)) out.push('Body 1 (Maps) chỉ mô tả bản đồ đầu tiên, không đề cập thay đổi.');
    if (/^process/.test(outline) && /\b(was|were)\b/i.test(t) && step > 1) out.push('Process dùng bị động thì hiện tại (is/are + V3), tránh was/were.');
    if (outline === 'maps' && /\b(in|at) the (\w+ )?side\b/i.test(t)) out.push('Có “side” → dùng ON (on the northern side).');
    if (outline === 'maps' && /\b(on|at) the (\w+ )?part\b/i.test(t)) out.push('Có “part” → dùng IN (in the eastern part).');
    if (/\bthe given (chart|graph|diagram|map|table)\b/i.test(t)) out.push('Tránh “the given chart” — gọi đúng tên chủ thể của đề.');
    return out;
  }

  return { OUTLINES, GENERAL, STEP_KEYS, outlineFor, promptBlock, generalBlock, lint };
})();
