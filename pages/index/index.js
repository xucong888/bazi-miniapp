Page({
  data: {
    birthInfo: {
      name: '',
      gender: 'male',
      calendarType: 'solar',
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0
    },
    years: [],
    months: [],
    days: [],
    hours: [],
    yearIndex: 30,
    monthIndex: 0,
    dayIndex: 0,
    hourIndex: 12,
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

  onNameInput(e) {
    this.setData({ 'birthInfo.name': e.detail.value })
  },

  onGenderChange(e) {
    this.setData({ 'birthInfo.gender': e.detail.value })
  },

  onCalendarChange(e) {
    this.setData({ 'birthInfo.calendarType': e.detail.value })
  },

  onYearChange(e) {
    const index = e.detail.value
    this.setData({
      yearIndex: index,
      'birthInfo.year': 1900 + index
    })
  },

  onMonthChange(e) {
    const index = e.detail.value
    this.setData({
      monthIndex: index,
      'birthInfo.month': index + 1
    })
    this.updateDays()
  },

  onDayChange(e) {
    const index = e.detail.value
    this.setData({
      dayIndex: index,
      'birthInfo.day': index + 1
    })
  },

  onHourChange(e) {
    const index = e.detail.value
    this.setData({
      hourIndex: index,
      'birthInfo.hour': index
    })
  },

  updateDays() {
    const { birthInfo } = this.data
    const daysInMonth = new Date(birthInfo.year, birthInfo.month, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) days.push(i + '日')
    this.setData({ days })
  },

  async calculateFate() {
    const { birthInfo } = this.data
    
    if (!birthInfo.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    
    this.setData({ loading: true })
    
    try {
      // 调用云函数计算八字
      const baziResult = await wx.cloud.callFunction({
        name: 'fateEngine',
        data: { type: 'bazi', data: birthInfo }
      })
      
      // 调用云函数计算紫微
      const ziweiResult = await wx.cloud.callFunction({
        name: 'fateEngine',
        data: { type: 'ziwei', data: birthInfo }
      })
      
      // 调用云函数计算西方占星
      const westernResult = await wx.cloud.callFunction({
        name: 'fateEngine',
        data: { type: 'western', data: birthInfo }
      })
      
      if (baziResult.result.success) {
        const resultData = {
          bazi: baziResult.result.data,
          ziwei: ziweiResult.result.data,
          western: westernResult.result.data,
          birthInfo
        }
        
        wx.setStorageSync('currentResult', resultData)
        
        wx.navigateTo({
          url: '/pages/result/result'
        })
      } else {
        wx.showToast({ title: baziResult.result.message || '排盘失败', icon: 'none' })
      }
    } catch (error) {
      console.error('排盘错误:', error)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})