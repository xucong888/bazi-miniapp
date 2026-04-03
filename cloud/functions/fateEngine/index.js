// 云函数入口文件 - 完整版八字紫微计算引擎
const cloud = require('wx-server-sdk')

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 动态导入 TypeScript 编译后的模块
// 注意：实际部署前需要将 fateEngine.ts 编译为 JavaScript
// 或者使用 ts-node 直接运行

// 临时方案：直接在云函数中实现核心逻辑
// 由于 fateEngine.ts 依赖浏览器/DOM API，需要适配

const { Lunar, Solar, LunarUtil } = require('lunar-javascript')
const { astro } = require('iztro')
const Astronomy = require('astronomy-engine')

// ============ 完整数据定义 ============

// 天干
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 天干五行
const GAN_ELEMENT = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}

// 地支藏干权重
const ZHI_HIDE_GAN_WEIGHT = {
  '子': [{ gan: '癸', weight: 1.0 }],
  '丑': [{ gan: '己', weight: 0.6 }, { gan: '癸', weight: 0.3 }, { gan: '辛', weight: 0.1 }],
  '寅': [{ gan: '甲', weight: 0.6 }, { gan: '丙', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '卯': [{ gan: '乙', weight: 1.0 }],
  '辰': [{ gan: '戊', weight: 0.6 }, { gan: '乙', weight: 0.3 }, { gan: '癸', weight: 0.1 }],
  '巳': [{ gan: '丙', weight: 0.6 }, { gan: '庚', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '午': [{ gan: '丁', weight: 0.7 }, { gan: '己', weight: 0.3 }],
  '未': [{ gan: '己', weight: 0.6 }, { gan: '丁', weight: 0.3 }, { gan: '乙', weight: 0.1 }],
  '申': [{ gan: '庚', weight: 0.6 }, { gan: '壬', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '酉': [{ gan: '辛', weight: 1.0 }],
  '戌': [{ gan: '戊', weight: 0.6 }, { gan: '辛', weight: 0.3 }, { gan: '丁', weight: 0.1 }],
  '亥': [{ gan: '壬', weight: 0.7 }, { gan: '甲', weight: 0.3 }]
}

// 十神关系
const SHI_SHEN = {
  '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
  '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
  '丙': { '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官', '甲': '偏印', '乙': '正印' },
  '丁': { '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀', '甲': '正印', '乙': '偏印' },
  '戊': { '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财', '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印' },
  '己': { '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财', '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印' },
  '庚': { '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官', '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印' },
  '辛': { '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神', '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印' },
  '壬': { '壬': '比肩', '癸': '劫财', '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印' },
  '癸': { '壬': '劫财', '癸': '比肩', '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印' }
}

// 日主描述
const DAY_MASTER_DESC = {
  '甲': { element: '阳木', description: '如参天大树 - 刚直不阿、志向高远、仁慈正直' },
  '乙': { element: '阴木', description: '如柔韧花草 - 灵活变通、温柔委婉、适应力强' },
  '丙': { element: '阳火', description: '如炽热太阳 - 热情开朗、光明磊落、急躁好胜' },
  '丁': { element: '阴火', description: '如烛火灯光 - 内敛细腻、温文尔雅、富有同情心' },
  '戊': { element: '阳土', description: '如厚重高山 - 稳重诚信、包容力强、固执保守' },
  '己': { element: '阴土', description: '如田园沃土 - 柔顺和谐、多才多艺、疑心较重' },
  '庚': { element: '阳金', description: '如刚硬刀剑 - 刚毅果断、讲究义气、好胜心强' },
  '辛': { element: '阴金', description: '如名贵珠宝 - 秀气灵动、自尊心强、追求完美' },
  '壬': { element: '阳水', description: '如奔腾江河 - 聪明机智、大气磅礴、随性而为' },
  '癸': { element: '阴水', description: '如绵绵细雨 - 阴柔灵动、富有幻想、耐力十足' }
}

// ============ 神煞计算（完整版）============
function getShenSha(dayGan, yearZhi, dayZhi, zhi) {
  const shensha = []
  
  // 天乙贵人
  const tianYi = {
    '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
    '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'],
    '壬': ['卯', '巳'], '癸': ['卯', '巳'],
    '辛': ['午', '寅']
  }
  if (tianYi[dayGan]?.includes(zhi)) shensha.push('天乙贵人')

  // 太极贵人
  const taiJi = {
    '甲': ['子', '午'], '乙': ['子', '午'],
    '丙': ['卯', '酉'], '丁': ['卯', '酉'],
    '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'],
    '庚': ['寅', '亥'], '辛': ['寅', '亥'],
    '壬': ['巳', '申'], '癸': ['巳', '申']
  }
  if (taiJi[dayGan]?.includes(zhi)) shensha.push('太极贵人')

  // 文昌贵人
  const wenChang = { '甲': '巳', '乙': '午', '丙': '申', '戊': '申', '丁': '酉', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯' }
  if (wenChang[dayGan] === zhi) shensha.push('文昌贵人')

  // 禄神
  const luShen = { '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' }
  if (luShen[dayGan] === zhi) shensha.push('禄神')

  // 羊刃
  const yangRen = { '甲': '卯', '乙': '辰', '丙': '午', '戊': '午', '丁': '未', '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑' }
  if (yangRen[dayGan] === zhi) shensha.push('羊刃')

  // 驿马
  const yiMa = { '申': '寅', '子': '寅', '辰': '寅', '寅': '申', '午': '申', '戌': '申', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳' }
  if (yiMa[yearZhi] === zhi || yiMa[dayZhi] === zhi) shensha.push('驿马')

  // 桃花
  const taoHua = { '申': '酉', '子': '酉', '辰': '酉', '寅': '卯', '午': '卯', '戌': '卯', '巳': '午', '酉': '午', '丑': '午', '亥': '子', '卯': '子', '未': '子' }
  if (taoHua[yearZhi] === zhi || taoHua[dayZhi] === zhi) shensha.push('桃花')

  // 华盖
  const huaGai = { '申': '辰', '子': '辰', '辰': '辰', '寅': '戌', '午': '戌', '戌': '戌', '巳': '丑', '酉': '丑', '丑': '丑', '亥': '未', '卯': '未', '未': '未' }
  if (huaGai[yearZhi] === zhi || huaGai[dayZhi] === zhi) shensha.push('华盖')

  // 将星
  const jiangXing = { '申': '子', '子': '子', '辰': '子', '寅': '午', '午': '午', '戌': '午', '巳': '酉', '酉': '酉', '丑': '酉', '亥': '卯', '卯': '卯', '未': '卯' }
  if (jiangXing[yearZhi] === zhi || jiangXing[dayZhi] === zhi) shensha.push('将星')

  // 劫煞
  const jieSha = { '申': '巳', '子': '巳', '辰': '巳', '寅': '亥', '午': '亥', '戌': '亥', '巳': '寅', '酉': '寅', '丑': '寅', '亥': '申', '卯': '申', '未': '申' }
  if (jieSha[yearZhi] === zhi || jieSha[dayZhi] === zhi) shensha.push('劫煞')

  // 亡神
  const wangShen = { '申': '亥', '子': '亥', '辰': '亥', '寅': '巳', '午': '巳', '戌': '巳', '巳': '申', '酉': '申', '丑': '申', '亥': '寅', '卯': '寅', '未': '寅' }
  if (wangShen[yearZhi] === zhi || wangShen[dayZhi] === zhi) shensha.push('亡神')

  // 金舆
  const jinYu = { '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未', '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅' }
  if (jinYu[dayGan] === zhi) shensha.push('金舆')

  // 红鸾
  const hongLuan = { '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌', '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰' }
  if (hongLuan[yearZhi] === zhi) shensha.push('红鸾')

  // 天喜
  const tianXi = { '子': '酉', '丑': '申', '寅': '未', '卯': '午', '辰': '巳', '巳': '辰', '午': '卯', '未': '寅', '申': '丑', '酉': '子', '戌': '亥', '亥': '戌' }
  if (tianXi[yearZhi] === zhi) shensha.push('天喜')

  // 天德贵人
  const tianDe = { '子': '巳', '丑': '庚', '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '甲', '未': '癸', '申': '寅', '酉': '丙', '戌': '乙', '亥': '巳' }
  if (tianDe[yearZhi] === zhi || tianDe[yearZhi] === dayGan) shensha.push('天德贵人')

  // 月德贵人
  const yueDe = { '寅': '丙', '午': '丙', '戌': '丙', '申': '壬', '子': '壬', '辰': '壬', '巳': '庚', '酉': '庚', '丑': '庚', '亥': '甲', '卯': '甲', '未': '甲' }
  if (yueDe[yearZhi] === zhi || yueDe[yearZhi] === dayGan) shensha.push('月德贵人')

  return [...new Set(shensha)]
}

// ============ 五行计算 ============
function getElement(char) {
  if ('甲乙寅卯'.includes(char)) return '木'
  if ('丙丁巳午'.includes(char)) return '火'
  if ('戊己辰戌丑未'.includes(char)) return '土'
  if ('庚辛申酉'.includes(char)) return '金'
  if ('壬癸亥子'.includes(char)) return '水'
  return ''
}

function calculateFiveElements(eightChar) {
  const elements = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  
  // 天干计分
  const gans = [eightChar.getYearGan(), eightChar.getMonthGan(), eightChar.getDayGan(), eightChar.getTimeGan()]
  gans.forEach(gan => {
    elements[GAN_ELEMENT[gan]] += 1.0
  })
  
  // 地支藏干计分（月令1.5倍权重）
  const zhis = [
    { zhi: eightChar.getYearZhi(), position: 'year' },
    { zhi: eightChar.getMonthZhi(), position: 'month' },
    { zhi: eightChar.getDayZhi(), position: 'day' },
    { zhi: eightChar.getTimeZhi(), position: 'time' }
  ]
  
  zhis.forEach(({ zhi, position }) => {
    const positionMultiplier = position === 'month' ? 1.5 : 1.0
    const hideGans = ZHI_HIDE_GAN_WEIGHT[zhi] || []
    hideGans.forEach(({ gan, weight }) => {
      const el = GAN_ELEMENT[gan]
      if (el) elements[el] += weight * positionMultiplier
    })
  })
  
  // 计算百分比
  const total = Object.values(elements).reduce((a, b) => a + b, 0)
  const result = {}
  
  Object.entries(elements).forEach(([el, val]) => {
    const percentage = total > 0 ? (val / total) * 100 : 0
    let strength = '中庸'
    if (percentage === 0) strength = '极弱'
    else if (percentage < 10) strength = '偏弱'
    else if (percentage < 20) strength = '略弱'
    else if (percentage < 30) strength = '中庸'
    else if (percentage < 40) strength = '略强'
    else strength = '极强'
    
    result[el] = { percentage: Math.round(percentage * 10) / 10, strength, count: Math.round(val * 10) / 10 }
  })
  
  return result
}

// ============ 八字关系计算（完整版）============
function calculateRelations(stems, branches) {
  const relations = []
  
  // 天干五合
  const ganHe = { '甲己': '合土', '乙庚': '合金', '丙辛': '合水', '丁壬': '合木', '戊癸': '合火' }
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const pair = stems[i] + stems[j]
      const revPair = stems[j] + stems[i]
      if (ganHe[pair]) relations.push({ type: '天干五合', description: `${pair}${ganHe[pair]}`, elements: [stems[i], stems[j]] })
      if (ganHe[revPair]) relations.push({ type: '天干五合', description: `${revPair}${ganHe[revPair]}`, elements: [stems[i], stems[j]] })
    }
  }

  // 天干相冲
  const ganChong = ['甲庚', '乙辛', '壬丙', '癸丁']
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const pair = stems[i] + stems[j]
      const revPair = stems[j] + stems[i]
      if (ganChong.includes(pair) || ganChong.includes(revPair)) {
        relations.push({ type: '天干相冲', description: `${stems[i]}${stems[j]}相冲`, elements: [stems[i], stems[j]] })
      }
    }
  }

  // 地支六合
  const zhiHe = { '子丑': '合土', '寅亥': '合木', '卯戌': '合火', '辰酉': '合金', '巳申': '合水', '午未': '合日月' }
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j]
      const revPair = branches[j] + branches[i]
      if (zhiHe[pair]) relations.push({ type: '地支六合', description: `${pair}${zhiHe[pair]}`, elements: [branches[i], branches[j]] })
      if (zhiHe[revPair]) relations.push({ type: '地支六合', description: `${revPair}${zhiHe[revPair]}`, elements: [branches[i], branches[j]] })
    }
  }

  // 地支六冲
  const zhiChong = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j]
      const revPair = branches[j] + branches[i]
      if (zhiChong.includes(pair) || zhiChong.includes(revPair)) {
        relations.push({ type: '地支六冲', description: `${branches[i]}${branches[j]}相冲`, elements: [branches[i], branches[j]] })
      }
    }
  }

  // 地支三合
  const sanHe = [
    { elements: ['申', '子', '辰'], result: '合水局' },
    { elements: ['亥', '卯', '未'], result: '合木局' },
    { elements: ['寅', '午', '戌'], result: '合火局' },
    { elements: ['巳', '酉', '丑'], result: '合金局' }
  ]
  sanHe.forEach(sh => {
    if (sh.elements.every(e => branches.includes(e))) {
      relations.push({ type: '地支三合', description: `${sh.elements.join('')}${sh.result}`, elements: sh.elements })
    }
  })

  // 地支三会
  const sanHui = [
    { elements: ['寅', '卯', '辰'], result: '会木局' },
    { elements: ['巳', '午', '未'], result: '会火局' },
    { elements: ['申', '酉', '戌'], result: '会金局' },
    { elements: ['亥', '子', '丑'], result: '会水局' }
  ]
  sanHui.forEach(sh => {
    if (sh.elements.every(e => branches.includes(e))) {
      relations.push({ type: '地支三会', description: `${sh.elements.join('')}${sh.result}`, elements: sh.elements })
    }
  })

  // 地支相刑
  const xiangXing = [
    { elements: ['寅', '巳', '申'], desc: '无恩之刑' },
    { elements: ['丑', '戌', '未'], desc: '恃势之刑' }
  ]
  xiangXing.forEach(xx => {
    const present = xx.elements.filter(e => branches.includes(e))
    if (present.length >= 2) {
      relations.push({ type: '地支相刑', description: `${present.join('')}${xx.desc}`, elements: present })
    }
  })
  if (branches.includes('子') && branches.includes('卯')) {
    relations.push({ type: '地支相刑', description: '子卯无礼之刑', elements: ['子', '卯'] })
  }
  ['辰', '午', '酉', '亥'].forEach(e => {
    if (branches.filter(b => b === e).length >= 2) {
      relations.push({ type: '地支自刑', description: `${e}${e}自刑`, elements: [e, e] })
    }
  })

  // 地支六害
  const zhiHai = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌']
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j]
      const revPair = branches[j] + branches[i]
      if (zhiHai.includes(pair) || zhiHai.includes(revPair)) {
        relations.push({ type: '地支相害', description: `${branches[i]}${branches[j]}相害(穿)`, elements: [branches[i], branches[j]] })
      }
    }
  }

  // 地支六破
  const zhiPo = ['子酉', '丑辰', '寅亥', '卯午', '巳申', '未戌']
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const pair = branches[i] + branches[j]
      const revPair = branches[j] + branches[i]
      if (zhiPo.includes(pair) || zhiPo.includes(revPair)) {
        relations.push({ type: '地支相破', description: `${branches[i]}${branches[j]}相破`, elements: [branches[i], branches[j]] })
      }
    }
  }

  return Array.from(new Map(relations.map(r => [r.description, r])).values())
}

// 云函数入口
exports.main = async (event, context) => {
  const { type, data } = event
  
  try {
    switch (type) {
      case 'bazi':
        return await calculateBazi(data)
      case 'ziwei':
        return await calculateZiwei(data)
      case 'western':
        return await calculateWestern(data)
      default:
        return { success: false, message: '未知计算类型' }
    }
  } catch (error) {
    console.error('计算错误:', error)
    return { success: false, message: error.message }
  }
}

// 八字计算
async function calculateBazi(birthInfo) {
  const { year, month, day, hour, minute, calendarType, isLeap, gender } = birthInfo
  
  try {
    let lunar
    if (calendarType === 'lunar') {
      lunar = Lunar.fromYmd(year, isLeap ? -month : month, day)
    } else {
      const solar = Solar.fromYmd(year, month, day)
      lunar = solar.getLunar()
    }
    
    // 创建精确时间
    const solarDate = lunar.getSolar()
    const preciseSolar = Solar.fromYmdHms(solarDate.getYear(), solarDate.getMonth(), solarDate.getDay(), hour, minute, 0)
    const preciseLunar = preciseSolar.getLunar()
    const eightChar = preciseLunar.getEightChar()
    eightChar.setSect(2) // 使用子时换日
    
    const dayGan = eightChar.getDayGan()
    const yearZhi = eightChar.getYearZhi()
    const dayZhi = eightChar.getDayZhi()
    const branches = [eightChar.getYearZhi(), eightChar.getMonthZhi(), eightChar.getDayZhi(), eightChar.getTimeZhi()]
    
    // 创建四柱
    const createPillar = (gan, zhi, tenGod, hideGan, hideTenGod, naYin, kongWang) => {
      const hiddenStems = hideGan.map((g, i) => ({ gan: g, tenGod: hideTenGod[i] || '' }))
      
      const ganYinYang = { '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴' }
      const zhiYinYang = { '子': '阳', '丑': '阴', '寅': '阳', '卯': '阴', '辰': '阳', '巳': '阴', '午': '阳', '未': '阴', '申': '阳', '酉': '阴', '戌': '阳', '亥': '阴' }
      
      return {
        gan, ganYinYang: ganYinYang[gan] || '',
        zhi, zhiYinYang: zhiYinYang[zhi] || '',
        tenGod,
        hiddenStems,
        naYin,
        kongWang,
        shenSha: getShenSha(dayGan, yearZhi, dayZhi, zhi)
      }
    }
    
    const pillars = {
      year: createPillar(eightChar.getYearGan(), eightChar.getYearZhi(), eightChar.getYearShiShenGan(),
                         eightChar.getYearHideGan(), eightChar.getYearShiShenZhi(), eightChar.getYearNaYin(), eightChar.getYearXunKong()),
      month: createPillar(eightChar.getMonthGan(), eightChar.getMonthZhi(), eightChar.getMonthShiShenGan(),
                          eightChar.getMonthHideGan(), eightChar.getMonthShiShenZhi(), eightChar.getMonthNaYin(), eightChar.getMonthXunKong()),
      day: createPillar(eightChar.getDayGan(), eightChar.getDayZhi(), '日主',
                        eightChar.getDayHideGan(), eightChar.getDayShiShenZhi(), eightChar.getDayNaYin(), eightChar.getDayXunKong()),
      hour: createPillar(eightChar.getTimeGan(), eightChar.getTimeZhi(), eightChar.getTimeShiShenGan(),
                         eightChar.getTimeHideGan(), eightChar.getTimeShiShenZhi(), eightChar.getTimeNaYin(), eightChar.getTimeXunKong())
    }
    
    // 五行计算
    const fiveElements = calculateFiveElements(eightChar)
    
    // 日主强弱
    const dmElement = getElement(dayGan)
    const supportMap = { '木': ['木', '水'], '火': ['火', '木'], '土': ['土', '火'], '金': ['金', '土'], '水': ['水', '金'] }
    const supports = supportMap[dmElement] || []
    const supportScore = supports.reduce((acc, el) => acc + (fiveElements[el]?.percentage || 0), 0)
    
    const monthZhiElement = getElement(eightChar.getMonthZhi())
    const isDeLing = supports.includes(monthZhiElement)
    const hasRoots = branches.some(b => {
      const hides = ZHI_HIDE_GAN_WEIGHT[b] || []
      return hides.some(({ gan }) => getElement(gan) === dmElement)
    })
    
    let dmStrength = '中庸'
    if (supportScore > 55) dmStrength = (isDeLing || hasRoots) ? '极强' : '偏强'
    else if (supportScore > 40) dmStrength = (isDeLing && hasRoots) ? '偏强' : '中庸'
    else if (supportScore > 20) dmStrength = (isDeLing || hasRoots) ? '中庸' : '偏弱'
    else dmStrength = '极弱'
    
    // 大运
    const yun = eightChar.getYun(gender === 'male' ? 1 : 0)
    const daYunList = yun.getDaYun()
    const daYun = {
      startYear: yun.getStartSolar().getYear(),
      startAge: yun.getStartYear(),
      pillars: daYunList.map(d => ({ age: d.getStartAge(), year: d.getStartYear(), pillar: d.getGanZhi() })).filter(d => d.pillar !== '')
    }
    
    // 关系
    const stems = [eightChar.getYearGan(), eightChar.getMonthGan(), eightChar.getDayGan(), eightChar.getTimeGan()]
    const relations = calculateRelations(stems, branches)
    
    // 喜用神计算
    const shengWo = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }
    const keWo = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' }
    const woKe = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }
    
    let xiYongShen
    if (dmStrength === '极强' || dmStrength === '偏强') {
      xiYongShen = { yongShen: keWo[dmElement], xiShen: woKe[dmElement], jiShen: shengWo[dmElement] }
    } else if (dmStrength === '极弱' || dmStrength === '偏弱') {
      xiYongShen = { yongShen: shengWo[dmElement], xiShen: dmElement, jiShen: keWo[dmElement] }
    } else {
      xiYongShen = { yongShen: shengWo[dmElement], xiShen: dmElement, jiShen: keWo[dmElement] }
    }
    
    // 格局
    const patternMap = {
      '比肩': { name: '建禄格', desc: '月令为日主禄地，身强有力' },
      '劫财': { name: '建禄格', desc: '月令为日主禄地，身强有力' },
      '食神': { name: '食伤格', desc: '月令为食伤，聪明灵巧' },
      '伤官': { name: '食伤格', desc: '月令为食伤，聪明灵巧' },
      '正财': { name: '财格', desc: '月令为财星，重视物质' },
      '偏财': { name: '财格', desc: '月令为财星，重视物质' },
      '正官': { name: '官杀格', desc: '月令为官杀，有领导才能' },
      '七杀': { name: '官杀格', desc: '月令为官杀，有领导才能' },
      '正印': { name: '印格', desc: '月令为印星，学识渊博' },
      '偏印': { name: '印格', desc: '月令为印星，学识渊博' }
    }
    const pattern = patternMap[pillars.month.tenGod] || { name: '普通格', desc: '无明显格局，以五行平衡为主' }
    
    return {
      success: true,
      data: {
        pillars,
        taiYuan: eightChar.getTaiYuan(),
        mingGong: eightChar.getMingGong(),
        shenGong: eightChar.getShenGong(),
        daYun,
        fiveElements,
        dayMaster: {
          ...(DAY_MASTER_DESC[dayGan] || { element: '未知', description: '暂无描述' }),
          strength: dmStrength
        },
        relations,
        xiYongShen,
        pattern,
        birthInfo
      }
    }
  } catch (error) {
    console.error('八字计算错误:', error)
    return { success: false, message: error.message }
  }
}

// 紫微斗数计算
async function calculateZiwei(birthInfo) {
  const { year, month, day, hour, minute, calendarType, isLeap, gender } = birthInfo
  
  try {
    let solarObj, lunarObj
    
    if (calendarType === 'lunar') {
      const baseLunar = Lunar.fromYmd(year, isLeap ? -month : month, day)
      const baseSolar = baseLunar.getSolar()
      solarObj = Solar.fromYmdHms(baseSolar.getYear(), baseSolar.getMonth(), baseSolar.getDay(), hour, minute, 0)
      lunarObj = solarObj.getLunar()
    } else {
      solarObj = Solar.fromYmdHms(year, month, day, hour, minute, 0)
      lunarObj = solarObj.getLunar()
    }
    
    const dateStr = `${solarObj.getYear()}-${String(solarObj.getMonth()).padStart(2, '0')}-${String(solarObj.getDay()).padStart(2, '0')}`
    
    // 时辰索引
    let timeIndex = Math.floor((hour + 1) / 2) % 12
    if (hour === 23) timeIndex = 12
    
    const astrolabe = astro.bySolar(dateStr, timeIndex, gender === 'male' ? '男' : '女', true, 'zh-CN')
    
    const branchToIndex = { '寅': 0, '卯': 1, '辰': 2, '巳': 3, '午': 4, '未': 5, '申': 6, '酉': 7, '戌': 8, '亥': 9, '子': 10, '丑': 11 }
    
    const palaces = astrolabe.palaces.map((p, i, all) => {
      const getPalaceName = (branch) => all.find(pl => pl.earthlyBranch === branch)?.name || ''
      const index = branchToIndex[p.earthlyBranch]
      
      return {
        name: p.name,
        gan: p.heavenlyStem || '',
        zhi: p.earthlyBranch,
        index: index,
        majorStars: p.majorStars.map(s => ({
          name: s.name,
          brightness: s.brightness || '',
          transformation: s.mutagen || ''
        })),
        minorStars: p.minorStars.map(s => ({
          name: s.name,
          brightness: s.brightness || '',
          transformation: s.mutagen || ''
        })),
        adjectiveStars: p.adjectiveStars?.map(s => s.name) || [],
        statusStars: [p.changsheng12, p.boshi12, p.jiangqian12, p.suiqian12].filter(Boolean),
        age: p.ages || [],
        sanFang: [
          getPalaceName(Object.keys(branchToIndex).find(k => branchToIndex[k] === (index + 4) % 12) || ''),
          getPalaceName(Object.keys(branchToIndex).find(k => branchToIndex[k] === (index + 8) % 12) || '')
        ],
        siZheng: getPalaceName(Object.keys(branchToIndex).find(k => branchToIndex[k] === (index + 6) % 12) || '')
      }
    }).sort((a, b) => a.index - b.index)
    
    return {
      success: true,
      data: {
        solarDate: `${solarObj.getYear()}年${solarObj.getMonth()}月${solarObj.getDay()}日`,
        lunarDate: `${lunarObj.getYearInGanZhi()}年 ${lunarObj.getMonthInChinese()}月 ${lunarObj.getDayInChinese()}`,
        hour: astrolabe.time,
        lifeMaster: astrolabe.soul,
        bodyMaster: astrolabe.body,
        zodiac: astrolabe.zodiac,
        palaces
      }
    }
  } catch (error) {
    console.error('紫微斗数计算错误:', error)
    return { success: false, message: error.message }
  }
}

// 西方占星计算
async function calculateWestern(birthInfo) {
  const { year, month, day, hour, minute } = birthInfo
  
  try {
    const date = new Date(year, month - 1, day, hour, minute)
    const time = Astronomy.MakeTime(date)
    
    const bodies = [
      Astronomy.Body.Sun, Astronomy.Body.Moon, Astronomy.Body.Mercury,
      Astronomy.Body.Venus, Astronomy.Body.Mars, Astronomy.Body.Jupiter,
      Astronomy.Body.Saturn, Astronomy.Body.Uranus, Astronomy.Body.Neptune, Astronomy.Body.Pluto
    ]

    const bodyNames = {
      'Sun': '太阳', 'Moon': '月亮', 'Mercury': '水星', 'Venus': '金星', 'Mars': '火星',
      'Jupiter': '木星', 'Saturn': '土星', 'Uranus': '天王星', 'Neptune': '海王星', 'Pluto': '冥王星'
    }

    const planetPositions = bodies.map(body => {
      const geoVector = Astronomy.GeoVector(body, time, true)
      const ecliptic = Astronomy.Ecliptic(geoVector)
      
      return {
        name: bodyNames[body.toString()] || body.toString(),
        longitude: ecliptic.elon,
        latitude: ecliptic.elat
      }
    })

    // 计算相位
    const aspects = []
    const aspectTypes = [
      { name: '合相', angle: 0, orb: 8 },
      { name: '对分相', angle: 180, orb: 8 },
      { name: '三分相', angle: 120, orb: 8 },
      { name: '四分相', angle: 90, orb: 8 },
      { name: '六分相', angle: 60, orb: 6 }
    ]

    for (let i = 0; i < planetPositions.length; i++) {
      for (let j = i + 1; j < planetPositions.length; j++) {
        const p1 = planetPositions[i]
        const p2 = planetPositions[j]
        
        let diff = Math.abs(p1.longitude - p2.longitude)
        if (diff > 180) diff = 360 - diff

        for (const aspect of aspectTypes) {
          if (Math.abs(diff - aspect.angle) <= aspect.orb) {
            aspects.push({
              name: `${p1.name}${aspect.name}${p2.name}`,
              description: `${p1.name}与${p2.name}形成${aspect.name}`
            })
          }
        }
      }
    }

    // 星座判断
    const monthDay = month * 100 + day
    const signs = [
      { name: '摩羯座', start: 1222, end: 119 },
      { name: '水瓶座', start: 120, end: 218 },
      { name: '双鱼座', start: 219, end: 320 },
      { name: '白羊座', start: 321, end: 419 },
      { name: '金牛座', start: 420, end: 520 },
      { name: '双子座', start: 521, end: 621 },
      { name: '巨蟹座', start: 622, end: 722 },
      { name: '狮子座', start: 723, end: 822 },
      { name: '处女座', start: 823, end: 922 },
      { name: '天秤座', start: 923, end: 1023 },
      { name: '天蝎座', start: 1024, end: 1122 },
      { name: '射手座', start: 1123, end: 1221 }
    ]
    
    let sunSign = '摩羯座'
    for (const sign of signs) {
      if (sign.start > sign.end) {
        // 跨年的星座（摩羯座）
        if (monthDay >= sign.start || monthDay <= sign.end) {
          sunSign = sign.name
          break
        }
      } else {
        if (monthDay >= sign.start && monthDay <= sign.end) {
          sunSign = sign.name
          break
        }
      }
    }

    return {
      success: true,
      data: {
        sunSign,
        planetPositions: planetPositions.slice(0, 5), // 只返回主要行星
        aspects: aspects.slice(0, 5) // 只返回主要相位
      }
    }
  } catch (error) {
    console.error('西方占星计算错误:', error)
    return { success: false, message: error.message }
  }
}