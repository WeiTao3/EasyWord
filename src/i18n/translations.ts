export type Language = 'en' | 'zh';

export interface Translations {
  // Tab labels
  tabs: {
    resource: string;
    add: string;
    lists: string;
    review: string;
    settings: string;
  };

  // Common
  common: {
    cancel: string;
    save: string;
    delete: string;
    create: string;
    edit: string;
    done: string;
    upgrade: string;
    words: (n: number) => string;
    lists: (n: number) => string;
  };

  // Calendar months / day labels
  months: string[];
  dayLabels: string[];

  // Add Word Screen
  add: {
    title: string;
    subtitle: string;
    saveToList: string;
    noList: string;
    word: string;
    lookUp: string;
    pronunciation: string;
    meaning: string;
    source: string;
    addWord: string;
    selectDefinition: string;
    useThisDefinition: string;
    newList: string;
    listName: string;
    listNo: string;
    description: string;
    createNewList: string;
    viewLists: string;
    wordRequired: string;
    meaningRequired: string;
    wordFirst: string;
    wordNotFound: string;
    lookupFailed: string;
    listNoRequired: string;
    listNoDuplicate: string;
    wordAdded: (word: string, list: string) => string;
  };

  // Word Lists Screen
  lists: {
    title: string;
    subtitle: (listCount: number, wordCount: number) => string;
    noLists: string;
    createFirst: string;
    newList: string;
    editList: string;
    deleteList: string;
    deleteConfirm: (name: string) => string;
    listNoRequired: string;
    listNoDuplicate: string;
  };

  // Review Screen
  review: {
    title: string;
  };

  // Calendar Day Screen
  calendarDay: {
    listsScheduled: (n: number) => string;
    noListsScheduled: string;
    noListsDesc: string;
    moveToDate: string;
    movingFrom: (name: string, date: string) => string;
    targetDateLabel: string;
    invalidDate: string;
    sameDateError: string;
    movedTo: (date: string) => string;
    move: string;
    removeFromCalendar: string;
    removeConfirm: (name: string) => string;
    removed: (name: string) => string;
    checkHint: string;
  };

  // Record Screen
  record: {
    title: string;
    wordNotFound: string;
    yourRecording: string;
    syncing: string;
    synced: string;
    localOnly: string;
    deleteRecording: string;
    deleteConfirm: string;
    tipsTitle: string;
    tip1: string;
    tip2: string;
    tip3: string;
    tip4: string;
  };

  // List Detail Screen
  listDetail: {
    playAll: string;
    audioCount: (n: number, total: number) => string;
    noWords: string;
    addFromAdd: string;
    editWord: string;
    record: string;
    reRecord: string;
    listNoMissing: string;
    addedToCalendar: (no: string, offsets: string) => string;
    loading: string;
    playing: (word: string) => string;
    word: string;
    pronunciation: string;
    source: string;
    deleteWordTitle: string;
    deleteWordConfirm: (word: string) => string;
    calendarHint: string;
  };

  // Onboarding Carousel
  onboarding: {
    skip: string;
    next: string;
    getStarted: string;
    slides: Array<{ title: string; description: string }>;
  };

  // Auth Screen
  auth: {
    tagline: string;
    signIn: string;
    register: string;
    email: string;
    password: string;
    confirmPassword: string;
    createAccount: string;
    forgotPassword: string;
    continueWithGoogle: string;
    or: string;
    resetPassword: string;
    resetPasswordSubtitle: string;
    sendResetCode: string;
    backToSignIn: string;
    checkEmail: string;
    resetCodeSentTo: (email: string) => string;
    resetCode: string;
    verify: string;
    resendCode: string;
    back: string;
    setNewPassword: string;
    setNewPasswordSubtitle: string;
    newPassword: string;
    confirmNewPassword: string;
    updatePassword: string;
    verificationCodeSentTo: (email: string) => string;
    verificationCode: string;
    emailPasswordRequired: string;
    passwordsDoNotMatch: string;
    emailRequired: string;
    newPasswordRequired: string;
    codeResentTo: (email: string) => string;
  };

  // Feedback / Suggestion
  feedback: {
    title: string;
    thanks: string;
    subtitle: string;
    placeholder: string;
    sendError: string;
    send: string;
  };

  // Home / Resource Screen
  home: {
    title: string;
    noVideos: string;
    noVideosDesc: string;
    transcript: string;
    tapToAdd: string;
    hide: string;
    show: string;
    loadingTranscript: string;
    noTranscript: string;
    addWord: string;
    word: string;
    pronunciation: string;
    lookUpInDictionary: string;
    meaning: string;
    saveToList: string;
    wordAdded: (word: string, list: string) => string;
  };

  // Settings Screen
  settings: {
    title: string;
    language: string;
    statistics: string;
    total: string;
    mastered: string;
    inProgress: string;
    dataManagement: string;
    account: string;
    premiumMember: string;
    freePlan: string;
    unlimitedListsAndWords: string;
    listsUsed: (n: number, limit: number) => string;
    signOut: string;
    deleteAccount: string;
    deleteAccountMessage: string;
    exportAsText: string;
    exportDescription: string;
    dictionaries: string;
    dictionaryHint: string;
    addDictionary: string;
    reviewSchedule: string;
    reviewIntervalPrefix: string;
    reviewIntervalSuffix: (n: number) => string;
    about: string;
    version: string;
    appDescription: string;
    privacyPolicy: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    tabs: {
      resource: 'Resource',
      add: 'Add',
      lists: 'Lists',
      review: 'Review',
      settings: 'Settings',
    },

    common: {
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      create: 'Create',
      edit: 'Edit',
      done: 'Done',
      upgrade: 'Upgrade',
      words: (n) => `${n} word${n !== 1 ? 's' : ''}`,
      lists: (n) => `${n} list${n !== 1 ? 's' : ''}`,
    },

    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

    add: {
      title: 'Add New Word',
      subtitle: 'Expand your vocabulary',
      saveToList: 'Save to list',
      noList: 'No list — create one below',
      word: 'Word',
      lookUp: 'Look Up',
      pronunciation: 'Pronunciation (optional)',
      meaning: 'Meaning',
      source: 'Source (optional)',
      addWord: 'Add Word',
      selectDefinition: 'Select a definition:',
      useThisDefinition: 'Use This Definition',
      newList: 'New List',
      listName: 'List name',
      listNo: 'List No (unique)',
      description: 'Description (optional)',
      createNewList: 'Create new list',
      viewLists: 'View Lists',
      wordRequired: 'Please enter a word',
      meaningRequired: 'Please enter the meaning',
      wordFirst: 'Please enter a word first',
      wordNotFound: 'Word not found in dictionary',
      lookupFailed: 'Lookup failed, please try again',
      listNoRequired: 'List No is required.',
      listNoDuplicate: 'This List No is already in use.',
      wordAdded: (word, list) => `"${word}" added to "${list}"!`,
    },

    lists: {
      title: 'Word Lists',
      subtitle: (listCount, wordCount) =>
        `${listCount} list${listCount !== 1 ? 's' : ''} · ${wordCount} word${wordCount !== 1 ? 's' : ''} total`,
      noLists: 'No lists yet',
      createFirst: 'Tap + to create your first list',
      newList: 'New List',
      editList: 'Edit List',
      deleteList: 'Delete List',
      deleteConfirm: (name) =>
        `Delete "${name}"? Words inside will be moved to the next available list.`,
      listNoRequired: 'List No is required.',
      listNoDuplicate: 'This List No is already in use.',
    },

    review: {
      title: 'Calendar',
    },

    calendarDay: {
      listsScheduled: (n) => `${n} list${n !== 1 ? 's' : ''} scheduled`,
      noListsScheduled: 'No lists scheduled',
      noListsDesc: 'No word lists are assigned to this day.',
      moveToDate: 'Move to Another Date',
      movingFrom: (name, date) => `Moving "${name}" from ${date}`,
      targetDateLabel: 'Target date (YYYY-MM-DD)',
      invalidDate: 'Enter a valid date (YYYY-MM-DD)',
      sameDateError: 'Target date is the same as current date',
      movedTo: (date) => `Moved to ${date}`,
      move: 'Move',
      removeFromCalendar: 'Remove from Calendar',
      removeConfirm: (name) => `Remove "${name}" from all its scheduled review dates?`,
      removed: (name) => `"${name}" removed from calendar`,
      checkHint: 'Check after\nreviewing',
    },

    record: {
      title: 'Record Pronunciation',
      wordNotFound: 'Word not found',
      yourRecording: 'Your Recording',
      syncing: 'Syncing…',
      synced: 'Synced',
      localOnly: 'Local only',
      deleteRecording: 'Delete Recording',
      deleteConfirm: 'Are you sure you want to delete this recording?',
      tipsTitle: 'Tips for Recording',
      tip1: 'Speak clearly and at a natural pace',
      tip2: 'Record in a quiet environment',
      tip3: 'Practice the word before recording',
      tip4: 'Listen back to check pronunciation',
    },

    listDetail: {
      playAll: 'Play All Recordings',
      audioCount: (n, total) => `${n} of ${total} word${total !== 1 ? 's' : ''} have audio`,
      noWords: 'No words yet',
      addFromAdd: 'Add words from the Add tab',
      editWord: 'Edit Word',
      record: 'Record',
      reRecord: 'Re-record',
      listNoMissing: 'This list has no List No. Please add one first.',
      addedToCalendar: (no, offsets) => `#${no} added to calendar (${offsets})`,
      loading: 'Loading…',
      playing: (word) => `Playing: ${word}`,
      word: 'Word',
      pronunciation: 'Pronunciation (optional)',
      source: 'Source (optional)',
      deleteWordTitle: 'Delete Word',
      deleteWordConfirm: (word) => `Are you sure you want to delete "${word}"?`,
      calendarHint: 'All recordings ready — tap to schedule reviews',
    },

    onboarding: {
      skip: 'Skip',
      next: 'Next',
      getStarted: 'Get Started',
      slides: [
        {
          title: 'Step 1 — Extract Word',
          description: 'Pick new words from resources.',
        },
        {
          title: 'Step 2 — Add Word',
          description:
            'Add new words to an organized list with its meaning on the day you encounter it.',
        },
        {
          title: 'Step 3 — Record Word',
          description: 'Practice speaking the word and record it in your own voice.',
        },
        {
          title: 'Step 4 — Review Word',
          description:
            'Review the recording of the words after 1 day, 2 days, 4 days and 7 days.',
        },
      ],
    },

    auth: {
      tagline: 'Build your vocabulary, one word at a time.',
      signIn: 'Sign In',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      createAccount: 'Create Account',
      forgotPassword: 'Forgot password?',
      continueWithGoogle: 'Continue with Google',
      or: 'OR',
      resetPassword: 'Reset Password',
      resetPasswordSubtitle: "Enter your email and we'll send a reset code.",
      sendResetCode: 'Send Reset Code',
      backToSignIn: 'Back to Sign In',
      checkEmail: 'Check your email',
      resetCodeSentTo: (email) => `We sent an 8-digit reset code to ${email}`,
      resetCode: 'Reset code',
      verify: 'Verify',
      resendCode: 'Resend code',
      back: 'Back',
      setNewPassword: 'Set New Password',
      setNewPasswordSubtitle: 'Choose a new password for your account.',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      updatePassword: 'Update Password',
      verificationCodeSentTo: (email) => `We sent an 8-digit code to ${email}`,
      verificationCode: 'Verification code',
      emailPasswordRequired: 'Please enter email and password.',
      passwordsDoNotMatch: 'Passwords do not match.',
      emailRequired: 'Please enter your email.',
      newPasswordRequired: 'Please enter a new password.',
      codeResentTo: (email) => `Code resent to ${email}`,
    },

    feedback: {
      title: 'Send a Suggestion',
      thanks: 'Thanks for your suggestion!',
      subtitle: "Have an idea to improve EasyWord? We'd love to hear it.",
      placeholder: 'Write your suggestion here…',
      sendError: 'Failed to send. Please try again.',
      send: 'Send',
    },

    home: {
      title: 'Resource',
      noVideos: 'No videos yet',
      noVideosDesc: 'Add video IDs to ieltResources.ts to populate this channel.',
      transcript: 'Transcript',
      tapToAdd: 'Tap any word to add it',
      hide: 'Hide',
      show: 'Show',
      loadingTranscript: 'Loading transcript…',
      noTranscript: 'No transcript available for this video.',
      addWord: 'Add Word',
      word: 'Word',
      pronunciation: 'Pronunciation',
      lookUpInDictionary: 'Look Up in Dictionary',
      meaning: 'Meaning',
      saveToList: 'Save to list',
      wordAdded: (word, list) => `"${word}" added to "${list}"`,
    },

    settings: {
      title: 'Settings',
      language: 'Language',
      statistics: 'Statistics',
      total: 'Total',
      mastered: 'Mastered',
      inProgress: 'In Progress',
      dataManagement: 'Data Management',
      account: 'Account',
      premiumMember: 'Premium Member',
      freePlan: 'Free Plan',
      unlimitedListsAndWords: 'Unlimited lists and words',
      listsUsed: (n, limit) => `${n}/${limit} lists used`,
      signOut: 'Sign Out',
      deleteAccount: 'Delete Account',
      deleteAccountMessage:
        'This will permanently delete your account and all data — words, lists, and review history. This cannot be undone.',
      exportAsText: 'Export as Text',
      exportDescription: 'Word + translation, readable .txt file',
      dictionaries: 'Dictionaries',
      dictionaryHint: 'Active dictionary is used for word lookup. Tap to switch.',
      addDictionary: 'Add Dictionary',
      reviewSchedule: 'Review Schedule',
      reviewIntervalPrefix: 'Words are reviewed at intervals of:',
      reviewIntervalSuffix: (n) =>
        `After ${n} successful review${n !== 1 ? 's' : ''}, a word is marked as mastered.`,
      about: 'About',
      version: 'Version 1.0.0',
      appDescription:
        'A vocabulary memorization app using spaced repetition to help you remember words from your reading and listening materials.',
      privacyPolicy: 'Privacy Policy',
    },
  },

  zh: {
    tabs: {
      resource: '资源',
      add: '添加',
      lists: '列表',
      review: '复习',
      settings: '设置',
    },

    common: {
      cancel: '取消',
      save: '保存',
      delete: '删除',
      create: '创建',
      edit: '编辑',
      done: '完成',
      upgrade: '升级',
      words: (n) => `${n} 个单词`,
      lists: (n) => `${n} 个列表`,
    },

    months: [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月',
    ],
    dayLabels: ['日', '一', '二', '三', '四', '五', '六'],

    add: {
      title: '添加新单词',
      subtitle: '扩展你的词汇量',
      saveToList: '保存到列表',
      noList: '无列表 — 请在下方创建',
      word: '单词',
      lookUp: '查词',
      pronunciation: '发音（可选）',
      meaning: '释义',
      source: '来源（可选）',
      addWord: '添加单词',
      selectDefinition: '选择一个定义：',
      useThisDefinition: '使用此定义',
      newList: '新建列表',
      listName: '列表名称',
      listNo: '列表编号（唯一）',
      description: '描述（可选）',
      createNewList: '创建新列表',
      viewLists: '查看列表',
      wordRequired: '请输入单词',
      meaningRequired: '请输入释义',
      wordFirst: '请先输入单词',
      wordNotFound: '字典中未找到该单词',
      lookupFailed: '查找失败，请重试',
      listNoRequired: '列表编号为必填项。',
      listNoDuplicate: '此列表编号已被使用。',
      wordAdded: (word, list) => `已将"${word}"添加到"${list}"！`,
    },

    lists: {
      title: '单词列表',
      subtitle: (listCount, wordCount) =>
        `${listCount} 个列表 · 共 ${wordCount} 个单词`,
      noLists: '暂无列表',
      createFirst: '点击 + 创建您的第一个列表',
      newList: '新建列表',
      editList: '编辑列表',
      deleteList: '删除列表',
      deleteConfirm: (name) =>
        `删除"${name}"？其中的单词将移至下一个可用列表。`,
      listNoRequired: '列表编号为必填项。',
      listNoDuplicate: '此列表编号已被使用。',
    },

    review: {
      title: '日历',
    },

    calendarDay: {
      listsScheduled: (n) => `${n} 个列表已计划`,
      noListsScheduled: '无列表安排',
      noListsDesc: '今天没有分配任何单词列表。',
      moveToDate: '移至其他日期',
      movingFrom: (name, date) => `将"${name}"从 ${date} 移动`,
      targetDateLabel: '目标日期（YYYY-MM-DD）',
      invalidDate: '请输入有效日期（YYYY-MM-DD）',
      sameDateError: '目标日期与当前日期相同',
      movedTo: (date) => `已移至 ${date}`,
      move: '移动',
      removeFromCalendar: '从日历中移除',
      removeConfirm: (name) => `将"${name}"从所有已安排的复习日期中移除？`,
      removed: (name) => `"${name}"已从日历中移除`,
      checkHint: '复习后\n打勾',
    },

    record: {
      title: '录制发音',
      wordNotFound: '未找到单词',
      yourRecording: '您的录音',
      syncing: '同步中…',
      synced: '已同步',
      localOnly: '仅本地',
      deleteRecording: '删除录音',
      deleteConfirm: '您确定要删除此录音吗？',
      tipsTitle: '录制技巧',
      tip1: '清晰、自然地说话',
      tip2: '在安静的环境中录制',
      tip3: '录制前先练习单词',
      tip4: '回听以检查发音',
    },

    listDetail: {
      playAll: '播放所有录音',
      audioCount: (n, total) => `${n}/${total} 个单词有录音`,
      noWords: '暂无单词',
      addFromAdd: '从"添加"标签页添加单词',
      editWord: '编辑单词',
      record: '录音',
      reRecord: '重新录音',
      listNoMissing: '此列表没有列表编号，请先添加。',
      addedToCalendar: (no, offsets) => `#${no} 已添加到日历（${offsets}）`,
      loading: '加载中…',
      playing: (word) => `正在播放：${word}`,
      word: '单词',
      pronunciation: '发音（可选）',
      source: '来源（可选）',
      deleteWordTitle: '删除单词',
      deleteWordConfirm: (word) => `您确定要删除"${word}"吗？`,
      calendarHint: '录音已全部完成 — 点击安排复习计划',
    },

    onboarding: {
      skip: '跳过',
      next: '下一步',
      getStarted: '开始使用',
      slides: [
        {
          title: '第一步 — 提取生词',
          description: '从资源材料中挑选新单词。',
        },
        {
          title: '第二步 — 添加单词',
          description: '在遇到生词的当天，将新单词连同释义整理到有序的词汇表中。',
        },
        {
          title: '第三步 — 录制单词',
          description: '练习朗读单词，并用自己的声音录制下来。',
        },
        {
          title: '第四步 — 复习单词',
          description: '在第 1、2、4、7 天分别回听单词的录音进行复习。',
        },
      ],
    },

    auth: {
      tagline: '一次一个单词，构建你的词汇量。',
      signIn: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      createAccount: '创建账户',
      forgotPassword: '忘记密码？',
      continueWithGoogle: '使用 Google 继续',
      or: '或',
      resetPassword: '重置密码',
      resetPasswordSubtitle: '输入您的邮箱，我们将发送重置验证码。',
      sendResetCode: '发送重置验证码',
      backToSignIn: '返回登录',
      checkEmail: '查看您的邮箱',
      resetCodeSentTo: (email) => `我们已向 ${email} 发送了 8 位重置验证码`,
      resetCode: '重置验证码',
      verify: '验证',
      resendCode: '重新发送验证码',
      back: '返回',
      setNewPassword: '设置新密码',
      setNewPasswordSubtitle: '为您的账户设置新密码。',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      updatePassword: '更新密码',
      verificationCodeSentTo: (email) => `我们已向 ${email} 发送了 8 位验证码`,
      verificationCode: '验证码',
      emailPasswordRequired: '请输入邮箱和密码。',
      passwordsDoNotMatch: '两次密码输入不一致。',
      emailRequired: '请输入您的邮箱。',
      newPasswordRequired: '请输入新密码。',
      codeResentTo: (email) => `验证码已重新发送至 ${email}`,
    },

    feedback: {
      title: '发送建议',
      thanks: '感谢您的建议！',
      subtitle: '有改进 EasyWord 的想法？我们很乐意听到。',
      placeholder: '在这里写下您的建议…',
      sendError: '发送失败，请重试。',
      send: '发送',
    },

    home: {
      title: '资源',
      noVideos: '暂无视频',
      noVideosDesc: '请向 ieltResources.ts 添加视频 ID 以填充此频道。',
      transcript: '字幕',
      tapToAdd: '点击任意单词即可添加',
      hide: '隐藏',
      show: '显示',
      loadingTranscript: '正在加载字幕…',
      noTranscript: '此视频暂无字幕。',
      addWord: '添加单词',
      word: '单词',
      pronunciation: '发音',
      lookUpInDictionary: '在词典中查找',
      meaning: '释义',
      saveToList: '保存到列表',
      wordAdded: (word, list) => `已将"${word}"添加到"${list}"`,
    },

    settings: {
      title: '设置',
      language: '语言',
      statistics: '统计',
      total: '总计',
      mastered: '已掌握',
      inProgress: '进行中',
      dataManagement: '数据管理',
      account: '账户',
      premiumMember: '高级会员',
      freePlan: '免费方案',
      unlimitedListsAndWords: '无限列表和单词',
      listsUsed: (n, limit) => `已使用 ${n}/${limit} 个列表`,
      signOut: '退出登录',
      deleteAccount: '删除账户',
      deleteAccountMessage:
        '这将永久删除您的账户和所有数据——单词、列表和复习记录。此操作无法撤销。',
      exportAsText: '导出为文本',
      exportDescription: '单词 + 翻译，可读的 .txt 文件',
      dictionaries: '词典',
      dictionaryHint: '当前词典用于单词查找。点击切换。',
      addDictionary: '添加词典',
      reviewSchedule: '复习计划',
      reviewIntervalPrefix: '单词复习间隔：',
      reviewIntervalSuffix: (n) =>
        `经过 ${n} 次成功复习后，单词被标记为已掌握。`,
      about: '关于',
      version: '版本 1.0.0',
      appDescription:
        '一款使用间隔重复帮助您记忆阅读和听力材料中单词的词汇记忆应用。',
      privacyPolicy: '隐私政策',
    },
  },
};
