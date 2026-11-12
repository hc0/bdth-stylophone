function parse(spec, beat = 0.3) {
  return spec
    .trim()
    .split(/\s+/)
    .map((token) => {
      const [raw, beats] = token.split(":");
      const dur = Number(beats || 1) * beat;
      if (raw === "." || raw === "r") return { note: null, dur };
      return { note: raw, dur };
    });
}

export const DEMO_SONGS = [
  {
    id: "bandao",
    title: "半岛铁盒",
    notes: parse(`
      E4:1 G4:1 A4:2 G4:1 E4:1 D4:2 E4:1 D4:1 C4:2 A3:3
      E4:1 G4:1 A4:2 G4:1 E4:1 D4:2 E4:1 C4:1 D4:2 C4:3
      G4:1 E4:1 G4:1 C5:2 A4:1 G4:1 A4:1 G4:1 E4:1 D4:1.4 E4:3
    `),
  },
  {
    id: "yifuzhiming",
    title: "以父之名（前奏）",
    notes: [
      { note: "D4", dur: 0.345, gap: 0.03 },
      { note: "F4", dur: 0.345, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "A4", dur: 0.69, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "F4", dur: 0.345, gap: 0.03 },
      { note: "D4", dur: 0.69, gap: 0.03 },
      { note: "D4", dur: 0.345, gap: 0.03 },
      { note: "F4", dur: 0.345, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "A4", dur: 0.345, gap: 0.03 },
      { note: "A#4", dur: 0.345, gap: 0.03 },
      { note: "A4", dur: 0.345, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "F4", dur: 0.69, gap: 0.03 },
      { note: "F4", dur: 0.345, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "A4", dur: 0.69, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "F4", dur: 0.345, gap: 0.03 },
      { note: "D4", dur: 0.69, gap: 0.03 },
      { note: "D4", dur: 0.345, gap: 0.03 },
      { note: "F4", dur: 0.345, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "A4", dur: 0.345, gap: 0.03 },
      { note: "A#4", dur: 0.345, gap: 0.03 },
      { note: "A4", dur: 0.345, gap: 0.03 },
      { note: "G4", dur: 0.345, gap: 0.03 },
      { note: "F4", dur: 0.69, gap: 0.03 },
    ],
  },
  {
    id: "qingtian",
    title: "晴天",
    notes: parse(`
      E4:1 G4:1 A4:1 C5:2 B4:1 A4:1 G4:2
      E4:1 G4:1 A4:1 G4:2 E4:1 D4:1 C4:3
      G4:1 A4:1 C5:1 D5:2 C5:1 B4:1 A4:2
      G4:1 A4:1 C5:1 A4:2 G4:1 E4:1 D4:3
    `),
  },
  {
    id: "qilixiang",
    title: "七里香",
    notes: parse(`
      G4:1 E4:1 G4:1 C5:2 A4:1 G4:1 A4:1 G4:1 E4:1 D4:1 E4:2
      G4:1 A4:1 C5:2 A4:1 G4:1 E4:2 G4:1 A4:1 G4:1 E4:1 D4:1 C4:3
    `),
  },
  {
    id: "yequ",
    title: "夜曲",
    notes: parse(`
      A4:1 B4:1 C5:1 D5:1 C5:1 B4:1 A4:1 G4:1 A4:2 E4:3
      E4:1 G4:1 A4:1 G4:1 A4:2 C5:2 A4:1 G4:3
      A4:1 C5:1 B4:1 A4:1 G4:1 A4:2 E4:3
    `),
  },
  {
    id: "jiandanaiai",
    title: "简单爱",
    notes: parse(`
      E4:1 E4:1 G4:1 A4:2 C5:1 A4:1 G4:2
      A4:1 G4:1 E4:1 G4:2 D4:1 E4:1 C4:3
      E4:1 G4:1 A4:1 C5:2 A4:1 G4:1 A4:1 G4:1 E4:3
    `),
  },
  {
    id: "daoxiang",
    title: "稻香",
    notes: parse(`
      E4:1 G4:1 A4:1 G4:1 E4:1 D4:1 C4:1 D4:1 E4:2
      G4:1 A4:1 C5:1 A4:1 G4:1 E4:1 D4:2 C4:3
      C4:1 D4:1 E4:1 G4:2 E4:1 D4:1 C4:1 A3:1 G3:3
    `),
  },
  {
    id: "qinghuaci",
    title: "青花瓷",
    notes: parse(`
      E4:1 G4:1 A4:2 C5:2 A4:1 G4:2
      E4:1 G4:1 D4:1 E4:1 D4:1 C4:3
      A4:1 C5:1 D5:1 C5:1 A4:1 G4:2
      E4:1 G4:1 A4:1 G4:1 E4:1 D4:1 C4:3
    `),
  },
  {
    id: "gaobaibiqiu",
    title: "告白气球",
    notes: parse(`
      G4:1 G4:1 A4:1 G4:1 E4:2
      G4:1 A4:1 C5:2 B4:1 A4:2
      C5:1 B4:1 A4:1 G4:1 A4:2
      G4:1 E4:1 G4:1 A4:1 G4:1 E4:1 D4:1 C4:3
    `),
  },
  {
    id: "secret",
    title: "不能说的秘密",
    notes: parse(`
      C4:1 D4:1 E4:1 G4:2 E4:1 D4:1 C4:1 A3:1 G3:2
      C4:1 D4:1 E4:1 G4:1 A4:2 G4:1 E4:1 D4:1 C4:3
      E4:1 G4:1 A4:1 C5:2 A4:1 G4:1 E4:1 D4:1 C4:3
    `),
  },
  {
    id: "dongfengpo",
    title: "东风破",
    notes: parse(`
      E4:2 G4:1 A4:2 C5:1 A4:1 G4:2 E4:1 D4:3
      G4:1 A4:1 C5:1 A4:1 G4:1 E4:1 D4:2 C4:3
      A4:2 C5:1 D5:2 C5:1 A4:1 G4:2 E4:3
    `),
  },
  {
    id: "anjing",
    title: "安静",
    notes: parse(`
      E4:1 G4:1 A4:1 G4:1 A4:2 C5:2 A4:1 G4:3
      E4:1 G4:1 A4:1 G4:1 E4:1 D4:1 C4:3
      G4:1 A4:1 C5:1 A4:1 G4:1 E4:2 D4:1 C4:3
    `),
  },
  {
    id: "caihong",
    title: "彩虹",
    notes: parse(`
      E4:1 G4:1 A4:1 C5:2 A4:1 G4:1 E4:1 D4:1 E4:3
      G4:1 A4:1 C5:1 A4:1 G4:1 E4:1 D4:2 C4:3
    `),
  },
  {
    id: "mama",
    title: "听妈妈的话",
    notes: parse(`
      G4:1 A4:1 C5:2 A4:1 G4:1 E4:2
      G4:1 A4:1 G4:1 E4:1 D4:1 C4:2
      E4:1 G4:1 A4:1 C5:1 A4:1 G4:2 E4:3
    `),
  },
  {
    id: "kaibuliao",
    title: "开不了口",
    notes: parse(`
      E4:1 G4:1 A4:1 G4:1 A4:2 C5:1 B4:1 A4:1 G4:3
      E4:1 G4:1 A4:1 C5:2 G4:1 A4:1 G4:1 E4:3
    `),
  },
  {
    id: "gejian",
    title: "搁浅",
    notes: parse(`
      A4:1 C5:1 B4:1 A4:1 G4:1 A4:2 E4:2 G4:3
      A4:1 C5:1 D5:1 C5:1 A4:1 G4:2 E4:3
      G4:1 A4:1 C5:1 A4:1 G4:1 E4:1 D4:2 C4:3
    `),
  },
  {
    id: "dengnixiake",
    title: "等你下课",
    notes: parse(`
      E4:1 G4:1 A4:1 G4:1 E4:1 D4:1 C4:1 D4:1 E4:2 G4:1 E4:3
      G4:1 A4:1 C5:1 A4:1 G4:1 E4:1 D4:2 C4:3
    `),
  },
  {
    id: "faruxue",
    title: "发如雪",
    notes: parse(`
      A4:2 C5:2 A4:1 G4:1 E4:2 G4:1 A4:3
      C5:1 D5:1 C5:1 A4:1 G4:2 E4:3
      A4:1 C5:1 A4:1 G4:1 E4:1 D4:1 C4:3
    `),
  },
  {
    id: "yiluxiangbei",
    title: "一路向北",
    notes: parse(`
      G4:1 A4:1 C5:2 A4:1 G4:1 E4:1 D4:1 E4:1 C4:3
      E4:1 G4:1 A4:1 C5:1 A4:1 G4:2 E4:3
    `),
  },
  {
    id: "juhuatai",
    title: "菊花台",
    notes: parse(`
      E4:1 G4:1 A4:1 G4:1 E4:1 D4:1 C4:1 A3:1 G3:3
      E4:1 G4:1 A4:1 C5:2 A4:1 G4:1 E4:1 D4:1 C4:3
    `),
  },
  {
    id: "longjuanfeng",
    title: "龙卷风",
    notes: parse(`
      E4:1 G4:1 A4:1 C5:2 A4:1 G4:1 A4:1 G4:1 E4:3
      G4:1 A4:1 C5:1 D5:1 C5:1 A4:1 G4:2 E4:3
    `),
  },
];

export function getDemoSong(id) {
  return DEMO_SONGS.find((song) => song.id === id) || DEMO_SONGS[0];
}
