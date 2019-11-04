const menus = [
  {
    title: '首页',
    id: 24,
    icon: 'home',
    key: '/',
    components: [
      {name: 'Home', path: '/'}
    ]
  },
  {
    title: '用户管理',
    id: 1,
    icon: 'usergroup-add',
    key: '/users',
    // testType: 'serverTest',
    subs: [
      {
        title: '权限管理',
        id: 15,
        icon: 'lock',
        key: '/users/permissions',
        // 这里请注意, 由于权限管理页面涉及系统开发内容
        // 故该页面永久设置 testType: 'serverTest', 不得更改
        // 否则造成线上错误将难以修正
        testType: 'serverTest',
        components: [
          {name: 'permissions', path: '/users/permissions'}
        ]
      },
      {
        title: '角色管理',
        id: 10,
        icon: 'solution',
        key: '/users/roles',
        // testType: 'serverTest',
        components: [
          {name: 'roles', path: '/users/roles'}
        ]
      },
      {
        title: '账户管理',
        id: 2,
        icon: 'team',
        key: '/users/accounts',
        // testType: 'serverTest',
        components: [
          {name: 'accounts', path: '/users/accounts'}
        ]
      },
    ]
  },
];

export default menus;