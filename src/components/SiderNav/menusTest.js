const menus = [
  // {
  //   title: '首页',
  //   icon: 'home',
  //   key: '/'
  // },
  {
    title: '物流管理',
    icon: 'rocket',
    key: '/logistics-manage',
    subs: [
      {
        title: '未匹配订单',
        icon: 'file-unknown',
        key: '/logistics-manage/unmatched'
      },
      {
        title: '已匹配订单',
        icon: 'file-done',
        key: '/logistics-manage/matched'
      },
      {
        title: '预约信息',
        icon: 'solution',
        key: '/logistics-manage/appointment-info',
      },
    ]
  },
  {
    title: '返点管理',
    icon: 'pay-circle',
    key: '/rebate-manage',
    subs: [
      {
        title: '待审核',
        icon: 'file-unknown',
        key: '/rebate-manage/awaiting-examine',
      },
      {
        title: '通过-未返款',
        icon: 'meh',
        key: '/rebate-manage/adopt-examine-unpaid',
      },
      {
        title: '通过-已返款',
        icon: 'smile',
        key: '/rebate-manage/adopt-examine-paid',
      },
      {
        title: '驳回',
        icon: 'frown',
        key: '/rebate-manage/reject-examine',
      },
    ]
  },
  // {
  //   title: '关于',
  //   icon: 'info-circle-o',
  //   key: '/about'
  // }
]

export default menus;