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
          'The line graph / The bar chart / The pie chart + shows / illustrates / presents / demonstrates + the number of / the amount of / the quantity of / the percentage of / the proportion of / the figure for + [chủ thể] + from ... to ... / between ... and ... / over a period of ... years from ... to ... / in ...',
        ],
        notes: ['number of = đếm được; amount of = không đếm được; quantity of = cả hai', 'percentage of = % phần so với tổng; proportion of = tỷ lệ giữa các phần; figure for = số liệu tổng quan'],
      },
      overview: {
        rule: '2 câu: 2 xu hướng khác nhau + cái cao nhất / phổ biến nhất. Không có số liệu.',
        frames: [
          'Overall, it is obvious that while [S] + [V], the opposite was true for [cái còn lại].',
          'In addition, [...] was the most popular [...] at the end of the period.',
          '(Nếu cùng xu hướng) All [...] showed a similar [upward/downward] trend over the period.',
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
          'Looking at the [chart] more closely, [category A] accounted for [..]% (số tuyệt đối: recorded / stood at [..]), making it the dominant category.',
          'This was followed by [category B] at [..]%, which was (nearly double that of / slightly lower than / roughly the same as) [category C].',
          'Meanwhile, [category D] represented [..]%, showing a noticeable difference compared with [another category].',
        ],
      },
      body2: {
        rule: 'Các số nhỏ còn lại + điểm nổi bật để so sánh. (2 biểu đồ: Body 2 = biểu đồ 2, đối chiếu ngược với biểu đồ 1, tả "thằng đột biến" và "thằng đặc biệt".)',
        frames: [
          'By contrast, the smallest proportion was seen in [category E], at only [..]%.',
          'Similarly, [category F] had a relatively modest figure, standing at [..]%.',
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
          'Mở đoạn: By [thời điểm 2], the area had experienced significant changes, with [new constructions/removals]. (Bản đồ hiện tại: By the present day, the area has experienced …)',
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
        'Thì sau “By + năm”: năm trong quá khứ → quá khứ hoàn thành (By 2010, the area had experienced significant changes); bản đồ hiện tại → hiện tại hoàn thành (By the present day, the area has experienced …). Các câu thay đổi sau đó dùng quá khứ đơn bị động (was built, was converted into).',
        'Mẹo: Thời gian + Vật thể + Hành động + Vị trí (In 1995, a cafe was located next to the library).',
      ],
      sample: `The maps illustrate the development of the village of Ryemouth between 1995 and present.
Overall, the area underwent significant development, with the addition of new recreational facilities and the removal of the fishing port, while some residential areas remained unchanged.
In 1995, the layout of the village included several key features. A housing area was located in the north-west, close to a main road and a small cluster of houses. A shop lay to the south of the housing area, while a forest park was situated in the center of the map. Additionally, a hotel stood next to the forest park, and a fish market stood next to a fishing port with a pier by the sea in the south.
By the present day, the area has experienced significant changes, with several new constructions and removals. The fish market and the fishing port in the south were demolished and replaced by new apartments, which were located along the coast. The shop was converted into a restaurant, while the hotel remained unchanged in the center-right. A new golf course was constructed in the north-east, and the forest park was replaced by tennis courts. Furthermore, a new car park was constructed next to the hotel.`,
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
        frames: ['In the first stage of the process, [bước 1]. After that, [bước 2]. Following this, [bước 3].'],
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
In the first stage of the process, olives are harvested from trees and put into a collection vat. After that, they are moved to be de-leafed and washed. Following this, the olives are crushed in an olive mill to create olive paste. Next, the paste is put into a malaxer at a temperature of under 27°C.
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
  /* Hướng dẫn paraphrase CHỦ THỂ chung cho mọi dạng (ví dụ xuyên suốt: đề về commuting / commuters).
   * drop: bỏ “the percentage of” được không · family: đổi từ loại · techniques: các cách viết lại (id dùng để AI gắn nhãn)
   * · mistakes: lỗi hay gặp. Bám quy tắc của cô: chỉ được bỏ từ chỉ tỷ lệ, chủ thể gốc giữ nguyên vẹn. */
  const SUBJECT_GUIDE = {
    drop: {
      rule: 'Quy tắc của cô: ĐƯỢC bỏ từ chỉ tỷ lệ (the percentage of / the proportion of), nhưng chủ thể gốc phải giữ nguyên vẹn (car commuters, car sales, energy consumption…).',
      cases: [
        { ok: 'must', when: 'Động từ đã mang nghĩa “chiếm %”: account for / make up / constitute / represent', wrong: 'The percentage of car commuters accounted for 60%.', right: 'Car commuters accounted for 60% of all commuters.', why: 'Giữ “the percentage of” là lặp nghĩa (percentage + accounted for %).' },
        { ok: 'yes', when: 'Đưa số liệu lên đầu câu: [số]% of + N', wrong: 'The percentage of commuters who travelled by car was 60%.', right: '60% of commuters travelled by car.', why: 'Số % đã nói rõ đây là tỷ lệ.' },
        { ok: 'yes', when: 'Ngay sau có số % và chủ thể còn nguyên', wrong: 'The proportion of car commuters stood at 60% in 2000.', right: 'Car commuters made up 60% of the total in 2000.', why: 'Chỉ bỏ từ chỉ tỷ lệ, “car commuters” vẫn giữ nguyên.' },
        { ok: 'keep', when: 'Động từ xu hướng (rose / fell…) mà không có số % đi kèm', wrong: 'Car commuters fell steadily over the period.', right: 'The percentage of car commuters fell steadily over the period.', why: 'Bỏ đi thì nghe như SỐ NGƯỜI giảm, không còn rõ là TỶ LỆ giảm.' },
        { ok: 'no', when: 'Bỏ luôn cả danh từ chủ thể (trọc lốc)', wrong: 'Car fell to 36%.', right: 'The percentage of car commuters fell to 36%.', why: '“Car” không giảm — tỷ lệ người đi ô tô mới giảm.' },
        { ok: 'no', when: '“the number of” với người / vật đếm được', wrong: 'Visitors increased.', right: 'Visitor numbers / The number of visitors increased.', why: 'Không bỏ “number”: đổi thành “N + numbers” hoặc “the figure for + N”.' },
      ],
    },
    family: [
      { act: 'commuting', person: 'commuters', verb: 'commute (to work)', compound: 'car commuting · car commuters · car use · car travel', note: 'Đề đo % NGƯỜI đi làm → dùng commuters (the percentage of commuters…). “the percentage of commuting by car” ❌ → “the percentage of commuters travelling by car” ✅.' },
      { act: 'consumption', person: 'consumers', verb: 'consume · use', compound: 'water consumption · water use', note: 'Đề đo LƯỢNG (lít, tấn) → giữ consumption/use; đổi sang consumers là lệch nghĩa.' },
      { act: 'production · output', person: 'producers · manufacturers', verb: 'produce · manufacture', compound: 'coffee production · coffee output · the amount of coffee produced', note: 'Đo lượng → production/output; producers chỉ khi đề đếm số nhà sản xuất.' },
      { act: 'tourism · visits', person: 'tourists · visitors', verb: 'visit · travel to', compound: 'tourist arrivals · visitor numbers', note: 'Đếm người → visitors/tourists; tiền → tourism revenue.' },
      { act: 'unemployment · employment', person: 'the unemployed · employees · workers', verb: 'employ · work', compound: 'the unemployment rate · the employment rate', note: 'Giữ rate/level: “People unemployed rose” ❌ → “The rate of unemployment rose” ✅.' },
      { act: 'spending · expenditure', person: 'consumers · households', verb: 'spend (on)', compound: 'household spending · expenditure on food · money spent on food', note: 'Chỉ khi đơn vị là tiền. Spending ≠ Sales.' },
      { act: 'sales · purchases', person: 'buyers · customers', verb: 'sell · buy', compound: 'car sales · the number of cars sold · car purchases', note: 'Sales (phía bán) ≠ purchases (phía mua). “Cars increased” ❌ → “Car sales increased” ✅.' },
      { act: 'immigration · migration', person: 'immigrants · migrants', verb: 'immigrate · move to', compound: 'immigrant numbers · the number of people moving to …', note: 'Đếm người → immigrants; xu hướng chung → immigration.' },
      { act: 'enrolment · education', person: 'students · learners', verb: 'enrol · study', compound: 'student numbers · enrolment figures', note: 'Đếm người học → students; tỷ lệ nhập học → the enrolment rate.' },
    ],
    techniques: [
      { id: 'ratio', name: 'Đổi từ chỉ tỷ lệ / số lượng', from: 'the percentage of car commuters', to: 'the proportion of car commuters · the share of car commuters · the figure for car commuters', where: 'Body (lần 2)', note: 'percentage ↔ proportion ↔ share ↔ figure for; number of ↔ figure for ↔ N numbers. Không đổi % thành number.' },
      { id: 'reduce', name: 'Rút gọn mệnh đề (Chiêu 2)', from: 'people who commuted by car', to: 'people commuting by car', where: 'Introduction', note: 'who/which + V → V-ing; who/which + be + V3 → V3.' },
      { id: 'form', name: 'Đổi từ loại', from: 'the percentage of people commuting by car', to: 'the percentage of car commuters', where: 'Intro / Body', note: 'Hoạt động (commuting) ↔ người (commuters) ↔ động từ (commute). Chỉ đổi khi vẫn đo đúng thứ đề đo.' },
      { id: 'compound', name: 'Danh từ ghép', from: 'commuters who travelled by car · the use of cars', to: 'car commuters · car use · car travel', where: 'Body', note: 'Gọn, tự nhiên; tránh ghép quá 3 danh từ.' },
      { id: 'verb', name: 'Noun → Verb (Chiêu 1)', from: 'the percentage of car commuters', to: 'what proportion of people commuted by car · how people travelled to work', where: 'Introduction', note: 'The consumption of water → how much water was consumed.' },
      { id: 'nation', name: 'Tính từ quốc gia (Chiêu 3)', from: 'the energy consumption in France', to: 'French energy consumption', where: 'Intro / Body', note: 'The population of Japan → Japanese population / Japan’s population.' },
      { id: 'drop', name: 'Bỏ “the percentage of” (giữ chủ thể)', from: 'The percentage of car commuters accounted for 60%.', to: 'Car commuters accounted for 60% of all commuters.', where: 'Body', note: 'Xem bảng “Bỏ the percentage of được không?”.' },
      { id: 'front', name: 'Đưa số liệu lên đầu', from: 'The percentage of commuters who drove was 60%.', to: '60% of commuters travelled by car. · Around three in five commuters drove to work.', where: 'Body', note: 'Số liệu làm chủ ngữ: [số]% of + N / a quarter of + N.' },
      { id: 'passive', name: 'Bị động', from: '60% of commuters used cars.', to: 'Cars were used by 60% of commuters.', where: 'Body', note: 'Hay dùng với chose / preferred / used.' },
      { id: 'time', name: 'Thời gian làm chủ ngữ', from: 'The percentage of car commuters fell between 2010 and 2020.', to: 'The period between 2010 and 2020 saw a fall in the percentage of car commuters.', where: 'Body', note: 'saw / witnessed / experienced — chủ ngữ là Period/Year/Decade.' },
      { id: 'refer', name: 'Thay thế khi nhắc lại', from: '(chủ thể vừa nói)', to: 'this figure · that of bus users · the former / the latter · the respective figures', where: 'Body', note: 'Tránh lặp danh từ — tăng điểm Coherence.' },
      { id: 'synonym', name: 'Từ đồng nghĩa (không lệch nghĩa)', from: 'commuters', to: 'people travelling to work · car users (chỉ nhóm đi ô tô)', where: 'Body', note: 'Lần 1 dùng từ sát đề; chỉ đổi khi cùng nghĩa.' },
    ],
    mistakes: [
      { wrong: 'Car increased.', right: 'The percentage of car commuters increased.', why: 'Trọc lốc — thiếu danh từ chủ thể.' },
      { wrong: 'The percentage of car commuters accounted for 60%.', right: 'Car commuters accounted for 60% of all commuters.', why: 'Lặp nghĩa: percentage + accounted for %.' },
      { wrong: 'The number of commuting rose.', right: 'The number of commuters rose.', why: 'number of + danh từ đếm được (người / vật), không đi với hoạt động.' },
      { wrong: 'The amount of commuters fell.', right: 'The number of commuters fell.', why: 'amount of chỉ đi với danh từ không đếm được.' },
      { wrong: 'Water consumers rose to 500 litres.', right: 'Water consumption rose to 500 litres.', why: 'Đổi từ loại làm lệch thứ được đo (lít là lượng nước, không phải số người).' },
      { wrong: 'Visitors increased.', right: 'Visitor numbers increased. / The number of visitors increased.', why: 'Giữ nguyên chủ thể gốc (quy tắc của cô).' },
    ],
  };
  const TECH = Object.fromEntries(SUBJECT_GUIDE.techniques.map(t => [t.id, t.name]));

  /* Cách paraphrase CHỦ THỂ theo từng dạng (bám quy tắc của cô: không “trọc lốc”, lần 1 sát đề, lần 2 mới đổi).
   * Mỗi dòng: loại chủ thể · từ trong đề → cách viết khác · lưu ý. */
  const SUBJECT_PP = {
    trend: [
      { kind: 'Chủ thể chính (Introduction)', from: 'the number / percentage of + N + from … to …', to: ['the figure / proportion for + N between … and …', 'how many / what proportion of + N + V-ed over the period'], note: 'Introduction: đổi cả danh từ chỉ số lượng lẫn cụm thời gian.' },
      { kind: 'Từng đường / từng cột', from: 'Car (tên đường trong chú thích)', to: ['the percentage of car commuters', 'the figure for car use', 'car travel'], note: 'Tên đường trong chú thích KHÔNG được đứng một mình làm chủ ngữ.' },
      { kind: 'Chủ ngữ là thời gian', from: 'Car use fell sharply between 2010 and 2020', to: ['The period between 2010 and 2020 saw a sharp fall in car use', 'The next decade witnessed a sharp fall in car use'], note: 'saw / witnessed / experienced: chủ ngữ là Period/Year/Decade, không phải Percentage/Number.' },
      { kind: 'Cụm thời gian', from: 'from 2000 to 2025', to: ['between 2000 and 2025', 'over the 25-year period', 'over a period of 25 years'], note: 'Lần sau trong Body: in the following decade, by the end of the period.' },
    ],
    compare: [
      { kind: 'Chủ thể chính (Introduction)', from: 'the percentage of people who chose X', to: ['the proportion of respondents selecting X', 'how popular X was among people', 'X was chosen by …% of people (bị động)'], note: 'Khảo sát: people → respondents / participants / those surveyed.' },
      { kind: 'Pie chart', from: 'the proportion of X', to: ["X's share", 'the percentage made up by X', 'X accounted for / made up …%'], note: 'accounted for / made up chỉ dùng với % của tổng.' },
      { kind: 'Table / Bar nhiều nước', from: 'spending on X in Japan', to: ['Japanese spending on X', "Japan's expenditure on X", 'the amount of money spent on X in Japan'], note: 'Kinh tế: spending ↔ expenditure ↔ money spent (chỉ khi đơn vị là tiền).' },
      { kind: 'Nhóm tuổi / nhóm người', from: 'people aged 15-24', to: ['the 15–24 age group', 'those in the 15–24 bracket', 'young people aged 15 to 24'], note: 'Không dùng “witness” với Age group.' },
    ],
    maps: [
      { kind: 'Nơi chốn chính', from: 'the village of Stokeford', to: ['Stokeford', 'the settlement', 'the area'], note: 'Lần 1 dùng đúng tên trong đề; town → the town centre / the urban area; island → the island.' },
      { kind: 'Công trình', from: 'houses · shops · park · school', to: ['housing / residential buildings', 'retail outlets / commercial facilities', 'green space / recreational area', 'the educational facility'], note: 'farmland → agricultural land; car park → parking area; road → route / street.' },
      { kind: 'Thay đổi làm chủ ngữ', from: 'A school was built', to: ['The construction of a school', 'A new school was added', 'The area saw the addition of a school'], note: 'Danh từ hoá: the construction / addition / removal / redevelopment of + N.' },
      { kind: 'Hai mốc thời gian', from: 'in 1930 and 2010', to: ['between 1930 and 2010', 'over the 80-year period', 'by 2010 (bản đồ sau)'], note: 'Bản đồ “now / present” → present perfect.' },
    ],
    floorplan: [
      { kind: 'Toà nhà / tầng', from: 'the ground floor of the museum', to: ["the museum's ground floor", 'the ground-floor layout of the museum'], note: 'Lần 1 dùng đúng tên trong đề.' },
      { kind: 'Phòng / khu vực', from: 'rooms · reception · café', to: ['spaces / areas', 'the reception area / front desk', 'the dining / refreshment area'], note: 'Giữ đúng chức năng phòng — không đổi café thành restaurant.' },
      { kind: 'Thay đổi làm chủ ngữ', from: 'The office was converted into a classroom', to: ['The conversion of the office into a classroom', 'The office was transformed into a classroom'], note: 'Tương tự Maps: converted into / replaced by / relocated to.' },
    ],
    process_man: [
      { kind: 'Quy trình chính', from: 'the process of making X', to: ['how X is produced / manufactured', 'the production of X', 'X manufacturing'], note: 'Introduction: đổi cả động từ (make → produce / manufacture).' },
      { kind: 'Nguyên liệu / sản phẩm', from: 'raw materials · the product', to: ['the ingredients / the materials', 'the finished product / the end product'], note: 'Câu Body: nguyên liệu làm chủ ngữ + bị động hiện tại (the clay is shaped…).' },
      { kind: 'Giai đoạn', from: 'stage', to: ['step', 'phase', 'the next stage of the process'], note: 'Overview: “the process consists of X stages, beginning with … and ending with …”.' },
    ],
    process_nat: [
      { kind: 'Vòng đời / chu trình', from: 'the life cycle of the frog', to: ['the stages in the life of a frog', 'how a frog develops', 'the development of the frog'], note: 'Không dùng bị động cho sinh vật tự lớn lên (the egg hatches).' },
      { kind: 'Sinh vật / chủ thể', from: 'the frog', to: ['the amphibian', 'this creature', 'the adult frog / the young frog'], note: 'Chỉ dùng từ đúng loài: frog → amphibian, butterfly → insect.' },
      { kind: 'Chu trình tự nhiên', from: 'the water cycle', to: ['how water circulates', 'the continuous movement of water', 'the cycle'], note: 'Overview: “a cyclical process with X main stages”.' },
    ],
  };
  function subjectBlock(ids) {
    const G2 = SUBJECT_GUIDE;
    const line = x => `- ${x.kind}: ${x.from} → ${x.to.join(' / ')} (${x.note})`;
    return ['HOW TO PARAPHRASE SUBJECTS (Ms. Gigi):',
      'Dropping "the percentage of / the proportion of": ' + G2.drop.rule,
      ...G2.drop.cases.map(c => `- [${c.ok}] ${c.when}: "${c.wrong}" → "${c.right}" (${c.why})`),
      'Word families (activity / person / verb / compound) — change the form only if the task still measures the same thing:',
      ...G2.family.map(f => `- ${f.act} / ${f.person} / ${f.verb} / ${f.compound} (${f.note})`),
      'Techniques (use these ids in "tech"):',
      ...G2.techniques.map(t => `- ${t.id} = ${t.name}: "${t.from}" → "${t.to}" [${t.where}] (${t.note})`),
      'Typical mistakes:', ...G2.mistakes.map(m => `- "${m.wrong}" → "${m.right}" (${m.why})`),
      ...ids.filter(id => SUBJECT_PP[id]).map(id => `For "${id}":\n` + SUBJECT_PP[id].map(line).join('\n')),
    ].join('\n');
  }

  function promptBlock(ids) {
    const parts = ids.map(id => {
      const o = OUTLINES[id];
      const sec = k => `  ${k.toUpperCase()} — ${o[k].rule}\n` + o[k].frames.map((f, n) => `    F${n + 1}. ` + f).join('\n');
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
    if (outline === 'maps' && /\bBy (?:1[89]|20)\d{2},\s*[^.,]*?\b(?<!had )(experienced|underwent|saw|changed|developed)\b/i.test(t)) out.push('Sau “By + năm” dùng quá khứ hoàn thành: By 2010, the area had experienced / had undergone …');
    if (outline === 'maps' && /\b(on|at) the (\w+ )?part\b/i.test(t)) out.push('Có “part” → dùng IN (in the eastern part).');
    if (/\bthe given (chart|graph|diagram|map|table)\b/i.test(t)) out.push('Tránh “the given chart” — gọi đúng tên chủ thể của đề.');
    return out;
  }

  /* Các cụm cố định của khung (phần không nằm trong [..]) để tô màu trong gợi ý */
  function fixedPhrases(outline, step) {
    const o = OUTLINES[outline];
    if (!o) return [];
    const out = [];
    for (let f of o[STEP_KEYS[step]].frames) {
      f = f.replace(/^[^:]{0,40}[À-ỹ][^:]{0,40}:\s*/, '').replace(/\([^)]*[À-ỹ][^)]*\)/g, ' ');
      for (const chunk of f.split(/\[[^\]]*\]|…|\.\.\.|\(|\)|\/\s*|\+/)) {
        const c = chunk.replace(/[.,;:"“”]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (c.split(' ').length >= 2 && !/[À-ỹ]/.test(c)) out.push(c);
      }
    }
    return [...new Set(out)].sort((a, b) => b.length - a.length);
  }

  return { OUTLINES, GENERAL, SUBJECT_PP, SUBJECT_GUIDE, TECH, STEP_KEYS, outlineFor, promptBlock, generalBlock, subjectBlock, lint, fixedPhrases };
})();
