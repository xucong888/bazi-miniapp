Page({
  data: {
    birthInfo: {
      name: '徐聪',
      gender: 'male',
      calendarType: 'solar',
      isLeap: false,
      year: 1996,
      month: 5,
      day: 8,
      hour: 8,
      minute: 30
    },
    mbti: {
      energy: 'I',
      perception: 'N',
      judgment: 'F',
      lifestyle: 'P'
    },
    selectedSystems: ['bazi', 'ziwei'],
    showMbti: false,
    years: [],
    months: [],
    days: [],
    hours: [],
    yearIndex: 96,
    monthIndex: 4,
    dayIndex: 7,
    hourIndex: 8,
    loading: false
  },

  onLoad() {
    this.initDateData()
  },

  initDateData() {
    const years = []
    const months = []
    const days = []
    const hours = []
    
    for (let i = 1900; i <= 2025; i++) years.push(i + '年')
    for (let i = 1; i <= 12; i++) months.push(i + '月')
    for (let i = 1; i <= 31; i++) days.push(i + '日')
    for (let i = 0; i <= 23; i++) hours.push(i + '时')
    
    this.setData({ years, months, days, hours })
  },

  // 姓名输入
  onNameInput(e) {
    this.setData({ 'birthInfo.name': e.detail.value })
  },

  // 性别选择
  onGenderChange(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ 'birthInfo.gender': value })
  },

  // 历法选择
  onCalendarChange(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ 'birthInfo.calendarType': value })
  },

  // 年份选择
  onYearChange(e) {
    const index = e.detail.value
    this.setData({
      yearIndex: index,
      'birthInfo.year': 1900 + index
    })
  },

  // 月份选择
  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      monthIndex: index,
      'birthInfo.month': index + 1
    })
    this.updateDays()
  },

  // 日期选择
  onDayChange(e) {
    const index = e.detail.value
    this.setData({
      dayIndex: index,
      'birthInfo.day': index + 1
    })
  },

  // 时辰选择
  onHourChange(e) {
    const index = e.detail.value
    this.setData({
      hourIndex: index,
      'birthInfo.hour': index
    })
  },

  // 更新日期天数
  updateDays() {
    const { birthInfo } = this.data
    const daysInMonth = new Date(birthInfo.year, birthInfo.month, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) days.push(i + '日')
    this.setData({ days })
  },

  // 切换 MBTI 显示
  toggleMbti() {
    this.setData({ showMbti: !this.data.showMbti })
  },

  // MBTI 维度选择
  onMbtiChange(e) {
    const { dimension, value } = e.currentTarget.dataset
    this.setData({ [`mbti.${dimension}`]: value })
  },

  // 体系选择
  onSystemChange(e) {
    const system = e.currentTarget.dataset.system
    const { selectedSystems } = this.data
    
    if (selectedSystems.includes(system)) {
      this.setData({
        selectedSystems: selectedSystems.filter(s => s !== system)
      })
    } else {
      this.setData({
        selectedSystems: [...selectedSystems, system]
      })
    }
  },

  // 开始排盘
  async calculateFate() {
    const { birthInfo, mbti, showMbti, selectedSystems } = this.data
    
    if (!birthInfo.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    if (selectedSystems.length === 0) {
      wx.showToast({ title: '请至少选择一个测算体系', icon: 'none' })
      return
    }
    
    this.setData({ loading: true })
    
    try {
      // 调用云函数计算所有体系
      const result = await wx.cloud.callFunction({
        name: 'fateEngine',
        data: {
          type: 'all',
          data: {
            birthInfo,
            mbti: showMbti ? mbti : null
          }
        }
      })
      
      if (result.result.success) {
        // 保存结果
        wx.setStorageSync('currentResult', result.result.data)
        wx.setStorageSync('selectedSystems', selectedSystems)
        
        // 跳转到结果页
        wx.navigateTo({
          url: '/pages/result/result'
        })
      } else {
        wx.showToast({
          title: result.result.message || '排盘失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('排盘错误:', error)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})