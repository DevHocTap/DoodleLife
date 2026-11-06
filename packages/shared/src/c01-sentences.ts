/**
 * 20 câu nhật ký mẫu tiếng Việt cho thử nghiệm C01.
 * Nguồn: ~/workspace/doodlelife/c01-experiment-plan.md
 * Dùng chung cho harness apps/api/scripts/c01-experiment.ts
 * và cho test prompt C02 (kiểm tra với 20 câu mẫu).
 *
 * Bản dịch tiếng Anh (C01_SENTENCES_EN) dịch ý đúng thứ tự 20 câu trên,
 * dùng cho provider diffusion như Cloudflare FLUX vốn bám prompt tiếng
 * Anh tốt nhất. Trong luồng sản phẩm (C03/C05), nhật ký tiếng Việt cần
 * bước dịch Việt → Anh trước khi gọi Cloudflare — bước này chưa có trong
 * Sprint 1, xem ghi chú trong docs/c01-report.md.
 */
export const C01_SENTENCES: string[] = [
  'Sáng nay tôi đạp xe qua cầu, gió mát, lòng nhẹ nhõm như vừa trút được gánh nặng.',
  'Mẹ nấu bát phở gà nóng hổi, khói bay lên, cả nhà quây quần bên bàn ăn nhỏ.',
  'Tôi ngồi bên cửa sổ quán cà phê, mưa lất phất ngoài phố, tay ôm cốc sữa nóng.',
  'Chiều tan làm, tôi ghé chợ mua bó hoa cúc vàng tặng vợ nhân kỷ niệm ngày cưới.',
  'Con mèo cam cuộn tròn ngủ trên ghế sofa, nắng chiều rọi qua rèm cửa.',
  'Tôi leo lên đồi ngắm bình minh, biển mây trôi dưới chân, tim đập rộn ràng.',
  'Buổi họp nhóm căng thẳng, ai cũng mệt, nhưng cuối cùng chúng tôi bật cười vì một câu đùa.',
  'Tôi viết nhật ký dưới ánh đèn vàng, ngoài kia tiếng ve kêu râm ran mùa hè.',
  'Em bé tập đi những bước đầu tiên, bố mẹ dang tay đón, cả nhà reo lên vui sướng.',
  'Tôi đi chợ hoa Tết, đào hồng, mai vàng, người đông mà lòng thấy náo nức.',
  'Trận bóng chiều nay thua sát nút, tôi buồn một lúc rồi rủ bạn đi ăn bánh mì.',
  'Tôi học bài khuya, đèn bàn sáng, chồng sách cao, nhưng quyết không bỏ cuộc.',
  'Ngày đầu đi làm, tôi hồi hộp bước vào văn phòng mới, đồng nghiệp cười chào thân thiện.',
  'Tôi và bạn thân đạp xe dọc bờ sông, hoàng hôn đỏ rực, gió thổi mát rượi.',
  'Bữa tối đơn giản chỉ có trứng chiên và canh rau, nhưng ăn cùng người thương nên ngon lạ.',
  'Tôi bị cảm, nằm co ro trong chăn, mẹ mang cháo hành nóng lên tận phòng.',
  'Tôi ngắm pháo hoa đêm giao thừa, lòng mong năm mới bình an cho cả nhà.',
  'Sáng chủ nhật tôi tưới cây ngoài ban công, chim hót, cà phê còn bốc khói.',
  'Tôi lạc đường ở phố cổ, vừa lo vừa thích thú vì vô tình thấy một tiệm sách cũ rất đẹp.',
  'Tôi hoàn thành bài tập lớn sau nhiều đêm thức trắng, thở phào và mỉm cười một mình.',
];

/** Bản dịch ý sang tiếng Anh của 20 câu trên, cùng thứ tự (cho Cloudflare FLUX). */
export const C01_SENTENCES_EN: string[] = [
  'This morning I rode my bike across the bridge, the cool breeze on my face, my heart feeling light as if a heavy burden had just lifted.',
  'Mom cooked a steaming bowl of chicken pho, the aroma rising as the whole family gathered around the small dinner table.',
  'I sat by the window of a coffee shop, light rain falling outside, my hands wrapped around a warm glass of milk.',
  'After work, I stopped by the market to buy a bouquet of yellow chrysanthemums for my wife on our wedding anniversary.',
  'The orange cat curled up asleep on the sofa, afternoon sunlight streaming through the curtains.',
  'I climbed a hill to watch the sunrise, a sea of clouds drifting below my feet, my heart beating fast with excitement.',
  'The team meeting was tense and everyone was exhausted, but in the end we all burst out laughing at a joke.',
  'I wrote in my journal under a warm yellow lamp, cicadas buzzing outside in the summer night.',
  'The baby took her first steps, her parents opening their arms to catch her as the whole family cheered with joy.',
  'I went to the Tet flower market, pink peach blossoms and yellow apricot flowers everywhere, the crowd buzzing with excitement.',
  "We lost today's football match by a narrow margin; I felt sad for a while, then invited a friend out for banh mi.",
  'I studied late into the night, the desk lamp glowing, a tall stack of books beside me, but I refused to give up.',
  'On my first day at work, I nervously stepped into the new office, my colleagues greeting me with friendly smiles.',
  'My best friend and I rode our bikes along the riverbank, the sunset blazing red, the breeze cool and refreshing.',
  'Dinner was simple, just fried eggs and vegetable soup, but eating it with the one I love made it taste wonderful.',
  'I caught a cold and lay shivering under the blanket while Mom brought hot scallion porridge up to my room.',
  "I watched the fireworks on New Year's Eve, wishing for a peaceful new year for the whole family.",
  'On Sunday morning I watered the plants on the balcony, birds singing, my coffee still steaming.',
  'I got lost in the old quarter, a little worried but delighted when I stumbled upon a beautiful old bookshop.',
  'I finished my big assignment after many sleepless nights, breathing a sigh of relief and smiling to myself.',
];
