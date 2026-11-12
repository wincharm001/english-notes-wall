/**
 * Browser half of the English Notes Wall bundle.
 *
 * Renders the wall as a root-scoped main panel plus its sidebar entry. Every
 * data operation is an authenticated unary RPC on the shared client connection
 * (`/api` endpoint `englishNotes/<method>`), which dispatches into the same
 * Host service the `english_notes` tool calls.
 */
window.__ModuleLoader__.load({
  id: '@local/english-notes-wall',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useSyncExternalStore } = React

    const SERVICE = 'englishNotes'
    const LOCALE_NS = 'englishNotes'
    const PANEL_KEY = 'english-notes'
    const CATEGORIES = ['word', 'phrase', 'collocation', 'pattern', 'sentence', 'other']
    const PROMPT_TASKS = ['expansion', 'quiz', 'grading', 'organize']
    const USAGE_PURPOSE_KEYS = ['expansion', 'quiz', 'grading', 'organize', 'essay']
    const PROMPT_PLACEHOLDERS = {
      expansion: ['{{note}}'],
      quiz: ['{{count}}', '{{notes}}'],
      grading: ['{{quiz}}', '{{answers}}', '{{notes}}'],
      organize: ['{{notes}}', '{{count}}'],
    }
    const QUIZ_COLLAPSED_KEY = 'english-notes-wall.quiz-collapsed'
    const COMPOSER_COLLAPSED_KEY = 'english-notes-wall.composer-collapsed'
    const SIDEBAR_COLLAPSED_KEY = 'english-notes-wall.sidebar-collapsed.v2'
    const VIEW_MODE_KEY = 'english-notes-wall.view-mode'
    const GROUP_MODE_KEY = 'english-notes-wall.group-mode'
    const PRACTICE_KEY = 'english-notes-wall.practice-mode'

    // -- dictionaries -------------------------------------------------------

    const en = {
      'panel.title': 'English Notes Wall',
      'panel.subtitle': 'Collect words, phrases, collocations, sentence patterns, and long sentences to analyze. Expand them with a model and practise a fresh quiz every day.',
      'action.add': 'Add note',
      'action.refresh': 'Refresh',
      'action.settings': 'Settings',
      'action.expand': 'Expand with model',
      'action.expandAll': 'Expand all entries',
      'action.expandMissing': 'Expand missing',
      'action.expandingMissing': 'Expanding',
      'action.expandAgain': 'Expand again',
      'action.edit': 'Edit',
      'action.collapseExpansions': 'Collapse all expansions',
      'action.expandExpansions': 'Expand all expansions',
      'sidebar.collapse': 'Hide the right sidebar',
      'sidebar.expand': 'Show the right sidebar',
      'view.label': 'Note layout',
      'view.list': 'List layout',
      'view.grid': 'Grid layout',
      'action.show': 'Show details',
      'action.hide': 'Hide details',
      'action.delete': 'Delete',
      'action.confirmDelete': 'Delete this note?',
      'action.confirm': 'Delete',
      'action.cancel': 'Cancel',
      'action.save': 'Save',
      'action.saving': 'Saving…',
      'action.regenerate': 'Regenerate',
      'action.viewAnswer': 'Show answers',
      'action.hideAnswers': 'Hide answers',
      'action.submit': 'Submit answers',
      'action.close': 'Dismiss',
      'action.backToTop': 'Back to top',
      'form.heading': 'New sticky note',
      'form.placeholder': 'One entry per line: a word, phrase, collocation, sentence pattern, or long sentence to analyze. Add a Chinese meaning after |.',
      'form.tags': 'Tags, comma separated (optional)',
      'form.category': 'Category',
      'form.hint': 'Ctrl + Enter to save',
      'form.collapse': 'Collapse the new-note form',
      'form.expand': 'Show the new-note form',
      'form.expandHint': 'The new-note form is collapsed. Click to expand.',
      'form.required': 'Write something before saving.',
      'filter.all': 'All',
      'filter.search': 'Search notes…',
      'filter.empty': 'No notes match this view.',
      'filter.emptyHint': 'Add your first note above, or clear the search.',
      'category.word': 'Word',
      'category.phrase': 'Phrase',
      'category.collocation': 'Collocation',
      'category.pattern': 'Sentence pattern',
      'category.sentence': 'Long-sentence analysis',
      'category.other': 'Other',
      'note.expanded': 'Expanded',
      'note.expandEntries': 'Show all entries',
      'note.collapseEntries': 'Collapse entries',
      'note.expandEntry': 'Show entry',
      'note.collapseEntry': 'Collapse entry',
      'note.entries': 'entries',
      'note.editHint': 'One entry per line; use "text | 中文" for a meaning.',
      'note.editEmpty': 'Keep at least one entry.',
      'note.translationLabel': 'Meaning',
      'note.tagsLabel': 'Tags',
      'note.pinnedGroup': 'Pinned',
      'note.fullView': 'Full content',
      'note.prev': 'Previous note',
      'note.next': 'Next note',
      'note.nextReview': 'Next review',
      'essay.open': 'Today\'s essay',
      'essay.title': 'Today\'s IELTS essay',
      'essay.back': 'Back to wall',
      'essay.prompt': 'Task question',
      'essay.think': 'Think first',
      'essay.outlinePlaceholder': 'Jot down two main ideas before you read…',
      'essay.showZh': 'Show Chinese',
      'essay.hideZh': 'Hide Chinese',
      'essay.structure': 'Structure',
      'essay.vocab': 'Vocabulary',
      'essay.questions': 'Comprehension',
      'essay.annotation': 'Sentence analysis',
      'essay.annotationHint': 'Click a sentence to see its translation, structure, and natural chunk.',
      'essay.addToNotes': 'Add to notes',
      'essay.added': 'Added to your wall.',
      'essay.addFailed': 'Could not add this text.',
      'essay.selected': 'Selected',
      'essay.aiGenerate': 'AI essay',
      'essay.aiHint': 'Replace today\'s essay with a new one from the model',
      'essay.generating': 'Generating…',
      'essay.generated': 'A new AI essay is ready.',
      'essay.generateFailed': 'The model did not return a usable essay; the built-in essay is unchanged.',
      'essay.modelUnavailable': 'Configure a model to generate a new essay.',
      'essay.loading': 'Loading today\'s essay…',
      'essay.error': 'Could not load the essay.',
      'essay.empty': 'No essay is available.',
      'essay.words': 'words',
      'essay.minutes': 'min',
      'essay.band': 'Target band',
      'essay.complete': 'Mark as read',
      'essay.completed': 'Completed',
      'essay.correct': 'Correct',
      'essay.incorrect': 'Not quite',
      'essay.saveSentence': 'Save this sentence',
      'essay.saveWord': 'Save this word',
      'essay.outlineTitle': 'Model outline',
      'essay.cohesive': 'Cohesive devices',
      'expansion.meaning': 'Meaning',
      'expansion.phonetic': 'Pronunciation',
      'expansion.wordForms': 'Word forms and look-alikes',
      'expansion.form.derivative': 'Derivative',
      'expansion.form.same-root': 'Same root',
      'expansion.form.similar': 'Look-alike',
      'expansion.discrimination': 'Word discrimination',
      'expansion.collocations': 'Collocations',
      'expansion.synonyms': 'Synonyms',
      'expansion.examples': 'Examples',
      'expansion.longSentences': 'Long-sentence analysis',
      'expansion.translation': 'Translation',
      'expansion.structure': 'Structure',
      'expansion.chunk': 'Natural chunk',
      'expansion.grammar': 'Grammar',
      'expansion.moreExamples': 'More long sentences',
      'expansion.moreShortExamples': 'More examples',
      'expansion.tips': 'Usage tips',
      'expansion.related': 'Related',
      'expansion.empty': 'No expansion yet.',
      'quiz.title': 'Daily quiz',
      'quiz.today': 'Today',
      'quiz.tomorrow': 'Tomorrow',
      'quiz.next': 'Next quiz',
      'quiz.soon': 'Publishing soon…',
      'quiz.paused': 'Daily quiz paused',
      'quiz.empty': 'No quiz for today yet.',
      'quiz.emptyHint': 'The daily quiz appears at the configured time, or you can build one now from your notes.',
      'quiz.generate': 'Create today’s quiz',
      'quiz.generating': 'Building today’s quiz…',
      'quiz.confirmRegenerate': 'Replace today’s quiz and its answers?',
      'quiz.replace': 'Replace',
      'quiz.score': 'Score',
      'quiz.correct': 'Correct',
      'quiz.wrong': 'Review',
      'quiz.notAnswered': 'Not answered',
      'quiz.yourAnswer': 'Your answer',
      'quiz.answer': 'Answer',
      'quiz.noAnswer': 'No answer',
      'quiz.pending': 'Not finished',
      'quiz.done': 'Finished',
      'quiz.source.model': 'Model',
      'quiz.source.local': 'Local practice set',
      'quiz.type.cn2en': 'Chinese → English',
      'quiz.type.en2cn': 'English → Chinese',
      'quiz.type.cloze': 'Fill the blank',
      'quiz.type.collocation': 'Collocation',
      'quiz.type.usage': 'Use it in a sentence',
      'quiz.hint': 'Hint',
      'quiz.explanation': 'Note',
      'quiz.history': 'Recent days',
      'quiz.localNote': 'The model was unavailable, so this quiz was built from your notes.',
      'quiz.blank': 'Write your answer…',
      'quiz.collapse': 'Collapse questions',
      'quiz.expand': 'Expand questions',
      'quiz.gradeModel': 'Grade with model',
      'quiz.gradeExact': 'Compare answers',
      'quiz.gradingModel': 'Grading…',
      'quiz.partial': 'Partly right',
      'quiz.openReview': 'Reference',
      'quiz.openHint': 'Open answer — other natural wordings are accepted.',
      'quiz.feedback': 'Feedback',
      'quiz.better': 'A better way',
      'quiz.related': 'Related vocabulary',
      'quiz.summary': 'Overall',
      'quiz.noModel': 'Configure a model to use model grading.',
      'quiz.needAnswer': 'Answer at least one question first.',
      'organize.action': 'Organize',
      'organize.title': 'Organization plan',
      'organize.working': 'Reading the whole wall…',
      'organize.apply': 'Apply plan',
      'organize.applied': 'The wall is now grouped by topic.',
      'organize.groups': 'Topic groups',
      'organize.categories': 'Category changes',
      'organize.relations': 'Synonyms and confusions',
      'organize.relation.synonym': 'Synonyms',
      'organize.relation.confusable': 'Confusable',
      'organize.relation.topic': 'Related',
      'organize.ungrouped': 'Ungrouped',
      'organize.byTopic': 'Group by topic',
      'organize.byTime': 'Group by time',
      'organize.mode': 'Grouping',
      'organize.notesUnit': 'notes',
      'organize.empty': 'Add at least one note before organizing the wall.',
      'organize.unavailable': 'Configure a model before organizing the wall.',
      'organize.failed': 'The model did not return a usable organization plan.',
      'organize.invalid': 'The organization plan no longer matches the saved notes.',
      'organize.planHint': 'The model reads every note; applying updates categories, topics, and tags.',
      'organize.emptyPlan': 'No usable topic groups were returned.',
      'usage.title': 'Token usage',
      'usage.last': 'Last call',
      'usage.total': 'Total',
      'usage.input': 'In',
      'usage.output': 'Out',
      'usage.calls': 'Calls',
      'usage.tokens': 'tokens',
      'usage.empty': 'No token usage recorded yet.',
      'usage.unreported': 'The provider did not report token usage.',
      'usage.purpose.expansion': 'Expansion',
      'usage.purpose.quiz': 'Quiz',
      'usage.purpose.grading': 'Grading',
      'usage.purpose.organize': 'Organize',
      'usage.purpose.essay': 'Essay',
      'usage.cost': 'Estimated cost',
      'usage.costHint': 'Set token prices in settings to estimate cost.',
      'usage.breakdown': 'By purpose',
      'usage.breakdownHint': 'Purpose details start from this update; earlier calls count only in the total.',
      'settings.title': 'Quiz and model settings',
      'settings.enabled': 'Publish a quiz every day',
      'settings.quizHint': 'Generated from your saved notes at this time.',
      'settings.time': 'Time of day',
      'settings.count': 'Questions per day',
      'settings.expansionTitle': 'Expansion and organize model',
      'settings.provider': 'Provider',
      'settings.model': 'Model',
      'settings.reasoning': 'Thinking effort',
      'settings.modelNone': 'Not configured',
      'settings.modelHint': 'Expansion, wall organization, and model-authored quizzes use this model.',
      'settings.priceTitle': 'Token pricing',
      'settings.priceHint': 'Prices per 1M tokens from your provider; used only for the local estimate.',
      'settings.priceInput': 'Input / 1M',
      'settings.priceOutput': 'Output / 1M',
      'settings.currency': 'Currency',
      'settings.followDefault': 'Follow the default session model',
      'settings.modelDefault': 'Model default',
      'settings.reasoningNone': 'This model has no thinking-effort options.',
      'settings.catalogLoading': 'Loading models…',
      'settings.catalogError': 'Could not read the model catalog.',
      'settings.saved': 'Settings saved.',
      'settings.invalid': 'Check the time, question count, token prices, and model selection.',
      'settings.prompts': 'Prompts',
      'settings.promptsToggle': 'Edit prompts',
      'settings.promptsHint': 'Leave a field empty to use its default. Keep the JSON output requirements so results stay parseable.',
      'settings.prompt.expansion': 'Expansion',
      'settings.prompt.quiz': 'Quiz',
      'settings.prompt.grading': 'Model grading',
      'settings.prompt.organize': 'Organize',
      'settings.prompt.organizeHint': 'Reads every note and proposes topic groups, category fixes, and relations.',
      'settings.prompt.reset': 'Use default',
      'settings.prompt.loadDefault': 'Load default for editing',
      'settings.prompt.placeholders': 'Placeholders:',
      'stats.title': 'Wall overview',
      'stats.total': 'Notes',
      'stats.pending': 'Quiz waiting',
      'stats.streak': 'Day streak',
      'stats.yes': 'Yes',
      'stats.no': 'No',
      'stats.entries': 'Entries',
      'stats.due': 'Due for review',
      'stats.learned': 'Scheduled',
      'stats.accuracy': '7-day accuracy',
      'stats.reviewedToday': 'Reviewed today',
      'error.load': 'Could not load the note wall.',
      'error.action': 'The action failed.',
      'error.api': 'The note wall cannot reach its host service. Reload the page to retry.',
      'error.expandUnavailable': 'A model is not configured, so expansion is unavailable.',
      'error.quizUnavailable': 'The quiz could not be created yet.',
      'notice.added': 'Note added.',
      'notice.updated': 'Note updated.',
      'notice.deleted': 'Note deleted. Use Undo to restore it.',
      'notice.restored': 'Note restored.',
      'notice.expanded': 'Expansion added.',
      'notice.expandPartial': 'Some entries could not be expanded. Retry the missing ones.',
      'notice.expandCancelled': 'Expansion stopped.',
      'notice.missingExpanded': 'Finished expanding the pending notes.',
      'notice.noMissingExpansions': 'Every note is already expanded.',
      'notice.quiz': 'Today’s quiz is ready.',
      'notice.graded': 'Answers saved.',
      'notice.backup': 'Backup created.',
      'notice.imported': 'Import finished.',
      'action.play': 'Read aloud',
      'action.pin': 'Pin note',
      'action.unpin': 'Unpin note',
      'action.practice': 'Practice mode',
      'action.practiceOn': 'Practice mode: analysis hidden',
      'practice.hint': 'Find the main clause and subordinate clauses first, then reveal the analysis.',
      'practice.hintWord': 'Translate the example sentence yourself first, then reveal the reference.',
      'action.showAnalysis': 'Show translation and analysis',
      'action.hideAnalysis': 'Hide translation and analysis',
      'action.undo': 'Undo',
      'action.stop': 'Stop',
      'action.retryFailed': 'Retry failed',
      'action.more': 'More actions',
      'filter.status': 'Study status',
      'filter.allNotes': 'All notes',
      'filter.due': 'Due for review',
      'filter.unexpanded': 'Not expanded',
      'filter.mastered': 'Scheduled',
      'filter.tag': 'Tag',
      'filter.clearTag': 'Clear tag filter',
      'quiz.due': 'Due',
      'quiz.type.sentence': 'Long sentence',
      'quiz.type.dictation': 'Dictation',
      'quiz.dictationHint': 'Play the audio, then write what you hear.',
      'quiz.play': 'Play the audio',
      'settings.dataTitle': 'Data and backup',
      'settings.dataHint': 'Export a copy, import another wall, or back up now.',
      'settings.exportJson': 'JSON',
      'settings.exportCsv': 'CSV',
      'settings.exportAnki': 'Anki',
      'settings.import': 'Import JSON',
      'settings.importing': 'Importing…',
      'settings.backupNow': 'Back up now',
      'settings.backupCount': 'Automatic backups',
      'settings.backupNever': 'No automatic backup yet',
      'time.today': 'Today',
      'time.yesterday': 'Yesterday',
      'common.loading': 'Loading…',
      'common.retry': 'Retry',
      'common.optional': 'optional',
      'empty.title': 'Your wall is empty',
      'empty.body': 'Save the first word or phrase you want to remember. Everything stays on this machine.',
    }

    const zh = {
      'panel.title': '英语便利贴墙',
      'panel.subtitle': '记录单词、词组、固定搭配、常用句式，以及需要分析的长难句，用大模型拓展用法，每天自动生成一套小测验。',
      'action.add': '添加便利贴',
      'action.refresh': '刷新',
      'action.settings': '设置',
      'action.expand': '用大模型拓展',
      'action.expandAll': '拓展全部词条',
      'action.expandMissing': '补全拓展',
      'action.expandingMissing': '补全中',
      'action.expandAgain': '重新拓展',
      'action.edit': '编辑',
      'action.collapseExpansions': '收起全部拓展',
      'action.expandExpansions': '展开全部拓展',
      'sidebar.collapse': '收起右侧边栏',
      'sidebar.expand': '展开右侧边栏',
      'view.label': '便利贴排列方式',
      'view.list': '列表排列',
      'view.grid': '方格排列',
      'action.show': '展开详情',
      'action.hide': '收起详情',
      'action.delete': '删除',
      'action.confirmDelete': '确定删除这张便利贴？',
      'action.confirm': '删除',
      'action.cancel': '取消',
      'action.save': '保存',
      'action.saving': '保存中…',
      'action.regenerate': '重新生成',
      'action.viewAnswer': '查看答案',
      'action.hideAnswers': '隐藏答案',
      'action.submit': '提交答案',
      'action.close': '关闭',
      'action.backToTop': '回到顶部',
      'form.heading': '新建便利贴',
      'form.placeholder': '每行一个词条：单词、词组、固定搭配、句式或需要分析的长难句。可用 | 附中文释义。',
      'form.tags': '标签，用逗号分隔（可选）',
      'form.category': '分类',
      'form.hint': 'Ctrl + Enter 保存',
      'form.collapse': '收起新建便利贴',
      'form.expand': '展开新建便利贴',
      'form.expandHint': '新建便利贴已收起，点击展开。',
      'form.required': '写点内容再保存。',
      'filter.all': '全部',
      'filter.search': '搜索便利贴…',
      'filter.empty': '当前视图没有便利贴。',
      'filter.emptyHint': '在上方添加第一条，或清空搜索条件。',
      'category.word': '单词',
      'category.phrase': '词组',
      'category.collocation': '固定搭配',
      'category.pattern': '常用句式',
      'category.sentence': '长难句分析',
      'category.other': '其他',
      'note.expanded': '已拓展',
      'note.expandEntries': '展开全部词条',
      'note.collapseEntries': '收起词条',
      'note.expandEntry': '展开词条',
      'note.collapseEntry': '收起词条',
      'note.entries': '个词条',
      'note.editHint': '每行一个词条；可用「词条 | 中文」补充释义。',
      'note.editEmpty': '至少保留一个词条。',
      'note.translationLabel': '释义',
      'note.tagsLabel': '标签',
      'note.pinnedGroup': '置顶',
      'note.fullView': '完整内容',
      'note.prev': '上一个便利贴',
      'note.next': '下一个便利贴',
      'note.nextReview': '下次复习',
      'essay.open': '今日范文',
      'essay.title': '今日雅思范文',
      'essay.back': '返回墙面',
      'essay.prompt': '题目',
      'essay.think': '先想一想',
      'essay.outlinePlaceholder': '读之前先写两个主要论点…',
      'essay.showZh': '显示中文',
      'essay.hideZh': '隐藏中文',
      'essay.structure': '文章结构',
      'essay.vocab': '重点词汇',
      'essay.questions': '理解题',
      'essay.annotation': '句子解析',
      'essay.annotationHint': '点击句子查看翻译、结构和地道表达。',
      'essay.addToNotes': '添加到便利贴',
      'essay.added': '已添加到便利贴。',
      'essay.addFailed': '添加失败。',
      'essay.selected': '已选',
      'essay.aiGenerate': 'AI 生成',
      'essay.aiHint': '用模型重新生成一篇今日范文',
      'essay.generating': '生成中…',
      'essay.generated': '新的 AI 范文已生成。',
      'essay.generateFailed': '模型未返回可用范文，已保留内置范文。',
      'essay.modelUnavailable': '配置模型后可生成新范文。',
      'essay.loading': '正在加载今日范文…',
      'essay.error': '范文加载失败。',
      'essay.empty': '暂无可用范文。',
      'essay.words': '词',
      'essay.minutes': '分钟',
      'essay.band': '目标分',
      'essay.complete': '完成今日阅读',
      'essay.completed': '已完成',
      'essay.correct': '正确',
      'essay.incorrect': '不对',
      'essay.saveSentence': '保存这个句子',
      'essay.saveWord': '保存这个单词',
      'essay.outlineTitle': '范文提纲',
      'essay.cohesive': '衔接表达',
      'expansion.meaning': '释义',
      'expansion.phonetic': '发音',
      'expansion.wordForms': '词形与形近词',
      'expansion.form.derivative': '派生词',
      'expansion.form.same-root': '同根词',
      'expansion.form.similar': '形近词',
      'expansion.discrimination': '词汇辨析',
      'expansion.collocations': '固定搭配',
      'expansion.synonyms': '近义词',
      'expansion.examples': '例句',
      'expansion.longSentences': '长难句分析',
      'expansion.translation': '翻译',
      'expansion.structure': '句子结构',
      'expansion.chunk': '地道表达',
      'expansion.grammar': '语法',
      'expansion.moreExamples': '更多长难句',
      'expansion.moreShortExamples': '更多例句',
      'expansion.tips': '用法提示',
      'expansion.related': '相关表达',
      'expansion.empty': '还没有拓展内容。',
      'quiz.title': '每日小测验',
      'quiz.today': '今天',
      'quiz.tomorrow': '明天',
      'quiz.next': '下次测验',
      'quiz.soon': '即将发布…',
      'quiz.paused': '每日测验已暂停',
      'quiz.empty': '今天还没有小测验。',
      'quiz.emptyHint': '到设定时间会自动发布，也可以现在就用已记录的内容生成一套。',
      'quiz.generate': '生成今日测验',
      'quiz.generating': '正在生成今日测验…',
      'quiz.confirmRegenerate': '替换今天的测验和作答记录？',
      'quiz.replace': '替换',
      'quiz.score': '得分',
      'quiz.correct': '正确',
      'quiz.wrong': '待复习',
      'quiz.notAnswered': '未作答',
      'quiz.yourAnswer': '你的答案',
      'quiz.answer': '参考答案',
      'quiz.noAnswer': '未作答',
      'quiz.pending': '未完成',
      'quiz.done': '已完成',
      'quiz.source.model': '大模型出题',
      'quiz.source.local': '本地题库',
      'quiz.type.cn2en': '中翻英',
      'quiz.type.en2cn': '英翻中',
      'quiz.type.cloze': '语法填空',
      'quiz.type.collocation': '搭配填空',
      'quiz.type.usage': '造句运用',
      'quiz.hint': '提示',
      'quiz.explanation': '说明',
      'quiz.history': '最近几天',
      'quiz.localNote': '大模型暂时不可用，这套题由已记录的内容自动组成。',
      'quiz.blank': '在这里作答…',
      'quiz.collapse': '收起题目',
      'quiz.expand': '展开题目',
      'quiz.gradeModel': '大模型改题',
      'quiz.gradeExact': '对照答案',
      'quiz.gradingModel': '正在改题…',
      'quiz.partial': '部分正确',
      'quiz.openReview': '参考',
      'quiz.openHint': '开放题：意思相近、表达自然的其他答案同样算对。',
      'quiz.feedback': '点评',
      'quiz.better': '更自然的表达',
      'quiz.related': '相关词汇',
      'quiz.summary': '总评',
      'quiz.noModel': '需要先配置模型才能使用大模型改题。',
      'quiz.needAnswer': '请先至少作答一题。',
      'organize.action': '整理',
      'organize.title': '整理方案',
      'organize.working': '正在阅读全部笔记…',
      'organize.apply': '应用整理',
      'organize.applied': '已按主题重新整理便利贴墙。',
      'organize.groups': '主题分组',
      'organize.categories': '类别调整',
      'organize.relations': '近义与易混',
      'organize.relation.synonym': '近义',
      'organize.relation.confusable': '易混',
      'organize.relation.topic': '相关',
      'organize.ungrouped': '未归类',
      'organize.byTopic': '按主题分组',
      'organize.byTime': '按时间分组',
      'organize.mode': '分组方式',
      'organize.notesUnit': '条',
      'organize.empty': '先添加至少一条笔记再整理。',
      'organize.unavailable': '需要先配置模型才能整理便利贴墙。',
      'organize.failed': '模型没有返回可用的整理方案。',
      'organize.invalid': '整理方案与当前笔记不再匹配。',
      'organize.planHint': '大模型会阅读全部笔记；应用后会更新类别、主题和标签。',
      'organize.emptyPlan': '没有生成可用的主题分组。',
      'usage.title': 'Tokens 用量',
      'usage.last': '最近一次',
      'usage.total': '累计',
      'usage.input': '输入',
      'usage.output': '输出',
      'usage.calls': '次数',
      'usage.tokens': 'token',
      'usage.empty': '还没有 token 记录。',
      'usage.unreported': '服务商未返回 token 用量。',
      'usage.purpose.expansion': '拓展',
      'usage.purpose.quiz': '出题',
      'usage.purpose.grading': '改题',
      'usage.purpose.organize': '整理',
      'usage.purpose.essay': '范文',
      'usage.cost': '预估费用',
      'usage.costHint': '在设置中填写 Token 单价即可估算费用。',
      'usage.breakdown': '按用途',
      'usage.breakdownHint': '按用途明细从本次更新开始累计，此前的调用只计入总计。',
      'settings.title': '测验与模型设置',
      'settings.enabled': '每天定时发布小测验',
      'settings.quizHint': '到点后会用已记录的内容生成测验。',
      'settings.time': '发布时间',
      'settings.count': '每天题目数量',
      'settings.expansionTitle': '拓展与整理模型',
      'settings.provider': '服务商',
      'settings.model': '模型',
      'settings.reasoning': '思考强度',
      'settings.modelNone': '未配置',
      'settings.modelHint': '拓展、整理和智能出题使用所选模型。',
      'settings.priceTitle': 'Token 计费',
      'settings.priceHint': '按服务商价格填写每百万 Token 单价，仅用于本地费用估算。',
      'settings.priceInput': '输入 / 百万',
      'settings.priceOutput': '输出 / 百万',
      'settings.currency': '货币符号',
      'settings.followDefault': '跟随会话默认模型',
      'settings.modelDefault': '模型默认',
      'settings.reasoningNone': '该模型没有可选的思考强度。',
      'settings.catalogLoading': '正在加载模型…',
      'settings.catalogError': '无法读取模型列表。',
      'settings.saved': '设置已保存。',
      'settings.invalid': '请检查发布时间、题目数量、Token 单价和模型选择。',
      'settings.prompts': '提示词',
      'settings.promptsToggle': '修改提示词',
      'settings.promptsHint': '留空则使用默认提示词；请保留 JSON 输出要求，否则可能无法解析结果。',
      'settings.prompt.expansion': '拓展',
      'settings.prompt.quiz': '出题',
      'settings.prompt.grading': '大模型改题',
      'settings.prompt.organize': '整理',
      'settings.prompt.organizeHint': '阅读全部笔记，给出主题分组、类别调整和近义关系。',
      'settings.prompt.reset': '恢复默认',
      'settings.prompt.loadDefault': '载入默认再修改',
      'settings.prompt.placeholders': '占位符：',
      'stats.title': '墙面概览',
      'stats.total': '便利贴',
      'stats.pending': '待完成测验',
      'stats.streak': '连续天数',
      'stats.yes': '有',
      'stats.no': '无',
      'stats.entries': '词条',
      'stats.due': '待复习',
      'stats.learned': '已排期',
      'stats.accuracy': '7 日正确率',
      'stats.reviewedToday': '今日已复习',
      'error.load': '无法加载便利贴墙。',
      'error.action': '操作失败。',
      'error.api': '便利贴墙无法连接宿主服务，请刷新页面重试。',
      'error.expandUnavailable': '尚未配置大模型，暂时无法拓展。',
      'error.quizUnavailable': '暂时无法生成测验。',
      'notice.added': '便利贴已添加。',
      'notice.updated': '便利贴已更新。',
      'notice.deleted': '便利贴已删除，可用“撤销”恢复。',
      'notice.restored': '便利贴已恢复。',
      'notice.expanded': '拓展内容已添加。',
      'notice.expandPartial': '部分词条未能拓展，可重试失败项。',
      'notice.expandCancelled': '已停止拓展。',
      'notice.missingExpanded': '已补全所有缺失的拓展。',
      'notice.noMissingExpansions': '所有便利贴都已拓展。',
      'notice.quiz': '今日测验已生成。',
      'notice.graded': '答案已保存。',
      'notice.backup': '备份已创建。',
      'notice.imported': '导入完成。',
      'action.play': '朗读',
      'action.pin': '置顶便利贴',
      'action.unpin': '取消置顶',
      'action.practice': '练习模式',
      'action.practiceOn': '练习模式：已隐藏分析',
      'practice.hint': '先自己找主干和从句，再显示翻译与分析。',
      'practice.hintWord': '先自己翻译例句，再显示参考翻译。',
      'action.showAnalysis': '显示翻译与分析',
      'action.hideAnalysis': '隐藏翻译与分析',
      'action.undo': '撤销',
      'action.stop': '停止',
      'action.retryFailed': '重试失败项',
      'action.more': '更多操作',
      'filter.status': '学习状态',
      'filter.allNotes': '全部便利贴',
      'filter.due': '待复习',
      'filter.unexpanded': '未拓展',
      'filter.mastered': '已排期',
      'filter.tag': '标签',
      'filter.clearTag': '清除标签筛选',
      'quiz.due': '待复习',
      'quiz.type.sentence': '长难句',
      'quiz.type.dictation': '听写',
      'quiz.dictationHint': '点击朗读，然后写出你听到的内容。',
      'quiz.play': '播放音频',
      'settings.dataTitle': '数据与备份',
      'settings.dataHint': '导出副本、导入另一面墙，或立即备份。',
      'settings.exportJson': 'JSON',
      'settings.exportCsv': 'CSV',
      'settings.exportAnki': 'Anki',
      'settings.import': '导入 JSON',
      'settings.importing': '导入中…',
      'settings.backupNow': '立即备份',
      'settings.backupCount': '自动备份',
      'settings.backupNever': '暂无自动备份',
      'time.today': '今天',
      'time.yesterday': '昨天',
      'common.loading': '加载中…',
      'common.retry': '重试',
      'common.optional': '可选',
      'empty.title': '墙上还是空的',
      'empty.body': '先记下第一个想记住的单词或句子。所有内容都保存在本机。',
    }

    // -- badge store --------------------------------------------------------

    const badge = (() => {
      let value = false
      const listeners = new Set()
      return {
        get: () => value,
        set(next) {
          if (next === value) return
          value = next
          for (const listener of listeners) listener()
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
    })()

    // -- small helpers ------------------------------------------------------

    const cx = (...parts) => parts.filter(Boolean).join(' ')

    function errorText(error) {
      if (!error) return ''
      return String(error.message || error)
    }

    function asArray(value) {
      return Array.isArray(value) ? value : []
    }

    function wrapIndex(index, delta, length) {
      if (!Number.isInteger(index) || index < 0 || !Number.isInteger(length) || length < 1) return -1
      return (index + delta + length) % length
    }

    function scrollToTop(node) {
      if (!node) return
      let behavior = 'smooth'
      try {
        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) behavior = 'auto'
      } catch {
        behavior = 'smooth'
      }
      try {
        if (typeof node.scrollTo === 'function') node.scrollTo({ top: 0, behavior })
        else node.scrollTop = 0
      } catch {
        node.scrollTop = 0
      }
    }

    function essaySentences(text) {
      const value = String(text ?? '')
      const matches = value.match(/[^.!?]+[.!?]+["'）)\]]?|[^.!?]+$/g)
      return (matches ?? [value]).map(part => part.trim()).filter(Boolean)
    }

    function essayNormalize(text) {
      return String(text ?? '').replace(/\s+/g, ' ').trim()
    }

    function essayInferCategory(text) {
      const words = essayNormalize(text).split(/\s+/).filter(Boolean).length
      if (/[.!?]["'）)\]]?$/.test(essayNormalize(text)) || words >= 9) return 'sentence'
      if (words <= 1) return 'word'
      if (words <= 3) return 'phrase'
      return 'collocation'
    }

    function essayLookup(essay, text) {
      const needle = essayNormalize(text)
      const lower = needle.toLowerCase()
      const annotation = asArray(essay?.annotations).find(item => essayNormalize(item.sentence) === needle)
      if (annotation) return { translation: annotation.zh || '', annotation }
      const vocab = asArray(essay?.vocab).find(item => String(item.term ?? '').toLowerCase() === lower)
      if (vocab) return { translation: vocab.meaning || '', vocab }
      return {}
    }

    function dayKey(ms) {
      const date = new Date(ms)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${date.getFullYear()}-${month}-${day}`
    }

    function compareNotes(left, right) {
      const pinned = (right?.pinned ? 1 : 0) - (left?.pinned ? 1 : 0)
      if (pinned) return pinned
      const leftOrder = Number.isFinite(left?.order) ? left.order : Number.MAX_SAFE_INTEGER
      const rightOrder = Number.isFinite(right?.order) ? right.order : Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder || (left?.createdAt ?? 0) - (right?.createdAt ?? 0)
    }

    function formatTime(ms, localeId) {
      try {
        return new Intl.DateTimeFormat(localeId, { hour: '2-digit', minute: '2-digit' }).format(new Date(ms))
      } catch {
        return new Date(ms).toTimeString().slice(0, 5)
      }
    }

    function formatQuizDate(value, localeId) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
      if (!match) return String(value ?? '')
      const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      try {
        return new Intl.DateTimeFormat(localeId, { month: 'short', day: 'numeric' }).format(date)
      } catch {
        return `${match[2]}/${match[3]}`
      }
    }

    function parseTags(value) {
      return String(value ?? '')
        .split(/[,，]+/)
        .map(tag => tag.trim())
        .filter(Boolean)
        .filter((tag, index, all) => all.indexOf(tag) === index)
        .slice(0, 8)
    }

    function useActiveLocale(ctx) {
      const [active, setActive] = useState(() => {
        try {
          return ctx.locale.getLocale().active
        } catch {
          return 'en'
        }
      })
      useEffect(() => {
        try {
          return ctx.locale.subscribe(() => {
            try {
              setActive(ctx.locale.getLocale().active)
            } catch {
              /* ignore */
            }
          })
        } catch {
          return undefined
        }
      }, [ctx])
      return active
    }

    function useThemeScheme(ctx) {
      const [scheme, setScheme] = useState(() => {
        try {
          return ctx.get('theme')?.getTheme?.().active?.colorScheme || 'light'
        } catch {
          return 'light'
        }
      })
      useEffect(() => {
        const theme = ctx.get('theme')
        if (!theme) return undefined
        const update = () => {
          try {
            setScheme(theme.getTheme().active?.colorScheme || 'light')
          } catch {
            /* ignore */
          }
        }
        update()
        try {
          return ctx.on('theme/change', update)
        } catch {
          return undefined
        }
      }, [ctx])
      return scheme
    }

    // -- example highlighting ----------------------------------------------
    //
    // Words, phrases and collocations match literally. An entry with a
    // placeholder (sb., sth., adj., ...) is matched by its frame instead: the
    // placeholders are dropped, then the remaining words are followed in order
    // through the example. The span between the first and last hit covers the
    // fillers too, so the whole frame gets the highlight. Sentence patterns use
    // the same frame matcher even when they contain no placeholder.

    const HIGHLIGHT_PLACEHOLDERS = new Set([
      'sb', 'sb.', "sb's", 'sth', 'sth.', "sth's", 'somebody', "somebody's", 'something', "something's",
      'someone', "someone's", 'ones', "one's", 'one',
      'adj', 'adj.', 'adv', 'adv.', 'n', 'n.', 'v', 'v.', 'vt', 'vi', 'prep', 'pron', 'conj',
      'clause', 'do', 'does', 'did', 'doing', 'done', 'to do', '...', '…',
    ])

    const HIGHLIGHT_PLACEHOLDER_DETECT = /\b(?:sb|sth|somebody|something|someone|adj|adv|vt|vi|prep|pron|conj|clause)\b\.?|one['’]s\b/i

    function hasHighlightPlaceholder(entryText) {
      return HIGHLIGHT_PLACEHOLDER_DETECT.test(stripEntryGlosses(entryText))
    }

    function stripEntryGlosses(value) {
      return String(value ?? '')
        .replace(/[（(][^）)]*[\u3400-\u9fff][^）)]*[）)]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    function highlightNeedles(entryText) {
      const base = stripEntryGlosses(entryText)
      if (!base) return []
      const needles = [base]
      for (const part of base.split(/\s*(?:\/|\||;|；|\.\.\.|…|\+)\s*/)) {
        const trimmed = part.replace(/\s+/g, ' ').trim()
        if (trimmed.length < 2) continue
        if (needles.some(item => item.toLowerCase() === trimmed.toLowerCase())) continue
        needles.push(trimmed)
      }
      return needles.filter(item => item.length >= 2)
    }

    function literalRanges(source, needle) {
      const hay = source.toLowerCase()
      const target = String(needle ?? '').toLowerCase()
      if (!target) return []
      const ranges = []
      let at = hay.indexOf(target)
      while (at >= 0) {
        ranges.push([at, at + target.length])
        at = hay.indexOf(target, at + target.length)
      }
      return ranges
    }

    function isHighlightWordChar(char) {
      return Boolean(char) && /[a-z0-9'’-]/.test(char)
    }

    function findWholeWord(hay, token, from) {
      if (!token) return null
      if (token.length <= 2) {
        let at = hay.indexOf(token, from)
        while (at >= 0) {
          if (!isHighlightWordChar(hay[at - 1]) && !isHighlightWordChar(hay[at + token.length])) {
            return { start: at, end: at + token.length }
          }
          at = hay.indexOf(token, at + 1)
        }
        return null
      }
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\b${escaped}(?:s|es|ed|d|ing)?\\b`, 'g')
      pattern.lastIndex = from
      const match = pattern.exec(hay)
      return match ? { start: match.index, end: match.index + match[0].length } : null
    }

    function patternAnchorRange(source, entryText) {
      const tokens = (stripEntryGlosses(entryText).toLowerCase().replace(/[’]/g, "'").match(/[a-z][a-z'’-]*/g) || [])
        .filter(token => !HIGHLIGHT_PLACEHOLDERS.has(token))
      if (tokens.length < 2) return []
      const hay = source.toLowerCase()
      let cursor = 0
      let first = -1
      let last = -1
      let matched = 0
      for (const token of tokens) {
        const match = findWholeWord(hay, token, cursor)
        if (!match) continue
        if (first < 0) first = match.start
        last = match.end
        cursor = match.end
        matched += 1
      }
      if (matched < 2 || first < 0 || last - first > 96) return []
      return [[first, last]]
    }

    function mergeHighlightRanges(ranges) {
      const sorted = ranges.slice().sort((left, right) => left[0] - right[0])
      const merged = []
      for (const [start, end] of sorted) {
        const previous = merged[merged.length - 1]
        if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end)
        else merged.push([start, end])
      }
      return merged.slice(0, 4)
    }

    function highlightRanges(source, entryText, category) {
      const text = String(source ?? '')
      if (!text) return []
      const ranges = []
      for (const needle of highlightNeedles(entryText)) ranges.push(...literalRanges(text, needle))
      if (category === 'pattern' || hasHighlightPlaceholder(entryText)) {
        ranges.push(...patternAnchorRange(text, entryText))
      }
      return mergeHighlightRanges(ranges)
    }

    function renderHighlighted(source, ranges) {
      if (!ranges.length) return source
      const nodes = []
      let cursor = 0
      ranges.forEach(([start, end], index) => {
        if (start > cursor) nodes.push(source.slice(cursor, start))
        nodes.push(h('mark', { key: `hl-${index}`, className: 'enw-hl' }, source.slice(start, end)))
        cursor = end
      })
      if (cursor < source.length) nodes.push(source.slice(cursor))
      return nodes
    }

    function highlightExample(text, entryText, category) {
      return renderHighlighted(text, highlightRanges(text, entryText, category))
    }

    function highlightTranslation(text, translation) {
      return renderHighlighted(text, highlightRanges(text, translation, 'translation'))
    }




    // -- primitives ---------------------------------------------------------

    const ICON_PATHS = {
      plus: 'M12 5v14M5 12h14',
      sparkles: 'M12 3.5l1.8 4.7 4.7 1.8-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.8L12 3.5zM18.5 16l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z',
      trash: 'M4 7h16M9.5 7V4h5v3M6.5 7l1 13h9l1-13',
      edit: 'M4 20h4L18.5 9.5l-4-4L4 16v4zM13.5 6.5l4 4',
      refresh: 'M20 11a8 8 0 10-2.3 5.7M20 5v6h-6',
      check: 'M4.5 12.5l5 5L20 6.5',
      clock: 'M12 7.5v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z',
      settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12c0 .4 0 .8-.1 1.2l2 1.6-2 3.4-2.4-1a7 7 0 01-2 1.2L14 21h-4l-.5-2.6a7 7 0 01-2-1.2l-2.4 1-2-3.4 2-1.6A7 7 0 015 12c0-.4 0-.8.1-1.2l-2-1.6 2-3.4 2.4 1a7 7 0 012-1.2L10 3h4l.5 2.6a7 7 0 012 1.2l2.4-1 2 3.4-2 1.6c.1.4.1.8.1 1.2z',
      chevron: 'M9 6l6 6-6 6',
      chevronDown: 'M6 9l6 6 6-6',
      chevronUp: 'M6 15l6-6 6 6',
      arrowLeft: 'M15 5l-7 7 7 7M8 12h12',
      arrowRight: 'M9 5l7 7-7 7M4 12h12',
      arrowUp: 'M12 19V5M5 12l7-7 7 7',
      list: 'M4 6h16M4 12h16M4 18h16',
      grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
      panel: 'M4 5h16v14H4zM15 5v14',
      search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
      close: 'M6 6l12 12M18 6L6 18',
      book: 'M4 5.5A2.5 2.5 0 016.5 3H20v18H6.5A2.5 2.5 0 014 18.5zM4 18.5A2.5 2.5 0 016.5 16H20',
      target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 17a5 5 0 100-10 5 5 0 000 10z',
      volume: 'M4 9.5v5h3.5L12 18V6L7.5 9.5H4zM15.5 9a4 4 0 010 6M18 6.5a7 7 0 010 11',
      pin: 'M9 4h6l-1 6 3.5 3.5H6.5L10 10 9 4zM12 13.5V20',
      download: 'M12 4v10m0 0l3.5-3.5M12 14L8.5 10.5M5 19h14',
      upload: 'M12 20V10m0 0l3.5 3.5M12 10l-3.5 3.5M5 5h14',
      eye: 'M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 15a3 3 0 100-6 3 3 0 000 6z',
      eyeOff: 'M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c6 0 9.5 6 9.5 6a15 15 0 01-3.1 3.6M6.3 8.4A15 15 0 002.5 12s3.5 6 9.5 6a9.6 9.6 0 004.1-.9M9.9 9.9a3 3 0 004.2 4.2',
      grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
      more: 'M5 12h.01M12 12h.01M19 12h.01',
      maximize: 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5',
    }

    function Icon({ name, size = 16, className }) {
      return h(
        'svg',
        {
          className: cx('enw-icon', className),
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: ICON_PATHS[name] ?? ICON_PATHS.book }),
      )
    }

    function Glyph({ size = 20 }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M5.5 3.5h9L18.5 7.5v13h-13z' }),
        h('path', { d: 'M14.5 3.5V7.5h4' }),
        h('path', { d: 'M8.5 11h6M8.5 14.5h4' }),
        h('path', { d: 'M18.5 16.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8.8-1.7z', fill: 'currentColor', stroke: 'none' }),
      )
    }

    function Btn({ children, onClick, variant = 'ghost', disabled = false, title, label, type = 'button', className }) {
      return h(
        'button',
        {
          type,
          className: cx('enw-btn', `enw-btn--${variant}`, className),
          onClick,
          disabled,
          title: title || undefined,
          'aria-label': label || undefined,
        },
        children,
      )
    }

    function Chip({ active, onClick, children, count }) {
      return h(
        'button',
        { type: 'button', className: cx('enw-chip', active && 'enw-chip--on'), onClick, 'aria-pressed': Boolean(active) },
        h('span', null, children),
        typeof count === 'number' ? h('span', { className: 'enw-chip-count' }, count) : null,
      )
    }

    function Toggle({ checked, onChange, label }) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': Boolean(checked),
          'aria-label': label,
          className: cx('enw-toggle', checked && 'enw-toggle--on'),
          onClick: () => onChange(!checked),
        },
        h('span', { className: 'enw-toggle-knob' }),
      )
    }

    function Banner({ tone = 'error', children, onClose }) {
      return h(
        'div',
        { className: cx('enw-banner', `enw-banner--${tone}`), role: tone === 'error' ? 'alert' : 'status' },
        h('span', { className: 'enw-banner-text' }, children),
        onClose
          ? h('button', { type: 'button', className: 'enw-banner-close', onClick: onClose, 'aria-label': 'close' }, h(Icon, { name: 'close', size: 14 }))
          : null,
      )
    }

    function SectionLabel({ children }) {
      return h('div', { className: 'enw-section-label' }, children)
    }

    // -- speech -------------------------------------------------------------

    function speak(text) {
      const value = String(text ?? '').trim()
      if (!value) return false
      try {
        const synth = window.speechSynthesis
        const Utterance = window.SpeechSynthesisUtterance
        if (!synth || typeof Utterance !== 'function') return false
        synth.cancel()
        const utterance = new Utterance(value.slice(0, 1200))
        utterance.lang = 'en-US'
        utterance.rate = 0.95
        synth.speak(utterance)
        return true
      } catch {
        return false
      }
    }

    function SpeakButton({ text, t, size = 14, className }) {
      const label = t('action.play')
      return h('button', {
        type: 'button',
        className: cx('enw-speak', className),
        title: label,
        'aria-label': label,
        onClick: event => {
          event.stopPropagation()
          speak(text)
        },
      }, h(Icon, { name: 'volume', size }))
    }

    function saveTextFile(filename, content, mime) {
      try {
        const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = filename
        anchor.style.display = 'none'
        document.body.append(anchor)
        anchor.click()
        anchor.remove()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        return true
      } catch {
        return false
      }
    }

    // -- note card ----------------------------------------------------------

    function ExpansionView({ expansion, t, localeId, showUsage = true, collapseSignal = 0, entryText = '', entryTranslation = '', category = '' }) {
      const [open, setOpen] = useState(true)
      const lastCollapse = useRef(collapseSignal)
      useEffect(() => {
        if (collapseSignal !== lastCollapse.current) {
          lastCollapse.current = collapseSignal
          setOpen(false)
        }
      }, [collapseSignal])
      const sentenceCategory = category === 'sentence'
      const analysis = sentenceCategory && expansion?.analysis ? expansion.analysis : null
      const extraSentences = analysis
        ? [...asArray(expansion.examples), ...asArray(expansion.moreExamples)]
        : []
      const hasStructured = expansion && (
        expansion.meaning || expansion.phonetic || asArray(expansion.wordForms).length
        || (sentenceCategory && expansion.analysis) || expansion.discrimination || asArray(expansion.collocations).length
        || asArray(expansion.synonyms).length || asArray(expansion.examples).length
        || asArray(expansion.moreExamples).length || expansion.tips || asArray(expansion.related).length
      )
      const [practice, setPractice] = useState(false)
      const [revealed, setRevealed] = useState(false)
      const hideAnalysis = practice && !revealed

      useEffect(() => {
        setRevealed(false)
      }, [practice])

      return h(
        'div',
        { className: 'enw-exp' },
        h(
          'button',
          { type: 'button', className: 'enw-exp-toggle', onClick: () => setOpen(value => !value), 'aria-expanded': open },
          h('span', { className: 'enw-exp-toggle-main' },
            h(Icon, { name: expansion.meaning ? 'check' : 'sparkles', size: 14 }),
          ),
          h('span', { className: cx('enw-exp-toggle-hint', expansion.meaning && !open && !practice && 'enw-exp-toggle-hint--meaning') },
            open ? t('action.hide') : (practice ? t('action.practiceOn') : (expansion.meaning || t('action.show')))),
          h(Icon, { name: 'chevron', size: 14, className: 'enw-chevron' }),
        ),
        open
          ? h(
            'div',
            { className: 'enw-exp-body' },
            h('div', { className: 'enw-practice-bar' },
              h('button', {
                type: 'button',
                className: cx('enw-practice-btn', practice && 'enw-practice-btn--on'),
                onClick: () => setPractice(value => !value),
                'aria-pressed': practice,
              }, h(Icon, { name: practice ? 'eyeOff' : 'eye', size: 13 }), t('action.practice')),
              practice
                ? h('button', {
                  type: 'button',
                  className: 'enw-practice-reveal',
                  onClick: () => setRevealed(value => !value),
                  'aria-pressed': revealed,
                }, t(revealed ? 'action.hideAnalysis' : 'action.showAnalysis'))
                : null,
              practice && !revealed
                ? h('span', { className: 'enw-practice-hint' }, t(sentenceCategory ? 'practice.hint' : 'practice.hintWord'))
                : null),
            expansion.meaning && !hideAnalysis && (!analysis || !analysis.zh)
              ? h('p', { className: 'enw-exp-meaning' }, expansion.meaning)
              : null,
            expansion.phonetic && !sentenceCategory ? h('p', { className: 'enw-exp-phonetic' }, expansion.phonetic) : null,
            hasStructured
              ? null
              : h('p', { className: 'enw-exp-text' }, expansion.text || t('expansion.empty')),
            !sentenceCategory && asArray(expansion.wordForms).length
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t('expansion.wordForms')),
                h('div', { className: 'enw-forms' }, expansion.wordForms.map((form, index) => h('div', { key: index, className: 'enw-form' },
                  h('span', { className: 'enw-form-kind' }, t(`expansion.form.${form.kind}`)),
                  h('span', { className: 'enw-form-word' }, form.word),
                  form.note ? h('span', { className: 'enw-form-note' }, form.note) : null))))
              : null,
            !sentenceCategory && expansion.discrimination
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t('expansion.discrimination')),
                h('p', { className: 'enw-exp-text' }, expansion.discrimination))
              : null,
            !sentenceCategory && asArray(expansion.collocations).length
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t('expansion.collocations')),
                h('ul', { className: 'enw-exp-list' }, expansion.collocations.map((item, index) => h('li', { key: index }, item))))
              : null,
            !sentenceCategory && asArray(expansion.synonyms).length
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t('expansion.synonyms')),
                h('div', { className: 'enw-exp-chips' }, expansion.synonyms.map((item, index) => h('span', { key: index, className: 'enw-exp-chip' }, item))))
              : null,
            analysis && !hideAnalysis
              ? h('div', { className: 'enw-exp-sec enw-analysis' },
                h(SectionLabel, null, t('expansion.longSentences')),
                analysis.zh
                  ? h('p', { className: 'enw-analysis-zh' },
                    h('span', { className: 'enw-example-tag' }, t('expansion.translation')),
                    h('span', null, analysis.zh))
                  : null,
                analysis.structure
                  ? h('p', { className: 'enw-example-structure' },
                    h('span', { className: 'enw-example-tag' }, t('expansion.structure')),
                    h('span', null, analysis.structure))
                  : null,
                analysis.grammar
                  ? h('p', { className: 'enw-example-grammar' },
                    h('span', { className: 'enw-example-tag' }, t('expansion.grammar')),
                    h('span', null, analysis.grammar))
                  : null,
                analysis.chunk
                  ? h('p', { className: 'enw-example-chunk' },
                    h('span', { className: 'enw-example-tag' }, t('expansion.chunk')),
                    h('strong', null, analysis.chunk),
                    analysis.chunkNote ? h('span', { className: 'enw-example-note' }, ` · ${analysis.chunkNote}`) : null)
                  : null)
              : null,
            !analysis && asArray(expansion.examples).length
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t(sentenceCategory ? 'expansion.longSentences' : 'expansion.examples')),
                asArray(expansion.examples).map((example, index) => h('div', { key: index, className: 'enw-example' },
                  h('div', { className: 'enw-example-en-row' },
                    h('p', { className: 'enw-example-en' }, highlightExample(example.en, entryText, category)),
                    h(SpeakButton, { text: example.en, t, size: 13 })),
                  example.zh && !hideAnalysis ? h('p', { className: 'enw-example-zh' }, highlightTranslation(example.zh, entryTranslation)) : null,
                  example.structure && !hideAnalysis
                    ? h('p', { className: 'enw-example-structure' },
                      h('span', { className: 'enw-example-tag' }, t('expansion.structure')),
                      h('span', null, example.structure))
                    : null,
                  example.grammar && !hideAnalysis
                    ? h('p', { className: 'enw-example-grammar' },
                      h('span', { className: 'enw-example-tag' }, t('expansion.grammar')),
                      h('span', null, example.grammar))
                    : null,
                  example.chunk && !hideAnalysis
                    ? h('p', { className: 'enw-example-chunk' },
                      h('span', { className: 'enw-example-tag' }, t('expansion.chunk')),
                      h('strong', null, example.chunk),
                      example.chunkNote ? h('span', { className: 'enw-example-note' }, ` · ${example.chunkNote}`) : null)
                    : null)))
              : null,
            analysis && extraSentences.length
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t('expansion.moreExamples')),
                extraSentences.map((example, index) => h('div', { key: index, className: 'enw-example' },
                  h('div', { className: 'enw-example-en-row' },
                    h('p', { className: 'enw-example-en' }, highlightExample(example.en, entryText, category)),
                    h(SpeakButton, { text: example.en, t, size: 13 })),
                  example.zh && !hideAnalysis ? h('p', { className: 'enw-example-zh' }, highlightTranslation(example.zh, entryTranslation)) : null)))
              : null,
            !analysis && asArray(expansion.moreExamples).length
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t(sentenceCategory ? 'expansion.moreExamples' : 'expansion.moreShortExamples')),
                asArray(expansion.moreExamples).map((example, index) => h('div', { key: index, className: 'enw-example' },
                  h('div', { className: 'enw-example-en-row' },
                    h('p', { className: 'enw-example-en' }, highlightExample(example.en, entryText, category)),
                    h(SpeakButton, { text: example.en, t, size: 13 })),
                  example.zh && !hideAnalysis ? h('p', { className: 'enw-example-zh' }, highlightTranslation(example.zh, entryTranslation)) : null)))
              : null,
            expansion.tips
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t('expansion.tips')),
                h('p', { className: 'enw-exp-text' }, expansion.tips))
              : null,
            asArray(expansion.related).length
              ? h('div', { className: 'enw-exp-sec' },
                h(SectionLabel, null, t('expansion.related')),
                h('div', { className: 'enw-exp-chips' }, expansion.related.map((item, index) => h('span', { key: index, className: 'enw-exp-chip' }, item))))
              : null,
            h('p', { className: 'enw-exp-meta' },
              expansion.model ? `${expansion.model} · ` : '',
              showUsage && expansion.usage?.total
                ? `${Number(expansion.usage.total).toLocaleString(localeId)} ${t('usage.tokens')} · `
                : '',
              new Intl.DateTimeFormat(localeId, { month: 'short', day: 'numeric' }).format(new Date(expansion.generatedAt || Date.now()))),
          )
          : null,
      )
    }

    function NoteCard({ note, t, localeId, busy, collapseSignal, onExpandAll, onExpandEntry, onUpdate, onDelete, onPin, onTag, onOpen, canReorder = false, onDragStartNote, onDropNote, active = false }) {
      const entries = asArray(note.entries).length
        ? note.entries
        : note.text
          ? [{ id: `${note.id}:legacy`, text: note.text, translation: note.translation || '', expansion: note.expansion }]
          : []
      const [confirming, setConfirming] = useState(false)
      const [editing, setEditing] = useState(false)
      const [draft, setDraft] = useState({ text: '', category: note.category, tags: '' })
      const [editError, setEditError] = useState('')
      const [collapsed, setCollapsed] = useState(true)
      const deleting = busy === `delete:${note.id}`
      const saving = busy === `update:${note.id}`
      const allExpanded = entries.length > 0 && entries.every(entry => entry.expansion)

      const startEdit = () => {
        setDraft({
          text: entries.map(entry => (entry.translation ? `${entry.text} | ${entry.translation}` : entry.text)).join('\n'),
          category: note.category,
          tags: asArray(note.tags).join(', '),
        })
        setEditError('')
        setConfirming(false)
        setEditing(true)
      }

      const saveEdit = async () => {
        const text = draft.text.trim()
        if (!text) {
          setEditError(t('note.editEmpty'))
          return
        }
        const result = await onUpdate(note, {
          text,
          category: draft.category,
          tags: parseTags(draft.tags),
        })
        if (result?.status === 'ok') {
          setEditing(false)
          setConfirming(false)
          setEditError('')
        }
      }

      const expandLabel = allExpanded
        ? t('action.expandAgain')
        : entries.length > 1 ? t('action.expandAll') : t('action.expand')
      const manyEntries = entries.length > 1
      const toggleLabel = collapsed
        ? t(manyEntries ? 'note.expandEntries' : 'note.expandEntry')
        : t(manyEntries ? 'note.collapseEntries' : 'note.collapseEntry')
      const summaryLabel = t(manyEntries ? 'note.expandEntries' : 'note.expandEntry')

      return h(
        'article',
        {
          className: cx('enw-note', `enw-note--${note.category}`, active && 'enw-note--active'),
          'data-note-id': note.id,
          onDragOver: canReorder && onDropNote ? event => event.preventDefault() : undefined,
          onDrop: canReorder && onDropNote
            ? event => {
              event.preventDefault()
              onDropNote(note)
            }
            : undefined,
        },
        h(
          'div',
          { className: 'enw-note-head' },
          canReorder && onDragStartNote
            ? h('span', {
              className: 'enw-drag-handle',
              draggable: true,
              title: t('view.list'),
              onDragStart: event => {
                event.dataTransfer?.setData('text/plain', note.id)
                onDragStartNote(note)
              },
            }, h(Icon, { name: 'grip', size: 13 }))
            : null,
          h('span', { className: 'enw-note-time' }, formatTime(note.createdAt, localeId)),
          h('span', { className: cx('enw-cat', `enw-cat--${note.category}`) }, t(`category.${note.category}`)),
          entries.length > 0 && (manyEntries || !collapsed)
            ? h('button', {
              type: 'button',
              className: 'enw-note-flag enw-note-flag--toggle',
              onClick: () => setCollapsed(value => !value),
              disabled: editing,
              title: toggleLabel,
              'aria-label': toggleLabel,
              'aria-expanded': !collapsed,
            },
            manyEntries ? h('span', null, `${entries.length} ${t('note.entries')}`) : null,
            h(Icon, { name: collapsed ? 'chevronDown' : 'chevronUp', size: 12 }))
            : null,
          allExpanded ? h('span', { className: 'enw-note-flag' }, t('note.expanded')) : null,
          editing
            ? null
            : h('div', { className: 'enw-note-actions' },
              onOpen
                ? h(
                  Btn,
                  {
                    variant: 'quiet',
                    onClick: () => onOpen(note),
                    disabled: Boolean(busy),
                    title: t('note.fullView'),
                    label: t('note.fullView'),
                  },
                  h(Icon, { name: 'maximize', size: 14 }),
                )
                : null,
              onPin
                ? h(
                  Btn,
                  {
                    variant: 'quiet',
                    className: note.pinned ? 'enw-btn--on' : '',
                    onClick: () => onPin(note),
                    disabled: Boolean(busy),
                    title: t(note.pinned ? 'action.unpin' : 'action.pin'),
                    label: t(note.pinned ? 'action.unpin' : 'action.pin'),
                  },
                  h(Icon, { name: 'pin', size: 14 }),
                )
                : null,
              h(
                Btn,
                {
                  variant: 'quiet',
                  onClick: () => {
                    setCollapsed(false)
                    onExpandAll(note, allExpanded)
                  },
                  disabled: Boolean(busy),
                  title: expandLabel,
                  label: expandLabel,
                },
                h(Icon, { name: 'sparkles', size: 15 }),
                h('span', { className: 'enw-btn-text' }, expandLabel),
              ),
              h(
                Btn,
                {
                  variant: 'quiet',
                  onClick: startEdit,
                  disabled: Boolean(busy),
                  title: t('action.edit'),
                  label: t('action.edit'),
                },
                h(Icon, { name: 'edit', size: 15 }),
              ),
            ),
        ),
        editing
          ? h(
            'div',
            { className: 'enw-note-editor' },
            h('textarea', {
              className: 'enw-textarea',
              rows: Math.min(10, Math.max(3, entries.length + 1)),
              value: draft.text,
              onChange: event => setDraft(current => ({ ...current, text: event.target.value })),
            }),
            h('p', { className: 'enw-setting-hint' }, t('note.editHint')),
            h('div', { className: 'enw-cat-row', role: 'group', 'aria-label': t('form.category') },
              CATEGORIES.map(category => h(Chip, {
                key: category,
                active: draft.category === category,
                onClick: () => setDraft(current => ({ ...current, category })),
              }, t(`category.${category}`)))),
            h('input', {
              className: 'enw-input',
              value: draft.tags,
              placeholder: t('form.tags'),
              onChange: event => setDraft(current => ({ ...current, tags: event.target.value })),
            }),
            editError ? h('p', { className: 'enw-setting-error' }, editError) : null,
            confirming
              ? h('div', { className: 'enw-confirm enw-confirm--editor' },
                h('span', { className: 'enw-confirm-text' }, t('action.confirmDelete')),
                h('div', { className: 'enw-confirm-actions' },
                  h(Btn, {
                    variant: 'danger',
                    onClick: () => {
                      setConfirming(false)
                      onDelete(note)
                    },
                    disabled: deleting,
                  }, deleting ? h('span', { className: 'enw-spinner enw-spinner--light' }) : h(Icon, { name: 'trash', size: 14 }), t('action.confirm')),
                  h(Btn, { variant: 'quiet', onClick: () => setConfirming(false) }, t('action.cancel'))))
              : h('div', { className: 'enw-editor-actions' },
                h(Btn, {
                  variant: 'danger',
                  className: 'enw-editor-delete',
                  onClick: () => setConfirming(true),
                  disabled: deleting || saving,
                  title: t('action.delete'),
                  label: t('action.delete'),
                }, h(Icon, { name: 'trash', size: 14 }), t('action.delete')),
                h('div', { className: 'enw-editor-save' },
                  h(Btn, { variant: 'primary', onClick: () => { void saveEdit() }, disabled: saving },
                    saving ? h('span', { className: 'enw-spinner enw-spinner--light' }) : null,
                    h('span', null, t('action.save'))),
                  h(Btn, {
                    variant: 'quiet',
                    onClick: () => {
                      setEditing(false)
                      setConfirming(false)
                    },
                  }, t('action.cancel')))))
          : h(
            React.Fragment,
            null,
            entries.length > 0 && collapsed
              ? h('button', {
                type: 'button',
                className: 'enw-note-summary',
                onClick: () => setCollapsed(false),
                title: summaryLabel,
                'aria-label': summaryLabel,
                'aria-expanded': false,
              },
              h('span', { className: 'enw-note-summary-text' }, entries.map(entry => entry.text).join(' · ')),
              h(Icon, { name: 'chevronDown', size: 14 }))
              : h(
                React.Fragment,
                null,
                h('div', { className: 'enw-entries' },
                  entries.map(entry => h(
                    'div',
                    { key: entry.id, className: 'enw-entry' },
                    h('div', { className: 'enw-entry-head' },
                      h('p', { className: 'enw-entry-text' }, entry.text),
                      h('div', { className: 'enw-entry-tools' },
                        h(SpeakButton, { text: entry.text, t, size: 13 }),
                        h(Btn, {
                          variant: 'quiet',
                          className: 'enw-entry-btn',
                          onClick: () => onExpandEntry(note, entry),
                          disabled: Boolean(busy),
                          title: t(entry.expansion ? 'action.expandAgain' : 'action.expand'),
                          label: t(entry.expansion ? 'action.expandAgain' : 'action.expand'),
                        }, h(Icon, { name: 'sparkles', size: 14 })))),
                    entry.translation ? h('p', { className: 'enw-entry-translation' }, entry.translation) : null,
                    entry.expansion
                      ? h(ExpansionView, {
                        expansion: entry.expansion,
                        t,
                        localeId,
                        showUsage: entries.length === 1,
                        collapseSignal,
                        entryText: entry.text,
                        entryTranslation: entry.translation,
                        category: note.category,
                      })
                      : null,
                    busy === `expand:${note.id}:${entry.id}`
                      ? h('div', { className: 'enw-note-busy' }, h('span', { className: 'enw-spinner' }), t('action.expand'))
                      : null,
                  ))),
                note.tags?.length
                  ? h('div', { className: 'enw-tags' }, note.tags.map(tag => (onTag
                    ? h('button', {
                      key: tag,
                      type: 'button',
                      className: 'enw-tag enw-tag--button',
                      title: `${t('filter.tag')}: ${tag}`,
                      onClick: () => onTag(tag),
                    }, `#${tag}`)
                    : h('span', { key: tag, className: 'enw-tag' }, `#${tag}`))))
                  : null,
              ),
          ),
      )
    }

    // -- quiz card ----------------------------------------------------------

    function formatCountdown(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000))
      const hours = Math.floor(total / 3600)
      const minutes = Math.floor((total % 3600) / 60)
      const seconds = total % 60
      return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':')
    }

    function scheduleDayLabel(target, now, t, localeId) {
      const targetDate = new Date(target)
      const nowDate = new Date(now)
      const dayStart = date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
      const days = Math.round((dayStart(targetDate) - dayStart(nowDate)) / 86400000)
      if (days === 0) return t('quiz.today')
      if (days === 1) return t('quiz.tomorrow')
      return new Intl.DateTimeFormat(localeId, { month: 'short', day: 'numeric' }).format(targetDate)
    }

    function QuizCountdown({ nextAt, pending, enabled, t, localeId, onRefresh }) {
      const [now, setNow] = useState(() => Date.now())
      const [poll, setPoll] = useState(0)
      const refreshRef = useRef(onRefresh)

      useEffect(() => {
        refreshRef.current = onRefresh
      }, [onRefresh])

      useEffect(() => {
        if (!enabled || pending || !nextAt) return undefined
        setNow(Date.now())
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
      }, [enabled, pending, nextAt])

      // Refresh once the target passes; the quiz may need a few seconds to build.
      useEffect(() => {
        if (!enabled || pending || !nextAt) return undefined
        const wait = Math.max(0, nextAt - Date.now()) + 2500
        const timer = setTimeout(() => refreshRef.current?.(), wait)
        return () => clearTimeout(timer)
      }, [enabled, pending, nextAt])

      // While the Host reports the quiz as due, poll briefly for the new one.
      useEffect(() => {
        if (!pending) {
          setPoll(0)
          return undefined
        }
        if (poll >= 15) return undefined
        const timer = setTimeout(() => {
          setPoll(value => value + 1)
          refreshRef.current?.()
        }, 8000)
        return () => clearTimeout(timer)
      }, [pending, poll])

      if (!enabled) {
        return h('div', { className: 'enw-quiz-timer enw-quiz-timer--muted' },
          h(Icon, { name: 'clock', size: 14 }),
          h('span', { className: 'enw-quiz-timer-label' }, t('quiz.paused')))
      }

      if (pending) {
        return h('div', { className: 'enw-quiz-timer enw-quiz-timer--wait' },
          h(Icon, { name: 'clock', size: 14 }),
          h('span', { className: 'enw-quiz-timer-label' }, t('quiz.soon')),
          h('button', {
            type: 'button',
            className: 'enw-quiz-refresh',
            onClick: () => refreshRef.current?.(),
          }, t('action.refresh')))
      }

      if (!nextAt) return null

      const remaining = nextAt - now
      const clock = new Intl.DateTimeFormat(localeId, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(nextAt))
      return h('div', { className: cx('enw-quiz-timer', remaining <= 0 && 'enw-quiz-timer--wait') },
        h(Icon, { name: 'clock', size: 14 }),
        h('span', { className: 'enw-quiz-timer-label' }, `${t('quiz.next')} · ${scheduleDayLabel(nextAt, now, t, localeId)} ${clock}`),
        h('span', { className: 'enw-quiz-countdown' }, remaining > 0 ? formatCountdown(remaining) : t('quiz.soon')))
    }

    function QuizCard({ quiz, history, t, localeId, busy, modelAvailable, settings, nextQuizAt, quizPending, dueCount = 0, inModal = false, active = true, onClose, closeButtonRef, onRefresh, onGenerate, onGrade, onModelGrade }) {
      const attempt = quiz?.attempt && typeof quiz.attempt === 'object' ? quiz.attempt : null
      const items = asArray(quiz?.items)
      const [answers, setAnswers] = useState({})
      const [reveal, setReveal] = useState(false)
      const [confirming, setConfirming] = useState(false)
      const [collapsed, setCollapsed] = useState(() => {
        if (inModal) return false
        try {
          const stored = window.localStorage.getItem(QUIZ_COLLAPSED_KEY)
          if (stored === '1') return true
          if (stored === '0') return false
        } catch {
          /* storage may be unavailable */
        }
        return items.length > 4
      })
      const generating = busy === 'quiz'
      const grading = busy === 'grade'
      const gradingModel = busy === 'grade-model'

      useEffect(() => {
        setAnswers(attempt?.answers && typeof attempt.answers === 'object' ? attempt.answers : {})
        setReveal(Boolean(attempt))
        setConfirming(false)
      }, [quiz?.date, quiz?.createdAt, attempt?.submittedAt])

      useEffect(() => {
        if (inModal && active) setCollapsed(false)
      }, [active, inModal])

      const answeredCount = items.filter(item => String(answers[item.id] ?? '').trim()).length

      const toggleCollapsed = () => {
        setCollapsed(current => {
          const next = !current
          try {
            window.localStorage.setItem(QUIZ_COLLAPSED_KEY, next ? '1' : '0')
          } catch {
            /* storage may be unavailable */
          }
          return next
        })
      }

      const formatScore = value => {
        const numeric = Number(value)
        if (!Number.isFinite(numeric)) return '0'
        return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1)
      }

      const verdictOf = item => {
        if (!attempt) return ''
        if (!String(answers[item.id] ?? '').trim()) return 'blank'
        if (attempt.mode === 'model') {
          return attempt.feedback?.[item.id]?.verdict || 'incorrect'
        }
        if (attempt.correct?.[item.id]) return 'correct'
        return item.open ? 'review' : 'incorrect'
      }

      const verdictLabel = verdict => {
        if (verdict === 'correct') return t('quiz.correct')
        if (verdict === 'partial') return t('quiz.partial')
        if (verdict === 'review') return t('quiz.openReview')
        if (verdict === 'blank') return t('quiz.notAnswered')
        return t('quiz.wrong')
      }

      const schedule = h(QuizCountdown, {
        nextAt: nextQuizAt ?? null,
        pending: Boolean(quizPending),
        enabled: settings?.enabled !== false && active,
        t,
        localeId,
        onRefresh,
      })

      if (!quiz) {
        return h(
          'section',
          { className: cx('enw-card', 'enw-aside-card', inModal && 'enw-quiz-card--modal') },
          h('div', { className: 'enw-aside-head' },
            h('span', { className: 'enw-aside-title' }, h(Icon, { name: 'target', size: 16 }), t('quiz.title')),
            h('div', { className: 'enw-quiz-head-actions' },
              h('span', { className: 'enw-aside-date' }, t('quiz.today')),
              onClose
                ? h('button', {
                  type: 'button',
                  ref: closeButtonRef,
                  className: 'enw-icon-btn enw-modal-close',
                  onClick: onClose,
                  title: t('action.close'),
                  'aria-label': t('action.close'),
                }, h(Icon, { name: 'close', size: 16 }))
                : null)),
          schedule,
          h('p', { className: 'enw-aside-empty-title' }, t('quiz.empty')),
          h('p', { className: 'enw-aside-hint' }, t('quiz.emptyHint')),
          dueCount > 0 ? h('p', { className: 'enw-aside-hint' }, `${t('quiz.due')}: ${dueCount}`) : null,
          h(Btn, { variant: 'primary', onClick: () => onGenerate(false), disabled: generating, className: 'enw-block' },
            generating ? h('span', { className: 'enw-spinner enw-spinner--light' }) : h(Icon, { name: 'sparkles', size: 15 }),
            h('span', null, t(generating ? 'quiz.generating' : 'quiz.generate'))),
        )
      }

      return h(
        'section',
        { className: cx('enw-card', 'enw-aside-card', inModal && 'enw-quiz-card--modal') },
        h('div', { className: 'enw-aside-head' },
          h('span', { className: 'enw-aside-title' }, h(Icon, { name: 'target', size: 16 }), t('quiz.title')),
          h('div', { className: 'enw-quiz-head-actions' },
            h('span', { className: 'enw-aside-date' }, formatQuizDate(quiz.date, localeId)),
            h('button', {
              type: 'button',
              className: 'enw-icon-btn',
              onClick: () => { setConfirming(true); setCollapsed(false) },
              title: t('action.regenerate'),
              'aria-label': t('action.regenerate'),
            }, h(Icon, { name: 'refresh', size: 14 })),
            h('button', {
              type: 'button',
              className: 'enw-icon-btn',
              onClick: toggleCollapsed,
              title: t(collapsed ? 'quiz.expand' : 'quiz.collapse'),
              'aria-label': t(collapsed ? 'quiz.expand' : 'quiz.collapse'),
              'aria-expanded': !collapsed,
            }, h(Icon, { name: collapsed ? 'chevronDown' : 'chevronUp', size: 16 })),
            onClose
              ? h('button', {
                type: 'button',
                ref: closeButtonRef,
                className: 'enw-icon-btn enw-modal-close',
                onClick: onClose,
                title: t('action.close'),
                'aria-label': t('action.close'),
              }, h(Icon, { name: 'close', size: 16 }))
              : null)),
        schedule,
        h('div', { className: 'enw-quiz-meta' },
          h('span', { className: cx('enw-pill', attempt ? 'enw-pill--ok' : 'enw-pill--wait') }, attempt ? t('quiz.done') : t('quiz.pending')),
          dueCount > 0 ? h('span', { className: 'enw-pill enw-pill--brand' }, `${t('quiz.due')} ${dueCount}`) : null,
          h('span', { className: cx('enw-pill', quiz.source === 'local' ? 'enw-pill--muted' : 'enw-pill--brand') }, t(quiz.source === 'local' ? 'quiz.source.local' : 'quiz.source.model')),
          attempt ? h('span', { className: 'enw-quiz-score' }, `${formatScore(attempt.score)}/${attempt.total}`) : null),
        collapsed
          ? h('p', { className: 'enw-quiz-collapsed' }, t('quiz.expand'))
          : h(
            React.Fragment,
            null,
            quiz.source === 'local' && !modelAvailable ? h('p', { className: 'enw-aside-hint' }, t('quiz.localNote')) : null,
            h('ol', { className: 'enw-quiz-list' },
              items.map((item, index) => {
                const value = String(answers[item.id] ?? '')
                const verdict = verdictOf(item)
                const feedback = attempt?.mode === 'model' ? attempt.feedback?.[item.id] : null
                const openHint = item.open && (!attempt || attempt.mode === 'exact')
                  ? h('p', { className: 'enw-quiz-open-hint' }, t('quiz.openHint'))
                  : null
                return h(
                  'li',
                  { key: item.id, className: 'enw-quiz-item' },
                  h('div', { className: 'enw-quiz-item-head' },
                    h('span', { className: 'enw-quiz-type' }, t(`quiz.type.${item.type}`)),
                    h('span', { className: 'enw-quiz-index' }, String(index + 1))),
                  item.type === 'dictation'
                    ? h('div', { className: 'enw-dictation' },
                      h('p', { className: 'enw-quiz-prompt' }, t('quiz.dictationHint')),
                      h('button', {
                        type: 'button',
                        className: 'enw-dictation-play',
                        onClick: () => speak(item.answer),
                      }, h(Icon, { name: 'volume', size: 15 }), t('quiz.play')))
                    : h('p', { className: 'enw-quiz-prompt' }, item.prompt),
                  openHint,
                  item.hint && !attempt && reveal ? h('p', { className: 'enw-quiz-hint' }, `${t('quiz.hint')}: ${item.hint}`) : null,
                  attempt
                    ? h('div', { className: 'enw-quiz-result' },
                      h('div', { className: cx('enw-quiz-verdict', `enw-quiz-verdict--${verdict === 'review' ? 'open' : verdict === 'blank' ? 'blank' : verdict === 'partial' ? 'warn' : verdict === 'correct' ? 'ok' : 'bad'}`) },
                        h(Icon, { name: verdict === 'correct' ? 'check' : verdict === 'incorrect' ? 'refresh' : verdict === 'blank' ? 'close' : 'sparkles', size: 13 }),
                        h('span', null, verdictLabel(verdict))),
                      h('p', { className: 'enw-quiz-your' },
                        h('span', { className: 'enw-quiz-label' }, t('quiz.yourAnswer')),
                        h('span', null, value.trim() ? value : t('quiz.noAnswer'))),
                      h('p', { className: 'enw-quiz-answer' },
                        h('span', { className: 'enw-quiz-label' }, t('quiz.answer')),
                        h('strong', null, item.answer)),
                      feedback?.feedback
                        ? h('p', { className: 'enw-quiz-feedback' },
                          h('span', { className: 'enw-quiz-label' }, t('quiz.feedback')),
                          h('span', null, feedback.feedback))
                        : null,
                      feedback?.better
                        ? h('p', { className: 'enw-quiz-better' },
                          h('span', { className: 'enw-quiz-label' }, t('quiz.better')),
                          h('span', null, feedback.better))
                        : null,
                      asArray(feedback?.related).length
                        ? h('div', { className: 'enw-quiz-related' },
                          h('span', { className: 'enw-quiz-label' }, t('quiz.related')),
                          h('div', { className: 'enw-exp-chips' }, feedback.related.map((entry, entryIndex) => h('span', { key: entryIndex, className: 'enw-exp-chip' }, entry))))
                        : null,
                      item.explanation ? h('p', { className: 'enw-quiz-explanation' }, item.explanation) : null)
                    : h(
                      item.type === 'cn2en' || item.type === 'usage' || item.type === 'sentence'
                        ? 'textarea'
                        : 'input',
                      {
                        className: 'enw-quiz-input',
                        value,
                        rows: item.type === 'cn2en' || item.type === 'usage' || item.type === 'sentence' ? 2 : undefined,
                        placeholder: t('quiz.blank'),
                        onChange: event => setAnswers(current => ({ ...current, [item.id]: event.target.value })),
                      },
                    ),
                  !attempt && reveal
                    ? h('p', { className: 'enw-quiz-answer' },
                      h('span', { className: 'enw-quiz-label' }, t('quiz.answer')),
                      h('strong', null, item.answer),
                      item.explanation ? h('span', { className: 'enw-quiz-explanation' }, item.explanation) : null)
                    : null,
                )
              })),
            attempt?.mode === 'model' && attempt.summary
              ? h('div', { className: 'enw-quiz-summary-block' },
                h(SectionLabel, null, t('quiz.summary')),
                h('p', { className: 'enw-quiz-feedback' }, attempt.summary))
              : null,
            h('div', { className: 'enw-quiz-footer' },
              h('span', { className: 'enw-quiz-progress' }, attempt
                ? `${formatScore(attempt.score)}/${attempt.total}`
                : `${answeredCount}/${items.length}`),
              h('div', { className: 'enw-quiz-footer-actions' },
                !attempt
                  ? h(Btn, { variant: 'quiet', onClick: () => setReveal(current => !current) }, t(reveal ? 'action.hideAnswers' : 'action.viewAnswer'))
                  : null,
                h(Btn, {
                  variant: 'ghost',
                  onClick: () => onGrade(answers),
                  disabled: grading || gradingModel || (!attempt && answeredCount === 0),
                }, grading ? h('span', { className: 'enw-spinner' }) : h(Icon, { name: 'check', size: 14 }),
                h('span', null, t(attempt || modelAvailable ? 'quiz.gradeExact' : 'action.submit'))),
                modelAvailable
                  ? h(Btn, {
                    variant: 'primary',
                    onClick: () => onModelGrade(answers),
                    disabled: gradingModel || grading || (!attempt && answeredCount === 0),
                  }, gradingModel ? h('span', { className: 'enw-spinner enw-spinner--light' }) : h(Icon, { name: 'sparkles', size: 14 }),
                  h('span', null, t(gradingModel ? 'quiz.gradingModel' : 'quiz.gradeModel')))
                  : null)),
            !modelAvailable ? h('p', { className: 'enw-aside-hint' }, t('quiz.noModel')) : null,
            confirming
              ? h('div', { className: 'enw-confirm enw-confirm--card' },
                h('span', { className: 'enw-confirm-text' }, t('quiz.confirmRegenerate')),
                h('div', { className: 'enw-confirm-actions' },
                  h(Btn, { variant: 'danger', onClick: () => { setConfirming(false); onGenerate(true) }, disabled: generating }, t('quiz.replace')),
                  h(Btn, { variant: 'quiet', onClick: () => setConfirming(false) }, t('action.cancel'))))
              : null,
            h('div', { className: 'enw-quiz-history' },
              h(SectionLabel, null, t('quiz.history')),
              h('div', { className: 'enw-history-row' },
                history.length
                  ? history.slice(0, 7).reverse().map(entry => h('span', {
                    key: entry.date,
                    className: cx('enw-history-dot', entry.attempted && 'enw-history-dot--done', entry.date === quiz.date && 'enw-history-dot--today'),
                    title: `${entry.date} · ${entry.attempted ? `${entry.score}/${entry.total}` : t('quiz.pending')}`,
                  }, entry.attempted ? String(entry.score) : '·'))
                  : h('span', { className: 'enw-history-empty' }, '—'))),
          ),
      )
    }

    // -- settings card ------------------------------------------------------

    function SettingsCard({ settings, model, promptDefaults, t, localeId = 'en-US', backup, busy, api, onRefresh, onSave, onClose }) {
      const initialLlm = settings.llm && typeof settings.llm === 'object'
        ? settings.llm
        : { provider: '', model: '', reasoningEffort: '' }
      const initialPrompts = settings.prompts && typeof settings.prompts === 'object' ? settings.prompts : {}
      const [draft, setDraft] = useState({ ...settings, llm: { ...initialLlm }, prompts: { ...initialPrompts } })
      const [dirty, setDirty] = useState(false)
      const [catalog, setCatalog] = useState(null)
      const [catalogBusy, setCatalogBusy] = useState(true)
      const [catalogError, setCatalogError] = useState('')
      const [promptsOpen, setPromptsOpen] = useState(false)
      const [promptKey, setPromptKey] = useState('expansion')
      const [dataBusy, setDataBusy] = useState('')
      const [dataError, setDataError] = useState('')
      const [dataNotice, setDataNotice] = useState('')
      const importRef = useRef(null)
      const saving = busy === 'settings'
      const llm = draft.llm || { provider: '', model: '', reasoningEffort: '' }
      const prompts = draft.prompts || {}
      const followingDefault = !llm.provider

      const update = patch => {
        setDraft(current => ({ ...current, ...patch }))
        setDirty(true)
      }

      const setPrompt = value => {
        setDraft(current => ({
          ...current,
          prompts: { ...(current.prompts || {}), [promptKey]: value },
        }))
        setDirty(true)
      }

      const loadCatalog = async (provider, modelId) => {
        setCatalogBusy(true)
        setCatalogError('')
        try {
          const data = await api.llmCatalog(provider || '', modelId || '')
          setCatalog(data)
          return data
        } catch (error) {
          setCatalogError(errorText(error))
          return null
        } finally {
          setCatalogBusy(false)
        }
      }

      useEffect(() => {
        void loadCatalog(llm.provider, llm.model)
      }, [])

      const onProvider = async value => {
        if (!value) {
          update({ llm: { provider: '', model: '', reasoningEffort: '' } })
          void loadCatalog('', '')
          return
        }
        update({ llm: { provider: value, model: '', reasoningEffort: '' } })
        const data = await loadCatalog(value, '')
        const suggested = data?.suggested?.model || ''
        if (suggested) update({ llm: { provider: value, model: suggested, reasoningEffort: '' } })
      }

      const onModel = async value => {
        update({ llm: { ...llm, model: value, reasoningEffort: '' } })
        await loadCatalog(llm.provider, value)
      }

      const onEffort = value => update({ llm: { ...llm, reasoningEffort: value } })

      const exportAs = async format => {
        if (!api || dataBusy) return
        setDataBusy(`export-${format}`)
        setDataError('')
        setDataNotice('')
        try {
          const result = await api.exportData(format)
          if (result?.status !== 'ok') {
            setDataError(result?.message || t('error.action'))
            return
          }
          if (!saveTextFile(result.filename, result.content, result.mime)) {
            setDataError(t('error.action'))
          }
        } catch (error) {
          setDataError(errorText(error) || t('error.action'))
        } finally {
          setDataBusy('')
        }
      }

      const importFile = async event => {
        const file = event.target?.files?.[0]
        if (event.target) event.target.value = ''
        if (!file || !api || dataBusy) return
        setDataBusy('import')
        setDataError('')
        setDataNotice('')
        try {
          const content = await file.text()
          const result = await api.importData(content)
          if (result?.status !== 'ok') {
            setDataError(result?.message || t('error.action'))
            return
          }
          setDataNotice(`${t('notice.imported')} ${result.addedNotes} · ${result.addedEntries}`)
          await onRefresh?.()
        } catch (error) {
          setDataError(errorText(error) || t('error.action'))
        } finally {
          setDataBusy('')
        }
      }

      const runBackup = async () => {
        if (!api || dataBusy) return
        setDataBusy('backup')
        setDataError('')
        setDataNotice('')
        try {
          const result = await api.backupNow()
          if (result?.status !== 'ok') {
            setDataError(result?.message || t('error.action'))
            return
          }
          setDataNotice(t('notice.backup'))
          await onRefresh?.()
        } catch (error) {
          setDataError(errorText(error) || t('error.action'))
        } finally {
          setDataBusy('')
        }
      }

      const providers = asArray(catalog?.providers)
      const models = asArray(catalog?.models)
      const efforts = asArray(catalog?.efforts)

      return h(
        'section',
        { className: 'enw-card enw-aside-card' },
        h('div', { className: 'enw-aside-head' },
          h('span', { className: 'enw-aside-title' }, h(Icon, { name: 'settings', size: 16 }), t('settings.title')),
          h('button', { type: 'button', className: 'enw-icon-btn', onClick: onClose, 'aria-label': t('action.close') }, h(Icon, { name: 'close', size: 15 }))),
        h('div', { className: 'enw-setting-row' },
          h('div', { className: 'enw-setting-text' },
            h('span', { className: 'enw-setting-label' }, t('settings.enabled')),
            h('span', { className: 'enw-setting-hint' }, t('settings.quizHint'))),
          h(Toggle, { checked: Boolean(draft.enabled), onChange: value => update({ enabled: value }), label: t('settings.enabled') })),
        h('div', { className: 'enw-setting-row' },
          h('label', { className: 'enw-setting-label', htmlFor: 'enw-quiz-time' }, t('settings.time')),
          h('input', {
            id: 'enw-quiz-time',
            className: 'enw-input enw-input--time',
            type: 'time',
            value: draft.quizTime,
            onChange: event => update({ quizTime: event.target.value }),
          })),
        h('div', { className: 'enw-setting-row' },
          h('label', { className: 'enw-setting-label', htmlFor: 'enw-quiz-count' }, t('settings.count')),
          h('input', {
            id: 'enw-quiz-count',
            className: 'enw-input enw-input--count',
            type: 'number',
            min: 1,
            max: 10,
            value: draft.dailyCount,
            onChange: event => update({ dailyCount: Number(event.target.value) }),
          })),
        h('div', { className: 'enw-settings-group' },
          h('div', { className: 'enw-settings-group-head' }, t('settings.expansionTitle')),
          h('p', { className: 'enw-setting-hint', style: { marginTop: 0, marginBottom: 2 } }, t('settings.modelHint')),
          h('label', { className: 'enw-field' },
            h('span', { className: 'enw-field-label' }, t('settings.provider')),
            h('select', {
              className: 'enw-select',
              value: llm.provider,
              disabled: catalogBusy && !providers.length,
              onChange: event => { void onProvider(event.target.value) },
            },
            h('option', { value: '' }, t('settings.followDefault')),
            !providers.some(provider => provider.id === llm.provider) && llm.provider
              ? h('option', { value: llm.provider }, llm.provider)
              : null,
            providers.map(provider => h('option', { key: provider.id, value: provider.id }, provider.name ? `${provider.name} (${provider.id})` : provider.id)))),
          followingDefault
            ? h('p', { className: 'enw-setting-hint' }, model.available
              ? `${t('settings.followDefault')} · ${model.label}`
              : t('settings.modelNone'))
            : h(
              'label',
              { className: 'enw-field' },
              h('span', { className: 'enw-field-label' }, t('settings.model')),
              h('select', {
                className: 'enw-select',
                value: llm.model,
                disabled: catalogBusy || !models.length,
                onChange: event => { void onModel(event.target.value) },
              },
              !models.some(candidate => candidate.id === llm.model)
                ? h('option', { value: '' }, t('settings.modelNone'))
                : null,
              models.map(candidate => h('option', { key: candidate.id, value: candidate.id }, candidate.name ? `${candidate.name} (${candidate.id})` : candidate.id))),
            ),
          !followingDefault
            ? h(
              'label',
              { className: 'enw-field' },
              h('span', { className: 'enw-field-label' }, t('settings.reasoning')),
              h('select', {
                className: 'enw-select',
                value: llm.reasoningEffort,
                disabled: catalogBusy || !efforts.length,
                onChange: event => onEffort(event.target.value),
              },
              h('option', { value: '' }, t('settings.modelDefault')),
              efforts.map(effort => h('option', { key: effort.id, value: effort.id }, effort.name ? `${effort.name} (${effort.id})` : effort.id))),
            )
            : null,
          catalogBusy ? h('p', { className: 'enw-setting-hint' }, t('settings.catalogLoading')) : null,
          catalogError ? h('p', { className: 'enw-setting-error' }, `${t('settings.catalogError')} ${catalogError}`) : null,
          !followingDefault && !catalogBusy && !efforts.length
            ? h('p', { className: 'enw-setting-hint' }, t('settings.reasoningNone'))
            : null),
        h('div', { className: 'enw-settings-group' },
          h('div', { className: 'enw-settings-group-head' }, t('settings.priceTitle')),
          h('p', { className: 'enw-setting-hint', style: { marginTop: 0, marginBottom: 4 } }, t('settings.priceHint')),
          h('div', { className: 'enw-price-grid' },
            h('label', { className: 'enw-field' },
              h('span', { className: 'enw-field-label' }, t('settings.priceInput')),
              h('input', {
                className: 'enw-input',
                type: 'number',
                min: 0,
                step: '0.001',
                value: draft.priceInput ?? 0,
                onChange: event => update({ priceInput: Number(event.target.value) }),
              })),
            h('label', { className: 'enw-field' },
              h('span', { className: 'enw-field-label' }, t('settings.priceOutput')),
              h('input', {
                className: 'enw-input',
                type: 'number',
                min: 0,
                step: '0.001',
                value: draft.priceOutput ?? 0,
                onChange: event => update({ priceOutput: Number(event.target.value) }),
              })),
            h('label', { className: 'enw-field enw-price-currency' },
              h('span', { className: 'enw-field-label' }, t('settings.currency')),
              h('input', {
                className: 'enw-input',
                type: 'text',
                maxLength: 8,
                value: draft.currency ?? '$',
                onChange: event => update({ currency: event.target.value }),
              })))),
        h('div', { className: 'enw-settings-group' },
          h('div', { className: 'enw-settings-group-head' }, t('settings.dataTitle')),
          h('p', { className: 'enw-setting-hint', style: { marginTop: 0, marginBottom: 6 } }, t('settings.dataHint')),
          h('div', { className: 'enw-data-actions' },
            ['json', 'csv', 'anki'].map(format => h(Btn, {
              key: format,
              variant: 'quiet',
              onClick: () => { void exportAs(format) },
              disabled: Boolean(dataBusy),
            },
            dataBusy === `export-${format}` ? h('span', { className: 'enw-spinner' }) : h(Icon, { name: 'download', size: 14 }),
            h('span', null, t(`settings.export${format === 'json' ? 'Json' : format === 'csv' ? 'Csv' : 'Anki'}`)))),
            h(Btn, {
              variant: 'quiet',
              onClick: () => importRef.current?.click(),
              disabled: Boolean(dataBusy),
            },
            dataBusy === 'import' ? h('span', { className: 'enw-spinner' }) : h(Icon, { name: 'upload', size: 14 }),
            h('span', null, t(dataBusy === 'import' ? 'settings.importing' : 'settings.import'))),
            h('input', {
              ref: importRef,
              type: 'file',
              accept: '.json,application/json',
              className: 'enw-file-input',
              onChange: event => { void importFile(event) },
            })),
          h('div', { className: 'enw-data-backup' },
            h('span', { className: 'enw-setting-hint' }, backup?.count
              ? `${t('settings.backupCount')}: ${backup.count} · ${new Date(backup.lastAt).toLocaleString(localeId)}`
              : t('settings.backupNever')),
            h(Btn, { variant: 'quiet', onClick: () => { void runBackup() }, disabled: Boolean(dataBusy) },
              dataBusy === 'backup' ? h('span', { className: 'enw-spinner' }) : h(Icon, { name: 'download', size: 14 }),
              h('span', null, t('settings.backupNow')))),
          dataNotice ? h('p', { className: 'enw-setting-hint enw-data-notice' }, dataNotice) : null,
          dataError ? h('p', { className: 'enw-setting-error' }, dataError) : null),
        h('div', { className: 'enw-settings-group' },
          h('div', { className: 'enw-settings-group-head enw-prompt-head' },
            h('span', null, t('settings.prompts')),
            h('button', {
              type: 'button',
              className: 'enw-link-btn',
              onClick: () => setPromptsOpen(value => !value),
              'aria-expanded': promptsOpen,
            }, t(promptsOpen ? 'action.hide' : 'settings.promptsToggle'))),
          promptsOpen
            ? h('div', { className: 'enw-prompts' },
              h('div', { className: 'enw-cat-row' },
                PROMPT_TASKS.map(key => h(Chip, {
                  key,
                  active: promptKey === key,
                  onClick: () => setPromptKey(key),
                }, t(`settings.prompt.${key}`)))),
              h('p', { className: 'enw-setting-hint' }, t('settings.promptsHint')),
              h('p', { className: 'enw-prompt-placeholders' },
                t('settings.prompt.placeholders'),
                ' ',
                asArray(PROMPT_PLACEHOLDERS[promptKey]).join('  ')),
              h('textarea', {
                className: 'enw-prompt-input',
                rows: 9,
                value: prompts[promptKey] || '',
                placeholder: promptDefaults?.[promptKey] || '',
                onChange: event => setPrompt(event.target.value),
              }),
              promptKey === 'organize'
                ? h('p', { className: 'enw-setting-hint' }, t('settings.prompt.organizeHint'))
                : null,
              h('div', { className: 'enw-prompt-actions' },
                h(Btn, { variant: 'quiet', onClick: () => setPrompt(promptDefaults?.[promptKey] || '') }, t('settings.prompt.loadDefault')),
                h(Btn, { variant: 'quiet', onClick: () => setPrompt('') }, t('settings.prompt.reset'))),
            )
            : null),
        h('div', { className: 'enw-settings-actions' },
          h(Btn, { variant: 'quiet', onClick: onClose }, t('action.cancel')),
          h(Btn, { variant: 'primary', onClick: () => onSave(draft), disabled: !dirty || saving },
            saving ? h('span', { className: 'enw-spinner enw-spinner--light' }) : null,
            h('span', null, t('action.save')))),
      )
    }

    // -- usage card ---------------------------------------------------------

    function UsageCard({ usage, settings, t, localeId }) {
      const [showBreakdown, setShowBreakdown] = useState(false)
      const total = usage?.total || { input: 0, output: 0, total: 0, calls: 0 }
      const last = usage?.last || null
      const format = value => Number(value || 0).toLocaleString(localeId)
      const priceInput = Math.max(0, Number(settings?.priceInput) || 0)
      const priceOutput = Math.max(0, Number(settings?.priceOutput) || 0)
      const currency = String(settings?.currency || '$').trim() || '$'
      const priced = priceInput > 0 || priceOutput > 0
      const costOf = record => {
        if (!record) return 0
        return (Number(record.input || 0) / 1_000_000) * priceInput
          + (Number(record.output || 0) / 1_000_000) * priceOutput
      }
      const formatCost = value => {
        if (!Number.isFinite(value) || value <= 0) return `${currency}0`
        if (value < 0.0001) return `<${currency}0.0001`
        return `${currency}${value.toFixed(value >= 1 ? 2 : 4)}`
      }
      const purposeLabel = last?.purpose && USAGE_PURPOSE_KEYS.includes(last.purpose)
        ? t(`usage.purpose.${last.purpose}`)
        : ''
      const purposes = usage?.purposes || {}
      const purposeRows = USAGE_PURPOSE_KEYS
        .map(key => ({ key, bucket: purposes[key] }))
        .filter(row => row.bucket && (row.bucket.calls > 0 || row.bucket.total > 0))
      const breakdownCalls = purposeRows.reduce((sum, row) => sum + (row.bucket.calls || 0), 0)
      const partialBreakdown = breakdownCalls < total.calls

      return h(
        'section',
        { className: 'enw-card enw-aside-card' },
        h('div', { className: 'enw-aside-head' },
          h('span', { className: 'enw-aside-title' }, h(Icon, { name: 'target', size: 16 }), t('usage.title'))),
        last
          ? h(
            'div',
            { className: 'enw-usage' },
            h('div', { className: 'enw-usage-head' },
              purposeLabel ? h('span', { className: 'enw-usage-purpose' }, purposeLabel) : null,
              h('span', { className: 'enw-usage-model' }, last.model || '—'),
              last.reasoningEffort ? h('span', { className: 'enw-usage-effort' }, last.reasoningEffort) : null,
              last.at ? h('span', { className: 'enw-usage-time' }, formatTime(last.at, localeId)) : null),
            h('div', { className: 'enw-usage-grid' },
              h('div', { className: 'enw-usage-cell' }, h('span', null, t('usage.input')), h('strong', null, format(last.input))),
              h('div', { className: 'enw-usage-cell' }, h('span', null, t('usage.output')), h('strong', null, format(last.output))),
              h('div', { className: 'enw-usage-cell' }, h('span', null, t('usage.total')), h('strong', null, format(last.total)))),
            !last.reported ? h('p', { className: 'enw-setting-hint' }, t('usage.unreported')) : null,
            h('div', { className: 'enw-usage-total' },
              h('span', { className: 'enw-setting-hint' }, t('usage.total')),
              h('strong', null, `${format(total.total)} ${t('usage.tokens')} · ${total.calls} ${t('usage.calls')}`)),
            priced
              ? h('div', { className: 'enw-usage-cost' },
                h('span', { className: 'enw-setting-hint' }, t('usage.cost')),
                h('strong', null, formatCost(costOf(total))))
              : h('p', { className: 'enw-setting-hint' }, t('usage.costHint')),
            purposeRows.length
              ? h('div', { className: 'enw-usage-breakdown' },
                h('button', {
                  type: 'button',
                  className: 'enw-link-btn',
                  onClick: () => setShowBreakdown(value => !value),
                  'aria-expanded': showBreakdown,
                }, t('usage.breakdown')),
                showBreakdown
                  ? h(React.Fragment, null,
                    h('div', { className: 'enw-usage-purposes' },
                      purposeRows.map(row => h('div', { key: row.key, className: 'enw-usage-purpose-row' },
                        h('span', { className: 'enw-usage-purpose-name' }, t(`usage.purpose.${row.key}`)),
                        h('span', { className: 'enw-usage-purpose-meta' }, `${format(row.bucket.total)} ${t('usage.tokens')} · ${row.bucket.calls} ${t('usage.calls')}`),
                        priced ? h('span', { className: 'enw-usage-purpose-cost' }, formatCost(costOf(row.bucket))) : null))),
                    partialBreakdown ? h('p', { className: 'enw-setting-hint' }, t('usage.breakdownHint')) : null)
                  : null)
              : null,
          )
          : h('p', { className: 'enw-aside-hint' }, t('usage.empty')),
      )
    }


    // -- organize panel -----------------------------------------------------

    function OrganizePanel({ plan, notes, t, localeId, busy, onApply, onClose }) {
      const byId = useMemo(() => new Map(asArray(notes).map(note => [note.id, note])), [notes])
      const applying = busy === 'organize-apply'
      const groups = asArray(plan?.groups)
      const categories = asArray(plan?.categories).filter(item => byId.has(item.noteId))
      const relations = asArray(plan?.relations)

      const labelOf = note => {
        const entry = asArray(note?.entries)[0]
        if (!entry) return note?.text || ''
        return entry.translation ? `${entry.text} · ${entry.translation}` : entry.text
      }

      return h('section', { className: 'enw-card enw-organize' },
        h('div', { className: 'enw-organize-head' },
          h('div', { className: 'enw-organize-head-main' },
            h('h2', { className: 'enw-organize-title' },
              h(Icon, { name: 'sparkles', size: 16 }),
              h('span', null, t('organize.title'))),
            plan?.summary ? h('p', { className: 'enw-organize-summary' }, plan.summary) : null,
            h('p', { className: 'enw-organize-hint' }, t('organize.planHint'))),
          h('button', {
            type: 'button',
            className: 'enw-icon-btn',
            onClick: onClose,
            disabled: applying,
            title: t('action.cancel'),
            'aria-label': t('action.cancel'),
          }, h(Icon, { name: 'close', size: 15 }))),

        groups.length
          ? h(React.Fragment, null,
            h('div', { className: 'enw-organize-label' }, t('organize.groups')),
              h('div', { className: 'enw-organize-groups' },
                groups.map((group, index) => h('div', { key: `${group.title}-${index}`, className: 'enw-organize-group' },
                  h('div', { className: 'enw-organize-group-head' },
                    h('span', { className: 'enw-organize-group-title' }, group.title),
                    h('span', { className: 'enw-organize-count' }, `${asArray(group.noteIds).length} ${t('organize.notesUnit')}`)),
                  group.summary ? h('p', { className: 'enw-organize-group-summary' }, group.summary) : null,
                  asArray(group.tags).length
                    ? h('div', { className: 'enw-tags' }, asArray(group.tags).map(tag => h('span', { key: tag, className: 'enw-tag' }, `#${tag}`)))
                    : null,
                  h('div', { className: 'enw-organize-notes' },
                    asArray(group.noteIds).map(noteId => {
                      const note = byId.get(noteId)
                      if (!note) return null
                      return h('div', { key: noteId, className: 'enw-organize-note' },
                        h('span', { className: 'enw-organize-note-text' }, labelOf(note)),
                        h('span', { className: 'enw-organize-note-cat' }, t(`category.${note.category}`)))
                    }))))))
          : h('p', { className: 'enw-aside-hint' }, t('organize.emptyPlan')),

        categories.length
          ? h('div', { className: 'enw-organize-section' },
            h(SectionLabel, null, t('organize.categories')),
            categories.map(item => {
              const note = byId.get(item.noteId)
              return h('div', { key: item.noteId, className: 'enw-organize-change' },
                h('span', { className: 'enw-organize-change-text' }, labelOf(note)),
                h('span', { className: 'enw-organize-note-cat' }, t(`category.${note.category}`)),
                h('span', { className: 'enw-organize-arrow' }, '→'),
                h('span', { className: 'enw-organize-cat' }, t(`category.${item.category}`)))
            }))
          : null,

        relations.length
          ? h('div', { className: 'enw-organize-section' },
            h(SectionLabel, null, t('organize.relations')),
            relations.map((relation, index) => h('div', { key: index, className: 'enw-organize-relation' },
              h('span', { className: 'enw-organize-kind' }, t(`organize.relation.${relation.kind}`)),
              h('span', { className: 'enw-organize-relation-notes' },
                asArray(relation.noteIds).map(noteId => byId.get(noteId)).filter(Boolean).map(labelOf).join(' ↔ ')),
              relation.note ? h('span', { className: 'enw-organize-relation-note' }, relation.note) : null)))
          : null,

        h('div', { className: 'enw-organize-actions' },
          h(Btn, { variant: 'quiet', onClick: onClose, disabled: applying }, t('action.cancel')),
          h(Btn, { variant: 'primary', onClick: onApply, disabled: applying || !groups.length },
            applying ? h('span', { className: 'enw-spinner enw-spinner--light' }) : h(Icon, { name: 'check', size: 15 }),
            h('span', null, t('organize.apply')))))
    }

    // -- modal shell --------------------------------------------------------

    function useModalBehavior(open, onClose, modalRef, initialFocusRef) {
      const closeHandler = useRef(onClose)
      const restoreRef = useRef(null)

      useEffect(() => {
        closeHandler.current = onClose
      }, [onClose])

      useEffect(() => {
        if (!open) return undefined
        restoreRef.current = document.activeElement
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const timer = setTimeout(() => initialFocusRef?.current?.focus(), 0)
        const onKeyDown = event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            closeHandler.current?.()
            return
          }
          if (event.key !== 'Tab') return
          const root = modalRef.current
          if (!root) return
          const focusables = [...root.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          )].filter(element => element.offsetParent !== null)
          if (!focusables.length) return
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          if (!root.contains(document.activeElement)) {
            event.preventDefault()
            first.focus()
          } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
        document.addEventListener('keydown', onKeyDown, true)
        return () => {
          clearTimeout(timer)
          document.removeEventListener('keydown', onKeyDown, true)
          document.body.style.overflow = previousOverflow
          const restore = restoreRef.current
          if (restore && typeof restore.focus === 'function') {
            setTimeout(() => restore.focus(), 0)
          }
        }
      }, [open])
    }

    // -- quiz modal ---------------------------------------------------------

    function QuizModal({ open, onClose, ...props }) {
      const modalRef = useRef(null)
      const closeRef = useRef(null)
      useModalBehavior(open, onClose, modalRef, closeRef)

      return h('div', {
        className: cx('enw-modal-backdrop', !open && 'enw-modal-backdrop--closed'),
        onMouseDown: event => {
          if (open && event.target === event.currentTarget) onClose?.()
        },
      },
      h('div', {
        className: 'enw-modal',
        ref: modalRef,
        role: 'dialog',
        'aria-modal': open ? 'true' : 'false',
        'aria-hidden': !open,
        'aria-label': props.t('quiz.title'),
      },
      props.error ? h('div', { className: 'enw-modal-error', role: 'alert' }, props.error) : null,
      h(QuizCard, {
        ...props,
        inModal: true,
        active: open,
        onClose,
        closeButtonRef: closeRef,
      })))
    }

    // -- note detail modal --------------------------------------------------

    function NoteDetailModal({ note, t, localeId, position, total, onPrev, onNext, onClose, onTag }) {
      const modalRef = useRef(null)
      const shellRef = useRef(null)
      const closeRef = useRef(null)
      useModalBehavior(true, onClose, shellRef, closeRef)
      const canNavigate = Number.isFinite(position) && position >= 1 && total > 1

      useEffect(() => {
        if (modalRef.current) modalRef.current.scrollTop = 0
      }, [note?.id])

      useEffect(() => {
        if (!canNavigate) return undefined
        const onKey = event => {
          if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
          const target = event.target
          const tag = target?.tagName
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            onPrev?.()
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            onNext?.()
          }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
      }, [canNavigate, onPrev, onNext])

      if (!note) return null

      const entries = asArray(note.entries).length
        ? note.entries
        : note.text
          ? [{ id: `${note.id}:legacy`, text: note.text, translation: note.translation || '', expansion: note.expansion }]
          : []
      const now = Date.now()
      let created = ''
      try {
        created = new Intl.DateTimeFormat(localeId, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(note.createdAt))
      } catch {
        created = ''
      }
      const reviewLabel = entry => {
        const dueAt = entry.review?.dueAt ?? 0
        if (!dueAt || dueAt <= now) return t('filter.due')
        try {
          const date = new Intl.DateTimeFormat(localeId, { month: 'short', day: 'numeric' }).format(new Date(dueAt))
          return `${t('note.nextReview')} ${date}`
        } catch {
          return t('note.nextReview')
        }
      }

      const navButton = where => h('button', {
        type: 'button',
        className: `enw-note-nav enw-note-nav--${where}`,
        onClick: where === 'prev' ? onPrev : onNext,
        title: `${t(where === 'prev' ? 'note.prev' : 'note.next')} (${where === 'prev' ? '←' : '→'})`,
        'aria-label': t(where === 'prev' ? 'note.prev' : 'note.next'),
      }, h(Icon, { name: where === 'prev' ? 'arrowLeft' : 'arrowRight', size: 18 }))

      const footNav = canNavigate
        ? h('div', { className: 'enw-note-modal-footnav' },
          h('button', {
            type: 'button',
            className: 'enw-note-foot-btn',
            onClick: onPrev,
            title: t('note.prev'),
          }, h(Icon, { name: 'arrowLeft', size: 15 }), h('span', null, t('note.prev'))),
          h('span', { className: 'enw-note-foot-pos', 'aria-live': 'polite' }, `${position} / ${total}`),
          h('button', {
            type: 'button',
            className: 'enw-note-foot-btn',
            onClick: onNext,
            title: t('note.next'),
          }, h('span', null, t('note.next')), h(Icon, { name: 'arrowRight', size: 15 })))
        : null

      return h('div', {
        className: cx('enw-modal-backdrop', 'enw-note-backdrop', `enw-note--${note.category}`),
        onMouseDown: event => {
          if (event.target === event.currentTarget) onClose?.()
        },
      },
      h('div', {
        className: 'enw-note-modal-shell',
        ref: shellRef,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': t('note.fullView'),
      },
        canNavigate ? navButton('prev') : null,
        h('div', {
          className: 'enw-modal enw-note-modal',
          ref: modalRef,
        },
        h('div', { className: 'enw-note-modal-head' },
          h('div', { className: 'enw-note-modal-title' },
            h('span', { className: 'enw-note-modal-kicker' }, t('note.fullView')),
            h('span', { className: cx('enw-cat', `enw-cat--${note.category}`) }, t(`category.${note.category}`)),
            h('span', { className: 'enw-note-modal-date' }, created),
            h('span', { className: 'enw-note-modal-count' }, `${entries.length} ${t('note.entries')}`)),
          h('div', { className: 'enw-note-modal-head-actions' },
            canNavigate ? h('span', { className: 'enw-note-modal-pos', 'aria-live': 'polite' }, `${position} / ${total}`) : null,
            h('button', {
              type: 'button',
              ref: closeRef,
              className: 'enw-icon-btn enw-note-modal-close',
              onClick: onClose,
              title: t('action.close'),
              'aria-label': t('action.close'),
            }, h(Icon, { name: 'close', size: 16 })))),
        footNav,
        note.pinned || asArray(note.tags).length
          ? h('div', { className: 'enw-note-modal-meta' },
            note.pinned
              ? h('span', { className: 'enw-pill enw-pill--brand' }, h(Icon, { name: 'pin', size: 12 }), t('note.pinnedGroup'))
              : null,
            asArray(note.tags).map(tag => (onTag
              ? h('button', {
                key: tag,
                type: 'button',
                className: 'enw-tag enw-tag--button',
                onClick: () => {
                  onClose?.()
                  onTag(tag)
                },
              }, `#${tag}`)
              : h('span', { key: tag, className: 'enw-tag' }, `#${tag}`))))
          : null,
        h('div', { className: 'enw-note-modal-body' },
          entries.map((entry, index) => h('section', { key: entry.id || index, className: 'enw-note-modal-entry' },
            h('div', { className: 'enw-entry-head' },
              h('p', { className: 'enw-entry-text' }, entry.text),
              h('div', { className: 'enw-entry-tools' },
                h(SpeakButton, { text: entry.text, t, size: 14 }))),
            entry.translation ? h('p', { className: 'enw-entry-translation' }, entry.translation) : null,
            entry.expansion
              ? h(ExpansionView, {
                expansion: entry.expansion,
                t,
                localeId,
                showUsage: true,
                collapseSignal: 0,
                entryText: entry.text,
                entryTranslation: entry.translation,
                category: note.category,
              })
              : h('p', { className: 'enw-note-modal-empty' }, t('expansion.empty')),
            h('div', { className: 'enw-note-modal-review' },
              h('span', { className: cx('enw-pill', entry.review?.dueAt > now ? 'enw-pill--ok' : 'enw-pill--wait') }, reviewLabel(entry))))))),
        canNavigate ? navButton('next') : null))
    }

    // -- back to top --------------------------------------------------------

    function BackToTop({ visible, onClick, t }) {
      return h('button', {
        type: 'button',
        className: cx('enw-top-btn', visible && 'enw-top-btn--on'),
        onClick: event => {
          if (event?.currentTarget?.blur) event.currentTarget.blur()
          onClick?.()
        },
        title: t('action.backToTop'),
        'aria-label': t('action.backToTop'),
        'aria-hidden': !visible ? 'true' : undefined,
        tabIndex: visible ? 0 : -1,
      },
      h(Icon, { name: 'arrowUp', size: 16 }),
      h('span', { className: 'enw-top-label' }, t('action.backToTop')))
    }

    // -- daily essay reader -------------------------------------------------

    function EssayReader({
      data,
      phase,
      error,
      busy,
      modelAvailable,
      t,
      localeId,
      onClose,
      onRetry,
      onGenerate,
      onSaveProgress,
      onAdd,
    }) {
      const readerRef = useRef(null)
      const backRef = useRef(null)
      useModalBehavior(true, onClose, readerRef, backRef)
      const essay = data?.essay ?? null
      const progress = data?.progress ?? null
      const [showZh, setShowZh] = useState(false)
      const [answers, setAnswers] = useState(() => ({ ...(progress?.answers ?? {}) }))
      const [outline, setOutline] = useState(progress?.outline ?? '')
      const [activeAnnotation, setActiveAnnotation] = useState(null)
      const [selection, setSelection] = useState(null)
      const [savedCounts, setSavedCounts] = useState({
        words: progress?.savedWords ?? 0,
        sentences: progress?.savedSentences ?? 0,
      })
      const [notice, setNotice] = useState('')
      const [saving, setSaving] = useState(false)
      const bodyRef = useRef(null)
      const touchTimer = useRef(null)

      useEffect(() => {
        setAnswers({ ...(progress?.answers ?? {}) })
        setOutline(progress?.outline ?? '')
        setActiveAnnotation(null)
        setSelection(null)
        setSavedCounts({ words: progress?.savedWords ?? 0, sentences: progress?.savedSentences ?? 0 })
      }, [essay?.id, data?.createdAt])

      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(''), 2600)
        return () => clearTimeout(timer)
      }, [notice])

      useEffect(() => () => {
        if (touchTimer.current) clearTimeout(touchTimer.current)
      }, [])

      const captureSelection = () => {
        if (!essay || typeof window === 'undefined') return
        const current = window.getSelection?.()
        const text = essayNormalize(current?.toString() ?? '')
        if (!text || text.length < 2 || text.length > 400) return
        const anchor = current.anchorNode
        const element = anchor?.nodeType === 1 ? anchor : anchor?.parentElement
        if (!bodyRef.current?.contains(element)) return
        const found = essayLookup(essay, text)
        setSelection({
          text,
          category: essayInferCategory(text),
          translation: found.translation || '',
        })
      }

      const handleTouchEnd = () => {
        if (touchTimer.current) clearTimeout(touchTimer.current)
        touchTimer.current = setTimeout(captureSelection, 20)
      }

      const annotationFor = sentence => essayLookup(essay, sentence).annotation ?? null

      const queueSelection = (text, category, translation) => {
        setSelection({ text, category, translation: translation || '' })
      }

      const addSelection = async () => {
        if (!selection || saving) return
        setSaving(true)
        setNotice('')
        try {
          const result = await onAdd(selection)
          if (result?.status === 'ok') {
            const next = {
              words: savedCounts.words + (selection.category === 'sentence' ? 0 : 1),
              sentences: savedCounts.sentences + (selection.category === 'sentence' ? 1 : 0),
            }
            setSavedCounts(next)
            setSelection(null)
            setNotice(t('essay.added'))
            try {
              window.getSelection?.()?.removeAllRanges?.()
            } catch {
              /* selection cleanup is best effort */
            }
            void onSaveProgress({ savedWords: next.words, savedSentences: next.sentences })
          } else {
            setNotice(result?.message || t('essay.addFailed'))
          }
        } catch (error) {
          setNotice(errorText(error) || t('essay.addFailed'))
        } finally {
          setSaving(false)
        }
      }

      const chooseAnswer = (questionIndex, optionIndex) => {
        if (!essay) return
        const next = { ...answers, [questionIndex]: optionIndex }
        setAnswers(next)
        void onSaveProgress({ answers: next })
      }

      const complete = () => {
        if (!essay) return
        void onSaveProgress({ completed: true })
        setNotice(t('essay.completed'))
      }

      let dateLabel = data?.date ?? ''
      if (data?.date) {
        try {
          dateLabel = new Intl.DateTimeFormat(localeId, { month: 'short', day: 'numeric' }).format(new Date(`${data.date}T12:00:00`))
        } catch {
          dateLabel = data.date
        }
      }
      const totalQuestions = asArray(essay?.questions).length
      const answered = Object.keys(answers).filter(key => Number(key) < totalQuestions).length
      const completed = Boolean(progress?.completedAt)
      const loading = phase === 'loading'
      const unavailable = !essay && !loading

      return h('div', {
        className: 'enw-essay-view',
        ref: readerRef,
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': t('essay.title'),
      },
      h('header', { className: 'enw-essay-bar' },
        h('button', {
          type: 'button',
          ref: backRef,
          className: 'enw-essay-back',
          onClick: onClose,
          title: t('essay.back'),
          'aria-label': t('essay.back'),
        }, h(Icon, { name: 'arrowLeft', size: 16 }), h('span', null, t('essay.back'))),
        h('div', { className: 'enw-essay-bar-title' },
          h('span', { className: 'enw-essay-kicker' }, t('essay.title')),
          dateLabel ? h('span', { className: 'enw-essay-date' }, dateLabel) : null,
          essay ? h('span', { className: 'enw-cat enw-essay-cat' }, essay.topic) : null),
        h('div', { className: 'enw-essay-actions' },
          essay
            ? h(Btn, {
              variant: 'quiet',
              onClick: () => setShowZh(value => !value),
              title: t(showZh ? 'essay.hideZh' : 'essay.showZh'),
              label: t(showZh ? 'essay.hideZh' : 'essay.showZh'),
              className: showZh ? 'enw-btn--on' : '',
            }, h(Icon, { name: showZh ? 'eyeOff' : 'eye', size: 15 }), h('span', { className: 'enw-btn-text' }, t(showZh ? 'essay.hideZh' : 'essay.showZh')))
            : null,
          essay && modelAvailable
            ? h(Btn, {
              variant: 'quiet',
              onClick: onGenerate,
              title: t('essay.aiHint'),
              label: t('essay.aiHint'),
              disabled: busy === 'generate',
            }, busy === 'generate'
              ? h('span', { className: 'enw-spinner' })
              : h(Icon, { name: 'sparkles', size: 15 }),
            h('span', { className: 'enw-btn-text' }, t(busy === 'generate' ? 'essay.generating' : 'essay.aiGenerate')))
            : null,
          h('button', {
            type: 'button',
            className: 'enw-icon-btn enw-essay-close',
            onClick: onClose,
            title: t('action.close'),
            'aria-label': t('action.close'),
          }, h(Icon, { name: 'close', size: 16 })))),
      h('div', { className: 'enw-essay-scroll' },
        loading
          ? h('div', { className: 'enw-essay-state' },
            h('span', { className: 'enw-spinner' }),
            h('p', null, t('essay.loading')))
          : unavailable
            ? h('div', { className: 'enw-essay-state' },
              h(Icon, { name: 'book', size: 30 }),
              h('p', null, error || t('essay.empty')),
              h(Btn, { variant: 'primary', onClick: onRetry }, t('common.retry')))
            : h('div', { className: 'enw-essay-layout' },
              h('main', { className: 'enw-essay-main' },
                error ? h('div', { className: 'enw-essay-banner' }, error) : null,
                h('section', { className: 'enw-essay-hero' },
                  h('p', { className: 'enw-essay-meta' },
                    `${essay.wordCount} ${t('essay.words')} · ${essay.minutes} ${t('essay.minutes')} · ${t('essay.band')} ${essay.targetBand}`),
                  h('h1', { className: 'enw-essay-title' }, essay.title),
                  h('div', { className: 'enw-essay-prompt-card' },
                    h('span', { className: 'enw-essay-label' }, t('essay.prompt')),
                    h('p', { className: 'enw-essay-prompt' }, essay.prompt)),
                  h('div', { className: 'enw-essay-think' },
                    h('label', { className: 'enw-essay-label', htmlFor: 'enw-essay-outline' }, t('essay.think')),
                    h('textarea', {
                      id: 'enw-essay-outline',
                      className: 'enw-textarea enw-essay-outline-input',
                      rows: 3,
                      value: outline,
                      placeholder: t('essay.outlinePlaceholder'),
                      onChange: event => setOutline(event.target.value),
                      onBlur: () => onSaveProgress({ outline }),
                    }))),
                h('div', {
                  className: 'enw-essay-body',
                  ref: bodyRef,
                  onMouseUp: captureSelection,
                  onTouchEnd: handleTouchEnd,
                },
                essay.paragraphs.map((paragraph, index) => h('section', { key: `${index}-${paragraph.role}`, className: 'enw-essay-paragraph' },
                  h('div', { className: 'enw-essay-para-head' },
                    h('span', { className: 'enw-essay-role' }, paragraph.role),
                    h(SpeakButton, { text: paragraph.en, t, size: 13 })),
                  h('p', { className: 'enw-essay-text' },
                    essaySentences(paragraph.en).map((sentence, sentenceIndex) => h('span', {
                      key: `${sentenceIndex}-${sentence.slice(0, 12)}`,
                      className: cx('enw-essay-sentence', annotationFor(sentence) && 'enw-essay-sentence--note'),
                      onClick: annotationFor(sentence) ? () => setActiveAnnotation(annotationFor(sentence)) : undefined,
                    }, sentence, ' '))),
                  showZh && paragraph.zh ? h('p', { className: 'enw-essay-zh' }, paragraph.zh) : null))),
                h('section', { className: 'enw-essay-section' },
                  h('h2', { className: 'enw-essay-section-title' }, t('essay.structure')),
                  essay.outline.length
                    ? h('ol', { className: 'enw-essay-outline' },
                      essay.outline.map((item, index) => h('li', { key: `${index}-${item.role}` },
                        h('strong', null, item.role),
                        h('span', null, item.summary))))
                    : null,
                  essay.cohesive.length
                    ? h('div', { className: 'enw-essay-cohesive' },
                      h('span', { className: 'enw-essay-label' }, t('essay.cohesive')),
                      essay.cohesive.map(item => h('span', { key: item, className: 'enw-tag' }, item)))
                    : null),
                h('section', { className: 'enw-essay-section' },
                  h('h2', { className: 'enw-essay-section-title' }, t('essay.vocab')),
                  h('div', { className: 'enw-essay-vocab-grid' },
                    essay.vocab.map(item => h('article', { key: item.term, className: 'enw-essay-vocab-card' },
                      h('div', { className: 'enw-essay-vocab-head' },
                        h('strong', null, item.term),
                        item.phonetic ? h('span', null, item.phonetic) : null),
                      item.meaning ? h('p', { className: 'enw-essay-vocab-line' }, item.meaning) : null,
                      item.collocation ? h('p', { className: 'enw-essay-vocab-line enw-essay-vocab-collocation' }, item.collocation) : null,
                      item.example ? h('p', { className: 'enw-essay-vocab-example' }, item.example) : null,
                      h('button', {
                        type: 'button',
                        className: 'enw-link-btn',
                        onClick: () => queueSelection(item.term, essayInferCategory(item.term), item.meaning),
                      }, t('essay.saveWord')))))),
                h('section', { className: 'enw-essay-section' },
                  h('h2', { className: 'enw-essay-section-title' }, `${t('essay.questions')} · ${answered}/${totalQuestions}`),
                  essay.questions.map((question, questionIndex) => h('article', { key: questionIndex, className: 'enw-essay-question' },
                    h('p', { className: 'enw-essay-question-prompt' }, `${questionIndex + 1}. ${question.prompt}`),
                    h('div', { className: 'enw-essay-options' },
                      question.options.map((option, optionIndex) => {
                        const chosen = answers[questionIndex] === optionIndex
                        const correct = question.answer === optionIndex
                        const revealed = answers[questionIndex] !== undefined
                        return h('button', {
                          key: optionIndex,
                          type: 'button',
                          className: cx(
                            'enw-essay-option',
                            chosen && 'enw-essay-option--chosen',
                            revealed && correct && 'enw-essay-option--correct',
                            revealed && chosen && !correct && 'enw-essay-option--wrong',
                          ),
                          onClick: () => chooseAnswer(questionIndex, optionIndex),
                        }, option)
                      })),
                    answers[questionIndex] !== undefined
                      ? h('p', { className: 'enw-essay-feedback' },
                        h('strong', null, answers[questionIndex] === question.answer ? t('essay.correct') : t('essay.incorrect')),
                        question.explanation ? h('span', null, ` · ${question.explanation}`) : null)
                      : null)))),
              h('aside', { className: 'enw-essay-rail' },
                h('div', { className: 'enw-essay-rail-card' },
                  activeAnnotation
                    ? h(React.Fragment, null,
                      h('h3', { className: 'enw-essay-rail-title' }, t('essay.annotation')),
                      h('p', { className: 'enw-essay-rail-sentence' }, activeAnnotation.sentence),
                      activeAnnotation.zh ? h('p', { className: 'enw-essay-zh' }, activeAnnotation.zh) : null,
                      activeAnnotation.structure
                        ? h('div', { className: 'enw-essay-rail-section' },
                          h('span', { className: 'enw-essay-label' }, t('essay.structure')),
                          h('p', null, activeAnnotation.structure))
                        : null,
                      activeAnnotation.grammar
                        ? h('div', { className: 'enw-essay-rail-section' },
                          h('span', { className: 'enw-essay-label' }, 'Grammar'),
                          h('p', null, activeAnnotation.grammar))
                        : null,
                      activeAnnotation.chunk
                        ? h('div', { className: 'enw-essay-rail-section' },
                          h('span', { className: 'enw-essay-label' }, 'Chunk'),
                          h('p', null, activeAnnotation.chunk))
                        : null,
                      h('button', {
                        type: 'button',
                        className: 'enw-link-btn',
                        onClick: () => queueSelection(activeAnnotation.sentence, 'sentence', activeAnnotation.zh),
                      }, t('essay.saveSentence')))
                    : h('p', { className: 'enw-essay-rail-hint' }, t('essay.annotationHint')),
                  h('div', { className: 'enw-essay-rail-progress' },
                    h('span', null, `${answered}/${totalQuestions}`),
                    completed
                      ? h('span', { className: 'enw-pill enw-pill--ok' }, t('essay.completed'))
                      : h(Btn, { variant: 'primary', onClick: complete }, t('essay.complete')))),
                h('div', { className: 'enw-essay-rail-card' },
                  h('h3', { className: 'enw-essay-rail-title' }, t('essay.outlineTitle')),
                  essay.outline.map((item, index) => h('p', { key: `${index}-${item.role}`, className: 'enw-essay-rail-outline' },
                    h('strong', null, item.role),
                    h('span', null, item.summary)))))),
              ),
      selection
        ? h('div', { className: 'enw-essay-selectbar' },
          h('div', { className: 'enw-essay-select-main' },
            h('span', { className: 'enw-essay-select-label' }, t('essay.selected')),
            h('span', { className: 'enw-essay-select-text' }, `“${selection.text.length > 90 ? `${selection.text.slice(0, 90)}…` : selection.text}”`)),
          h('div', { className: 'enw-essay-select-actions' },
            h('select', {
              className: 'enw-select enw-essay-select-cat',
              value: selection.category,
              onChange: event => setSelection(current => (current ? { ...current, category: event.target.value } : current)),
              'aria-label': t('essay.addToNotes'),
            }, CATEGORIES.map(category => h('option', { key: category, value: category }, t(`category.${category}`)))),
            h(Btn, { variant: 'primary', onClick: addSelection, disabled: saving },
              saving ? h('span', { className: 'enw-spinner enw-spinner--light' }) : null,
              t('essay.addToNotes')),
            h(Btn, { variant: 'quiet', onClick: () => setSelection(null) }, t('action.cancel'))))
        : null,
      notice ? h('div', { className: 'enw-essay-toast', role: 'status' }, notice) : null)
    }

    // -- page ---------------------------------------------------------------

    function NotesPage({ t, api, ctx, mountError }) {
      const active = useActiveLocale(ctx)
      const localeId = /^zh/i.test(active || '') ? 'zh-CN' : 'en-US'
      const [snap, setSnap] = useState(null)
      const [phase, setPhase] = useState(api ? 'loading' : 'error')
      const [loadError, setLoadError] = useState(mountError || '')
      const [actionError, setActionError] = useState('')
      const [notice, setNotice] = useState('')
      const [busy, setBusy] = useState('')
      const [filter, setFilter] = useState('all')
      const [statusFilter, setStatusFilter] = useState('all')
      const [tagFilter, setTagFilter] = useState('')
      const [query, setQuery] = useState('')
      const [settingsOpen, setSettingsOpen] = useState(false)
      const [quizOpen, setQuizOpen] = useState(false)
      const [detailId, setDetailId] = useState('')
      const [essayOpen, setEssayOpen] = useState(false)
      const [essayData, setEssayData] = useState(null)
      const [essayPhase, setEssayPhase] = useState('idle')
      const [essayError, setEssayError] = useState('')
      const [essayBusy, setEssayBusy] = useState('')
      const [draft, setDraft] = useState({ text: '', tags: '', category: 'word' })
      const [collapseSignal, setCollapseSignal] = useState(0)
      const [deleted, setDeleted] = useState(null)
      const [activeNoteId, setActiveNoteId] = useState('')
      const [dragNoteId, setDragNoteId] = useState('')
      const [showTop, setShowTop] = useState(false)
      const [composerOpen, setComposerOpen] = useState(() => {
        try {
          return window.localStorage.getItem(COMPOSER_COLLAPSED_KEY) !== '1'
        } catch {
          return true
        }
      })
      const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
          return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
        } catch {
          return false
        }
      })
      const [viewMode, setViewMode] = useState(() => {
        try {
          return window.localStorage.getItem(VIEW_MODE_KEY) === 'grid' ? 'grid' : 'list'
        } catch {
          return 'list'
        }
      })
      const [groupMode, setGroupMode] = useState(() => {
        try {
          return window.localStorage.getItem(GROUP_MODE_KEY) === 'organized' ? 'organized' : 'time'
        } catch {
          return 'time'
        }
      })
      const [organizePlan, setOrganizePlan] = useState(null)
      const [expandProgress, setExpandProgress] = useState(null)
      const [expandFailed, setExpandFailed] = useState([])
      const organizedActive = groupMode === 'organized' && Boolean(snap?.organization)
      const scheme = useThemeScheme(ctx)
      const noticeTimer = useRef(null)
      const undoRef = useRef(null)
      const searchRef = useRef(null)
      const composerRef = useRef(null)
      const pageRef = useRef(null)
      const stopExpansion = useRef(false)
      const alive = useRef(true)

      useEffect(() => () => {
        alive.current = false
        if (noticeTimer.current) clearTimeout(noticeTimer.current)
        if (undoRef.current) clearTimeout(undoRef.current)
      }, [])

      const toast = message => {
        setNotice(message)
        if (noticeTimer.current) clearTimeout(noticeTimer.current)
        noticeTimer.current = setTimeout(() => setNotice(''), 3600)
      }

      const toggleComposer = () => {
        setComposerOpen(current => {
          const next = !current
          try {
            window.localStorage.setItem(COMPOSER_COLLAPSED_KEY, next ? '0' : '1')
          } catch {
            /* storage may be unavailable */
          }
          return next
        })
      }

      const collapseExpansions = () => {
        setCollapseSignal(value => value + 1)
      }

      const chooseView = mode => {
        setViewMode(mode)
        try {
          window.localStorage.setItem(VIEW_MODE_KEY, mode)
        } catch {
          /* storage may be unavailable */
        }
      }

      const setSidebarState = collapsed => {
        setSidebarCollapsed(collapsed)
        try {
          window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
        } catch {
          /* storage may be unavailable */
        }
      }

      const toggleSidebar = () => setSidebarState(!sidebarCollapsed)

      const toggleSettings = () => {
        if (sidebarCollapsed) {
          setSidebarState(false)
          setSettingsOpen(true)
        } else {
          setSettingsOpen(value => !value)
        }
      }

      const refresh = async () => {
        if (!api) return
        try {
          const next = await api.snapshot()
          if (!alive.current) return
          setSnap(next)
          setPhase('ready')
          setLoadError('')
          badge.set(Boolean(next.today && !next.today.attempt))
        } catch (error) {
          if (!alive.current) return
          setLoadError(errorText(error))
          setPhase(current => (current === 'ready' ? 'ready' : 'error'))
        }
      }

      useEffect(() => {
        void refresh()
      }, [api])

      const act = async (key, operation, onOk) => {
        if (!api) return undefined
        if (busy) return undefined
        setBusy(key)
        setActionError('')
        try {
          const result = await operation()
          if (!alive.current) return undefined
          const status = result?.status
          if (status && status !== 'ok' && status !== 'exists' && status !== 'partial' && status !== 'cancelled') {
            if (status === 'unavailable') setActionError(t('error.expandUnavailable'))
            else if (status === 'empty') setActionError(t('error.quizUnavailable'))
            else setActionError(result.message || t('error.action'))
            if (onOk) onOk(result)
          } else if (onOk) {
            onOk(result)
          }
          await refresh()
          return result
        } catch (error) {
          if (alive.current) setActionError(errorText(error) || t('error.action'))
          return undefined
        } finally {
          if (alive.current) setBusy('')
        }
      }

      const chooseGroupMode = mode => {
        setGroupMode(mode)
        try {
          window.localStorage.setItem(GROUP_MODE_KEY, mode)
        } catch {
          /* storage may be unavailable */
        }
      }

      const runOrganize = async () => {
        if (!api || busy) return
        setBusy('organize')
        setActionError('')
        setOrganizePlan(null)
        try {
          const result = await api.organizeWall()
          if (!alive.current) return
          if (result?.status === 'ok') {
            setOrganizePlan(result.plan)
          } else if (result?.status === 'empty') {
            setActionError(t('organize.empty'))
          } else if (result?.status === 'unavailable') {
            setActionError(t('organize.unavailable'))
          } else {
            setActionError(result?.message || t('organize.failed'))
          }
          await refresh()
        } catch (error) {
          if (alive.current) setActionError(errorText(error) || t('organize.failed'))
        } finally {
          if (alive.current) setBusy('')
        }
      }

      const applyOrganize = async () => {
        if (!api || busy || !organizePlan) return
        setBusy('organize-apply')
        setActionError('')
        try {
          const result = await api.applyOrganization(organizePlan)
          if (!alive.current) return
          if (result?.status === 'ok') {
            setOrganizePlan(null)
            chooseGroupMode('organized')
            setFilter('all')
            setQuery('')
            toast(t('organize.applied'))
            await refresh()
          } else if (result?.status === 'invalid') {
            setActionError(t('organize.invalid'))
          } else {
            setActionError(result?.message || t('organize.failed'))
          }
        } catch (error) {
          if (alive.current) setActionError(errorText(error) || t('organize.failed'))
        } finally {
          if (alive.current) setBusy('')
        }
      }

      const expandMissing = async onlyIds => {
        if (!api || busy) return
        const requested = Array.isArray(onlyIds) ? onlyIds.filter(Boolean) : null
        const targets = requested?.length
          ? requested
          : asArray(snap?.notes)
            .filter(note => asArray(note.entries).some(entry => !entry.expansion))
            .map(note => note.id)
        if (!targets.length) {
          toast(t('notice.noMissingExpansions'))
          return
        }
        setBusy('expand-missing')
        setActionError('')
        setExpandFailed([])
        setExpandProgress({ done: 0, total: targets.length })
        stopExpansion.current = false
        let completed = 0
        const failed = []
        let cancelled = false
        const queue = targets.slice()
        const worker = async () => {
          while (queue.length && !stopExpansion.current && alive.current) {
            const noteId = queue.shift()
            try {
              const result = await api.expandNote(noteId, false)
              if (stopExpansion.current || result?.status === 'cancelled') {
                cancelled = true
                break
              }
              if (result?.status === 'ok' || result?.status === 'exists' || result?.status === 'partial') {
                completed += 1
                if (alive.current) setExpandProgress({ done: completed, total: targets.length })
                if (result?.status === 'partial') failed.push(noteId)
                continue
              }
              failed.push(noteId)
            } catch (error) {
              if (stopExpansion.current) cancelled = true
              else failed.push(noteId)
            }
          }
        }
        try {
          await Promise.all([worker(), worker()])
          if (!alive.current) return
          await refresh()
          if (!alive.current) return
          setExpandFailed(failed)
          if (failed.length) setActionError(`${t('notice.expandPartial')} (${failed.length})`)
          else if (cancelled) toast(t('notice.expandCancelled'))
          else toast(t('notice.missingExpanded'))
        } catch (error) {
          if (alive.current) setActionError(errorText(error) || t('error.action'))
        } finally {
          if (alive.current) {
            setBusy('')
            setExpandProgress(null)
          }
        }
      }

      const stopExpand = async () => {
        stopExpansion.current = true
        try {
          await api?.cancelExpansion()
        } catch {
          /* the in-flight request also ends through its own abort */
        }
      }

      const addNote = () => {
        const text = draft.text.trim()
        if (!text) {
          setActionError(t('form.required'))
          return
        }
        void act('add', () => api.addNote({
          text,
          tags: parseTags(draft.tags),
          category: draft.category,
        }), () => {
          setDraft(current => ({ text: '', tags: '', category: current.category }))
          toast(t('notice.added'))
        })
      }

      const expandEntry = (note, entry) => {
        void act(`expand:${note.id}:${entry.id}`, () => api.expandNote(note.id, Boolean(entry.expansion), entry.id), result => {
          if (result?.status === 'ok') {
            toast(t('notice.expanded'))
          } else if (result?.status === 'partial') {
            setActionError(t('notice.expandPartial'))
          } else if (result?.status === 'unavailable') {
            setActionError(t('error.expandUnavailable'))
          }
        })
      }

      const expandAll = (note, force) => {
        void act(`expand:${note.id}`, () => api.expandNote(note.id, Boolean(force), ''), result => {
          if (result?.status === 'ok') {
            toast(t('notice.expanded'))
          } else if (result?.status === 'partial') {
            setActionError(t('notice.expandPartial'))
          } else if (result?.status === 'unavailable') {
            setActionError(t('error.expandUnavailable'))
          }
        })
      }

      const updateNote = (note, patch) => act(`update:${note.id}`, () => api.updateNote({ id: note.id, ...patch }), result => {
        if (result?.status === 'ok') toast(t('notice.updated'))
      })

      const deleteNote = note => {
        void act(`delete:${note.id}`, () => api.deleteNote(note.id), result => {
          if (result?.status === 'ok' && result.note) {
            setDeleted({ note: result.note })
            if (undoRef.current) clearTimeout(undoRef.current)
            undoRef.current = setTimeout(() => {
              if (alive.current) setDeleted(null)
            }, 12000)
          }
        })
      }

      const undoDelete = async () => {
        if (!deleted?.note || !api || busy) return
        setBusy('restore')
        setActionError('')
        try {
          const result = await api.restoreNote({ note: deleted.note })
          if (!alive.current) return
          if (result?.status === 'ok') {
            setDeleted(null)
            if (undoRef.current) clearTimeout(undoRef.current)
            toast(t('notice.restored'))
            await refresh()
          } else {
            setActionError(result?.message || t('error.action'))
          }
        } catch (error) {
          if (alive.current) setActionError(errorText(error) || t('error.action'))
        } finally {
          if (alive.current) setBusy('')
        }
      }

      const pinNote = note => {
        void act(`pin:${note.id}`, () => api.updateNote({ id: note.id, pinned: !note.pinned }))
      }

      const dropNote = async target => {
        if (!dragNoteId || dragNoteId === target.id || !api) {
          setDragNoteId('')
          return
        }
        const ordered = asArray(snap?.notes).slice().sort(compareNotes)
        const from = ordered.findIndex(note => note.id === dragNoteId)
        const to = ordered.findIndex(note => note.id === target.id)
        setDragNoteId('')
        if (from < 0 || to < 0) return
        const next = ordered.slice()
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        try {
          await api.reorderNotes(next.map(note => note.id))
          await refresh()
        } catch (error) {
          setActionError(errorText(error) || t('error.action'))
        }
      }

      const generateQuiz = force => {
        void act('quiz', () => api.generateQuiz(force), result => {
          if (result?.status === 'ok') toast(t('notice.quiz'))
          else if (result?.status === 'empty') setActionError(result.message || t('error.quizUnavailable'))
        })
      }

      const gradeQuiz = answers => {
        if (!snap?.today) return
        void act('grade', () => api.gradeQuiz(snap.today.date, answers), result => {
          if (result?.status === 'ok') toast(t('notice.graded'))
        })
      }

      const gradeWithModel = answers => {
        if (!snap?.today) return
        if (!snap?.model?.available) {
          setActionError(t('quiz.noModel'))
          return
        }
        void act('grade-model', () => api.gradeWithModel(snap.today.date, answers), result => {
          if (result?.status === 'ok') toast(t('notice.graded'))
          else if (result?.status === 'unavailable') setActionError(t('quiz.noModel'))
        })
      }

      const openEssay = async () => {
        setEssayOpen(true)
        setEssayPhase('loading')
        setEssayError('')
        setEssayData(null)
        try {
          const result = await api.essayToday()
          if (result?.status === 'ok') {
            setEssayData(result)
            setEssayPhase('ready')
          } else {
            setEssayError(result?.message || t('essay.empty'))
            setEssayPhase('error')
          }
        } catch (error) {
          setEssayError(errorText(error) || t('essay.error'))
          setEssayPhase('error')
        }
      }

      const closeEssay = () => {
        setEssayOpen(false)
        setEssayError('')
        setEssayPhase('idle')
        void refresh()
      }

      const saveEssayProgress = async patch => {
        if (!essayData?.date) return
        try {
          const result = await api.essayProgress(essayData.date, patch)
          if (result?.status === 'ok') {
            setEssayData(current => (current ? { ...current, progress: result.progress } : current))
          }
        } catch {
          /* progress saving is best effort; the reader keeps the local state */
        }
      }

      const generateEssay = async () => {
        if (!essayData?.date || essayBusy) return
        setEssayBusy('generate')
        setEssayError('')
        try {
          const result = await api.essayGenerate(essayData.date)
          if (result?.status === 'ok') {
            setEssayData(result)
            setEssayPhase('ready')
          } else {
            setEssayError(result?.message || t('essay.generateFailed'))
          }
        } catch (error) {
          setEssayError(errorText(error) || t('essay.generateFailed'))
        } finally {
          setEssayBusy('')
        }
      }

      const addEssaySelection = async selection => {
        const essay = essayData?.essay
        const tags = ['雅思范文', essay?.topic].filter(Boolean)
        const result = await api.addNote({
          text: selection.text,
          translation: selection.translation || '',
          category: selection.category,
          tags,
        })
        if (result?.status === 'ok') void refresh()
        return result
      }

      const saveSettings = settings => {
        void act('settings', () => api.saveSettings(settings), result => {
          if (result?.status === 'ok') {
            toast(t('settings.saved'))
            setSettingsOpen(false)
          } else if (result?.status === 'invalid') {
            setActionError(result.message || t('settings.invalid'))
          }
        })
      }

      const filtered = useMemo(() => {
        const notes = asArray(snap?.notes)
        const needle = query.trim().toLowerCase()
        const now = Date.now()
        return notes.filter(note => {
          if (filter !== 'all' && note.category !== filter) return false
          if (tagFilter && !asArray(note.tags).some(tag => tag.toLowerCase() === tagFilter.toLowerCase())) return false
          if (statusFilter === 'due') {
            if (!asArray(note.entries).some(entry => !entry.review?.dueAt || entry.review.dueAt <= now)) return false
          } else if (statusFilter === 'unexpanded') {
            if (!asArray(note.entries).some(entry => !entry.expansion)) return false
          } else if (statusFilter === 'mastered') {
            if (!asArray(note.entries).length || !asArray(note.entries).every(entry => entry.review)) return false
          }
          if (!needle) return true
          const haystack = `${note.text} ${asArray(note.entries).map(entry => entry.translation).join(' ')} ${asArray(note.tags).join(' ')}`.toLowerCase()
          return haystack.includes(needle)
        }).sort(compareNotes)
      }, [snap, filter, query, statusFilter, tagFilter])

      const groups = useMemo(() => {
        if (organizedActive) {
          const order = new Map()
          asArray(snap?.organization?.groups).forEach((group, index) => order.set(group.title, index))
          const map = new Map()
          for (const note of filtered) {
            const key = note.topic || ''
            if (!map.has(key)) map.set(key, [])
            map.get(key).push(note)
          }
          const rank = key => {
            if (!key) return Number.MAX_SAFE_INTEGER
            return order.has(key) ? order.get(key) : order.size
          }
          const list = [...map.entries()]
          list.sort(([left], [right]) => rank(left) - rank(right) || left.localeCompare(right))
          for (const [, entries] of list) {
            entries.sort((left, right) => {
              const pinned = (right.pinned ? 1 : 0) - (left.pinned ? 1 : 0)
              if (pinned) return pinned
              const leftPosition = Number.isFinite(left.position) ? left.position : Number.MAX_SAFE_INTEGER
              const rightPosition = Number.isFinite(right.position) ? right.position : Number.MAX_SAFE_INTEGER
              return leftPosition - rightPosition || left.createdAt - right.createdAt
            })
          }
          return list
        }
        const map = new Map()
        for (const note of filtered) {
          if (note.pinned) continue
          const key = dayKey(note.createdAt)
          if (!map.has(key)) map.set(key, [])
          map.get(key).push(note)
        }
        const list = [...map.entries()]
        const pinned = filtered.filter(note => note.pinned)
        return pinned.length ? [['__pinned__', pinned], ...list] : list
      }, [filtered, organizedActive, snap])

      const navNotes = useMemo(() => groups.flatMap(([, entries]) => entries), [groups])

      const dayLabel = key => {
        if (key === '__pinned__') return t('note.pinnedGroup')
        const today = dayKey(Date.now())
        const yesterday = dayKey(Date.now() - 86400000)
        if (key === today) return t('time.today')
        if (key === yesterday) return t('time.yesterday')
        const [year, month, day] = key.split('-').map(Number)
        try {
          return new Intl.DateTimeFormat(localeId, { month: 'short', day: 'numeric' }).format(new Date(year, month - 1, day))
        } catch {
          return key
        }
      }

      useEffect(() => {
        if (quizOpen || detailId || essayOpen) return undefined
        const onKey = event => {
          if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
          const target = event.target
          const tag = target?.tagName
          const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable
          if (event.key === 'Escape') {
            if (typing) target.blur()
            else {
              setActiveNoteId('')
              setQuery('')
            }
            return
          }
          if (typing) return
          if (event.key === '/') {
            event.preventDefault()
            searchRef.current?.focus()
            return
          }
          if (event.key === 'n') {
            event.preventDefault()
            setComposerOpen(true)
            setTimeout(() => composerRef.current?.focus(), 0)
            return
          }
          if (event.key === 'Home') {
            event.preventDefault()
            scrollToTop(pageRef.current)
            return
          }
          if (event.key !== 'j' && event.key !== 'k') return
          event.preventDefault()
          setActiveNoteId(current => {
            const list = groups.flatMap(([, entries]) => entries)
            if (!list.length) return ''
            let index = list.findIndex(note => note.id === current)
            if (index < 0) index = 0
            else index = Math.max(0, Math.min(list.length - 1, index + (event.key === 'j' ? 1 : -1)))
            const id = list[index]?.id || ''
            if (id) {
              setTimeout(() => {
                document.querySelector(`[data-note-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
              }, 0)
            }
            return id
          })
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
      }, [groups, quizOpen, detailId, essayOpen])

      useEffect(() => {
        if (!detailId) return
        if (!asArray(snap?.notes).some(note => note.id === detailId)) setDetailId('')
      }, [snap, detailId])

      useEffect(() => {
        const node = pageRef.current
        if (!node) return undefined
        const onScroll = () => setShowTop(node.scrollTop > 320)
        onScroll()
        node.addEventListener('scroll', onScroll, { passive: true })
        return () => node.removeEventListener('scroll', onScroll)
      }, [phase])

      if (!api) {
        return h('div', { className: cx('enw-page', `enw-scheme-${scheme}`) },
          h('div', { className: 'enw-inner' },
            h('div', { className: 'enw-card enw-state-card' },
              h('div', { className: 'enw-state-title' }, t('error.load')),
              h('p', { className: 'enw-state-text' }, t('error.api')),
              loadError ? h('p', { className: 'enw-state-detail' }, loadError) : null)))
      }

      if (phase === 'loading') {
        return h('div', { className: cx('enw-page', `enw-scheme-${scheme}`) },
          h('div', { className: 'enw-inner' },
            h('div', { className: 'enw-card enw-state-card' },
              h('span', { className: 'enw-spinner' }),
              h('span', { className: 'enw-state-text' }, t('common.loading')))))
      }

      if (phase === 'error' && !snap) {
        return h('div', { className: cx('enw-page', `enw-scheme-${scheme}`) },
          h('div', { className: 'enw-inner' },
            h('div', { className: 'enw-card enw-state-card' },
              h('div', { className: 'enw-state-title' }, t('error.load')),
              h('p', { className: 'enw-state-detail' }, loadError),
              h(Btn, { variant: 'primary', onClick: () => { setPhase('loading'); void refresh() } }, t('common.retry')))))
      }

      const notes = asArray(snap?.notes)
      const counts = snap?.stats?.counts || {}
      const stats = snap?.stats || {}
      const dueCount = stats.due ?? 0
      const quizAttention = Boolean(snap?.today && !snap.today.attempt) || Boolean(snap?.quizPending)
      const detailNote = detailId ? notes.find(note => note.id === detailId) || null : null
      const detailIndex = detailNote ? navNotes.findIndex(note => note.id === detailNote.id) : -1
      const stepDetail = delta => {
        if (detailIndex < 0 || navNotes.length < 2) return
        const nextIndex = wrapIndex(detailIndex, delta, navNotes.length)
        const next = navNotes[nextIndex]
        if (next) setDetailId(next.id)
      }
      const model = snap?.model || { available: false, label: '' }
      const categories = CATEGORIES
      const hasExpansions = notes.some(note => asArray(note.entries).some(entry => entry.expansion))
      const pendingExpansions = notes.filter(note => asArray(note.entries).some(entry => !entry.expansion))
      const canReorder = !organizedActive && filter === 'all' && statusFilter === 'all' && !tagFilter && !query.trim()
      const expandMissingLabel = busy === 'expand-missing'
        ? `${t('action.expandingMissing')} ${expandProgress?.done ?? 0}/${expandProgress?.total ?? pendingExpansions.length}`
        : `${t('action.expandMissing')} (${pendingExpansions.length})`

      return h('div', { ref: pageRef, className: cx('enw-page', `enw-scheme-${scheme}`, (quizOpen || detailId || essayOpen) && 'enw-page--modal') },
        h('div', { className: 'enw-inner' },
          h('header', { className: 'enw-head' },
            h('div', { className: 'enw-head-main' },
              h('h1', { className: 'enw-title' }, t('panel.title')),
              h('p', { className: 'enw-sub' }, t('panel.subtitle'))),
            h('div', { className: 'enw-head-actions' },
              h('span', { className: 'enw-count' }, `${notes.length}`),
              h(Btn, {
                variant: 'quiet',
                className: essayOpen ? 'enw-btn--on' : '',
                onClick: () => { void openEssay() },
                title: t('essay.open'),
                label: t('essay.open'),
              },
              h(Icon, { name: 'book', size: 15 }),
              h('span', { className: 'enw-btn-text' }, t('essay.open')),
              snap?.essay && !snap.essay.completed ? h('span', { className: 'enw-dot' }) : null),
              h(Btn, {
                variant: 'quiet',
                className: quizOpen ? 'enw-btn--on' : '',
                onClick: () => {
                  setActionError('')
                  setQuizOpen(true)
                  void refresh()
                },
                title: t('quiz.title'),
                label: t('quiz.title'),
              },
              h(Icon, { name: 'target', size: 15 }),
              h('span', { className: 'enw-btn-text' }, t('quiz.title')),
              quizAttention ? h('span', { className: 'enw-dot' }) : null),
              h(Btn, { variant: 'quiet', onClick: () => void refresh(), title: t('action.refresh'), label: t('action.refresh') }, h(Icon, { name: 'refresh', size: 15 })),
              h(Btn, {
                variant: 'quiet',
                onClick: toggleSidebar,
                title: t(sidebarCollapsed ? 'sidebar.expand' : 'sidebar.collapse'),
                label: t(sidebarCollapsed ? 'sidebar.expand' : 'sidebar.collapse'),
                className: sidebarCollapsed ? 'enw-btn--on' : '',
              }, h(Icon, { name: 'panel', size: 15 })),
              h(Btn, {
                variant: 'quiet',
                onClick: toggleSettings,
                title: t('action.settings'),
                label: t('action.settings'),
                className: settingsOpen && !sidebarCollapsed ? 'enw-btn--on' : '',
              }, h(Icon, { name: 'settings', size: 15 })))),

          actionError ? h(Banner, { tone: 'error', onClose: () => setActionError('') }, actionError) : null,
          notice ? h(Banner, { tone: 'ok' }, notice) : null,
          deleted ? h('div', { className: 'enw-undo' },
            h('span', { className: 'enw-undo-text' }, t('notice.deleted')),
            h(Btn, { variant: 'quiet', onClick: () => { void undoDelete() }, disabled: busy === 'restore' },
              busy === 'restore' ? h('span', { className: 'enw-spinner' }) : h(Icon, { name: 'refresh', size: 14 }),
              h('span', null, t('action.undo')))) : null,
          loadError ? h(Banner, { tone: 'warn', onClose: () => setLoadError('') }, `${t('error.load')} ${loadError}`) : null,

          h('div', { className: cx('enw-layout', sidebarCollapsed && 'enw-layout--collapsed') },
            h('div', { className: 'enw-main' },
              h('section', { className: cx('enw-card', 'enw-composer', !composerOpen && 'enw-composer--collapsed') },
                h('div', { className: 'enw-composer-head' },
                  h('span', { className: 'enw-composer-title' }, h(Icon, { name: 'plus', size: 15 }), t('form.heading')),
                  h('div', { className: 'enw-composer-head-actions' },
                    h('span', { className: 'enw-composer-hint' }, t(composerOpen ? 'form.hint' : 'form.expandHint')),
                    h('button', {
                      type: 'button',
                      className: 'enw-icon-btn',
                      onClick: toggleComposer,
                      title: t(composerOpen ? 'form.collapse' : 'form.expand'),
                      'aria-label': t(composerOpen ? 'form.collapse' : 'form.expand'),
                      'aria-expanded': composerOpen,
                    }, h(Icon, { name: composerOpen ? 'chevronUp' : 'chevronDown', size: 15 })))),
                composerOpen
                  ? h(
                    React.Fragment,
                    null,
                    h('textarea', {
                      className: 'enw-textarea',
                      ref: composerRef,
                      value: draft.text,
                      rows: 5,
                      placeholder: t('form.placeholder'),
                      onChange: event => setDraft(current => ({ ...current, text: event.target.value })),
                      onKeyDown: event => {
                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                          event.preventDefault()
                          addNote()
                        }
                      },
                    }),
                    h('input', {
                      className: 'enw-input',
                      value: draft.tags,
                      placeholder: t('form.tags'),
                      onChange: event => setDraft(current => ({ ...current, tags: event.target.value })),
                    }),
                    h('div', { className: 'enw-composer-foot' },
                      h('div', { className: 'enw-cat-row', role: 'group', 'aria-label': t('form.category') },
                        categories.map(category => h(Chip, {
                          key: category,
                          active: draft.category === category,
                          onClick: () => setDraft(current => ({ ...current, category })),
                        }, t(`category.${category}`)))),
                      h(Btn, { variant: 'primary', onClick: addNote, disabled: Boolean(busy) },
                        busy === 'add' ? h('span', { className: 'enw-spinner enw-spinner--light' }) : h(Icon, { name: 'plus', size: 15 }),
                        h('span', null, t('action.add')))))
                  : null),

              h('div', { className: 'enw-toolbar' },
                h('div', { className: 'enw-filters' },
                  h(Chip, { active: filter === 'all', onClick: () => setFilter('all'), count: notes.length }, t('filter.all')),
                  categories.map(category => h(Chip, {
                    key: category,
                    active: filter === category,
                    onClick: () => setFilter(category),
                    count: counts[category] ?? 0,
                  }, t(`category.${category}`))),
                  h('select', {
                    className: 'enw-select enw-status-select',
                    value: statusFilter,
                    'aria-label': t('filter.status'),
                    onChange: event => setStatusFilter(event.target.value),
                  },
                  h('option', { value: 'all' }, t('filter.allNotes')),
                  h('option', { value: 'due' }, `${t('filter.due')} (${dueCount})`),
                  h('option', { value: 'unexpanded' }, t('filter.unexpanded')),
                  h('option', { value: 'mastered' }, t('filter.mastered'))),
                  tagFilter
                    ? h('button', {
                      type: 'button',
                      className: 'enw-chip enw-chip--on enw-tag-chip',
                      onClick: () => setTagFilter(''),
                      title: t('filter.clearTag'),
                    }, `#${tagFilter}`, h(Icon, { name: 'close', size: 12 }))
                    : null),
                h('div', { className: 'enw-toolbar-actions' },
                  busy === 'expand-missing'
                    ? h(Btn, {
                      variant: 'quiet',
                      onClick: () => { void stopExpand() },
                      title: t('action.stop'),
                      label: t('action.stop'),
                    },
                    h(Icon, { name: 'close', size: 14 }),
                    h('span', { className: 'enw-btn-text' }, t('action.stop')))
                    : pendingExpansions.length
                      ? h(Btn, {
                        variant: 'quiet',
                        onClick: () => { void expandMissing() },
                        disabled: Boolean(busy),
                        title: expandMissingLabel,
                        label: expandMissingLabel,
                      },
                      busy === 'expand-missing' ? h('span', { className: 'enw-spinner' }) : h(Icon, { name: 'sparkles', size: 15 }),
                      h('span', { className: 'enw-btn-text' }, expandMissingLabel))
                      : null,
                  expandFailed.length && busy !== 'expand-missing'
                    ? h(Btn, {
                      variant: 'quiet',
                      onClick: () => { void expandMissing(expandFailed) },
                      disabled: Boolean(busy),
                      title: t('action.retryFailed'),
                      label: t('action.retryFailed'),
                    },
                    h(Icon, { name: 'refresh', size: 14 }),
                    h('span', { className: 'enw-btn-text' }, `${t('action.retryFailed')} (${expandFailed.length})`))
                    : null,
                  h('details', { className: 'enw-more' },
                    h('summary', { className: 'enw-more-summary', title: t('action.more'), 'aria-label': t('action.more') },
                      h(Icon, { name: 'more', size: 16 })),
                    h('div', { className: 'enw-more-menu' },
                      h(Btn, {
                        variant: 'quiet',
                        onClick: event => {
                          event.currentTarget.closest('details')?.removeAttribute('open')
                          void runOrganize()
                        },
                        disabled: Boolean(busy),
                        title: t('organize.action'),
                        label: t('organize.action'),
                      },
                      busy === 'organize' ? h('span', { className: 'enw-spinner' }) : h(Icon, { name: 'sparkles', size: 15 }),
                      h('span', { className: 'enw-btn-text' }, t('organize.action'))),
                      snap?.organization
                        ? h(Btn, {
                          variant: 'quiet',
                          onClick: event => {
                            event.currentTarget.closest('details')?.removeAttribute('open')
                            chooseGroupMode(organizedActive ? 'time' : 'organized')
                          },
                          title: t(organizedActive ? 'organize.byTime' : 'organize.byTopic'),
                          label: t(organizedActive ? 'organize.byTime' : 'organize.byTopic'),
                        },
                        h(Icon, { name: organizedActive ? 'clock' : 'book', size: 15 }),
                        h('span', { className: 'enw-btn-text' }, t(organizedActive ? 'organize.byTime' : 'organize.byTopic')))
                        : null,
                      hasExpansions
                        ? h(Btn, {
                          variant: 'quiet',
                          onClick: event => {
                            event.currentTarget.closest('details')?.removeAttribute('open')
                            collapseExpansions()
                          },
                          title: t('action.collapseExpansions'),
                          label: t('action.collapseExpansions'),
                        },
                        h(Icon, { name: 'chevronUp', size: 14 }),
                        h('span', { className: 'enw-btn-text' }, t('action.collapseExpansions')))
                        : null)),
                  h('div', { className: 'enw-view-toggle', role: 'group', 'aria-label': t('view.label') },
                    h('button', {
                      type: 'button',
                      className: cx('enw-view-btn', viewMode === 'list' && 'enw-view-btn--on'),
                      onClick: () => chooseView('list'),
                      title: t('view.list'),
                      'aria-label': t('view.list'),
                      'aria-pressed': viewMode === 'list',
                    }, h(Icon, { name: 'list', size: 15 })),
                    h('button', {
                      type: 'button',
                      className: cx('enw-view-btn', viewMode === 'grid' && 'enw-view-btn--on'),
                      onClick: () => chooseView('grid'),
                      title: t('view.grid'),
                      'aria-label': t('view.grid'),
                      'aria-pressed': viewMode === 'grid',
                    }, h(Icon, { name: 'grid', size: 15 }))),
                  h('label', { className: 'enw-search' },
                    h(Icon, { name: 'search', size: 15 }),
                    h('input', {
                      className: 'enw-search-input',
                      ref: searchRef,
                      value: query,
                      placeholder: t('filter.search'),
                      onChange: event => setQuery(event.target.value),
                    })))),

              organizePlan && notes.length > 0
                ? h(OrganizePanel, {
                  plan: organizePlan,
                  notes,
                  t,
                  localeId,
                  busy,
                  onApply: applyOrganize,
                  onClose: () => setOrganizePlan(null),
                })
                : null,

              notes.length === 0
                ? h('div', { className: 'enw-card enw-empty' },
                  h('div', { className: 'enw-empty-icon' }, h(Glyph, { size: 34 })),
                  h('h2', { className: 'enw-empty-title' }, t('empty.title')),
                  h('p', { className: 'enw-empty-text' }, t('empty.body')))
                : groups.length === 0
                  ? h('div', { className: 'enw-card enw-empty' },
                    h('h2', { className: 'enw-empty-title' }, t('filter.empty')),
                    h('p', { className: 'enw-empty-text' }, t('filter.emptyHint')))
                  : h('div', { className: cx('enw-groups', viewMode === 'grid' && 'enw-groups--grid') },
                    groups.map(([key, entries]) => {
                      const groupMeta = organizedActive
                        ? asArray(snap?.organization?.groups).find(group => group.title === key)
                        : null
                      return h('div', { key: organizedActive ? `topic:${key || 'ungrouped'}` : key, className: 'enw-group' },
                        h('div', { className: 'enw-group-head' },
                          h('span', { className: 'enw-group-label' }, organizedActive ? (key || t('organize.ungrouped')) : dayLabel(key)),
                          h('span', { className: 'enw-group-line' }),
                          h('span', { className: 'enw-group-count' }, `${entries.length}`)),
                        organizedActive && groupMeta?.summary ? h('p', { className: 'enw-group-summary' }, groupMeta.summary) : null,
                        h('div', { className: 'enw-group-notes' },
                          entries.map(note => h(NoteCard, {
                            key: note.id,
                            note,
                            t,
                            localeId,
                            busy,
                            collapseSignal,
                            onExpandAll: expandAll,
                            onExpandEntry: expandEntry,
                            onUpdate: updateNote,
                            onDelete: deleteNote,
                            onPin: pinNote,
                            onOpen: target => setDetailId(target.id),
                            onTag: tag => {
                              setTagFilter(tag)
                              setFilter('all')
                            },
                            canReorder,
                            onDragStartNote: dragged => setDragNoteId(dragged.id),
                            onDropNote: target => { void dropNote(target) },
                            active: activeNoteId === note.id,
                          }))))
                    }))),

            h('aside', { className: 'enw-aside' },
              settingsOpen
                ? h(SettingsCard, {
                  settings: snap?.settings || { quizTime: '08:00', dailyCount: 5, enabled: true, llm: { provider: '', model: '', reasoningEffort: '' }, prompts: {} },
                  model,
                  promptDefaults: snap?.promptDefaults || {},
                  t,
                  localeId,
                  backup: snap?.backup,
                  busy,
                  api,
                  onRefresh: refresh,
                  onSave: saveSettings,
                  onClose: () => setSettingsOpen(false),
                })
                : null,
              h(UsageCard, { usage: snap?.usage, settings: snap?.settings || null, t, localeId }),
              h('section', { className: 'enw-card enw-aside-card' },
                h('div', { className: 'enw-aside-head' },
                  h('span', { className: 'enw-aside-title' }, h(Icon, { name: 'book', size: 16 }), t('stats.title'))),
                h('dl', { className: 'enw-stats' },
                  h('div', { className: 'enw-stat' }, h('dt', null, t('stats.total')), h('dd', null, String(notes.length))),
                  h('div', { className: 'enw-stat' }, h('dt', null, t('stats.entries')), h('dd', null, String(stats.entries ?? 0))),
                  h('div', { className: 'enw-stat' }, h('dt', null, t('stats.due')), h('dd', null, String(stats.due ?? 0))),
                  h('div', { className: 'enw-stat' }, h('dt', null, t('stats.accuracy')), h('dd', null, stats.accuracy7 == null ? '—' : `${Math.round(stats.accuracy7 * 100)}%`)),
                  h('div', { className: 'enw-stat' }, h('dt', null, t('stats.reviewedToday')), h('dd', null, String(stats.reviewedToday ?? 0))),
                  h('div', { className: 'enw-stat' }, h('dt', null, t('stats.pending')), h('dd', null, stats.pending ? t('stats.yes') : t('stats.no'))),
                  h('div', { className: 'enw-stat' }, h('dt', null, t('stats.streak')), h('dd', null, `${stats.streak ?? 0}`))))),
            h(QuizModal, {
              open: quizOpen,
              onClose: () => setQuizOpen(false),
              quiz: snap?.today || null,
              history: asArray(snap?.history),
              t,
              localeId,
              busy,
              modelAvailable: model.available,
              settings: snap?.settings || null,
              nextQuizAt: snap?.nextQuizAt ?? null,
              quizPending: Boolean(snap?.quizPending),
              dueCount,
              error: actionError,
              onRefresh: refresh,
              onGenerate: generateQuiz,
              onGrade: gradeQuiz,
              onModelGrade: gradeWithModel,
            }),
            detailNote
              ? h(NoteDetailModal, {
                note: detailNote,
                t,
                localeId,
                position: detailIndex + 1,
                total: navNotes.length,
                onPrev: () => stepDetail(-1),
                onNext: () => stepDetail(1),
                onClose: () => setDetailId(''),
                onTag: tag => {
                  setTagFilter(tag)
                  setFilter('all')
                },
              })
              : null,
          ),
        ),
        h(BackToTop, {
          visible: showTop && !quizOpen && !detailId && !essayOpen,
          onClick: () => scrollToTop(pageRef.current),
          t,
        }),
        essayOpen
          ? h(EssayReader, {
            data: essayData,
            phase: essayPhase,
            error: essayError,
            busy: essayBusy,
            modelAvailable: model.available,
            t,
            localeId,
            onClose: closeEssay,
            onRetry: () => { void openEssay() },
            onGenerate: () => { void generateEssay() },
            onSaveProgress: patch => { void saveEssayProgress(patch) },
            onAdd: addEssaySelection,
          })
          : null,
      )
    }

    // -- sidebar icon -------------------------------------------------------

    function SidebarIcon({ size = 20 }) {
      const pending = useSyncExternalStore(badge.subscribe, badge.get, badge.get)
      return h('span', { className: 'enw-rail', 'aria-hidden': true },
        h(Glyph, { size: Math.max(16, Math.min(size, 24)) }),
        pending ? h('span', { className: 'enw-rail-dot' }) : null)
    }

    // -- module -------------------------------------------------------------

    const STYLES = `
      .enw-page {
        height: 100%;
        min-height: 100%;
        overflow-y: auto;
        box-sizing: border-box;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
        font-size: 13px;
        line-height: 1.55;
      }
      .enw-page--modal { overflow: hidden; }
      .enw-top-btn { position: fixed; right: 24px; bottom: 24px; z-index: 40; display: inline-flex; align-items: center; gap: 6px; padding: 8px 13px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, transparent); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer; box-shadow: 0 10px 28px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent); backdrop-filter: blur(8px); opacity: 0; visibility: hidden; transform: translateY(8px); transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease, color 140ms ease, border-color 140ms ease; }
      .enw-top-btn--on { opacity: 1; visibility: visible; transform: none; }
      .enw-top-btn:hover { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
      .enw-top-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .enw-inner { max-width: 1120px; margin: 0 auto; padding: 28px 28px 64px; }
      .enw-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 20px; }
      .enw-title { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.015em; }
      .enw-title::before { content: ''; display: block; width: 4px; height: 22px; border-radius: 2px; background: var(--dsw-alias-brand-primary); flex: none; }
      .enw-sub { margin: 8px 0 0; max-width: 680px; color: var(--dsw-alias-label-secondary); font-size: 13px; }
      .enw-head-actions { display: flex; align-items: center; gap: 6px; padding-top: 2px; }
      .enw-count { min-width: 26px; text-align: center; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); }
      .enw-dot { display: inline-block; width: 6px; height: 6px; margin-left: 3px; border-radius: 50%; background: var(--dsw-alias-brand-primary); flex: none; }
      .enw-modal-backdrop { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-bg-base) 64%, transparent); backdrop-filter: blur(3px); }
      .enw-modal-backdrop--closed { display: none; }
      .enw-modal { width: min(720px, 100%); max-height: min(88vh, 900px); overflow-y: auto; overscroll-behavior: contain; padding: 20px 22px 22px; border-radius: 16px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); box-shadow: 0 24px 80px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent); scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--dsw-alias-label-secondary) 38%, transparent) transparent; }
      .enw-modal::-webkit-scrollbar { width: 9px; }
      .enw-modal::-webkit-scrollbar-track { background: transparent; }
      .enw-modal::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--dsw-alias-label-secondary) 34%, transparent); border-radius: 999px; border: 2px solid transparent; background-clip: content-box; }
      .enw-modal .enw-aside-card { padding: 0; border: 0; background: transparent; }
      .enw-modal-close { flex: none; }
      .enw-modal-error { margin: 0 0 12px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); color: var(--dsw-alias-state-error-primary); font-size: 12px; }
      .enw-note-backdrop { --enw-accent: var(--dsw-alias-state-idle-primary); background: color-mix(in srgb, var(--enw-accent) 7%, color-mix(in srgb, var(--dsw-alias-bg-base) 64%, transparent)); transition: background-color 180ms ease; }
      .enw-note-modal-shell { display: flex; align-items: center; justify-content: center; gap: 12px; width: min(880px, 100%); }
      .enw-note-modal { width: min(780px, 100%); background: color-mix(in srgb, var(--enw-accent) 9%, var(--dsw-alias-bg-layer-1)); border-color: color-mix(in srgb, var(--enw-accent) 30%, var(--dsw-alias-border-l1)); border-top: 3px solid var(--enw-accent); transition: background-color 180ms ease, border-color 180ms ease; }
      .enw-note-modal-head-actions { display: flex; align-items: center; gap: 8px; flex: none; }
      .enw-note-modal-pos { font-size: 11.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-note-nav { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; box-shadow: 0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent); transition: color 140ms ease, border-color 140ms ease, transform 140ms ease; }
      .enw-note-nav:hover { color: var(--enw-accent); border-color: color-mix(in srgb, var(--enw-accent) 55%, var(--dsw-alias-border-l1)); transform: scale(1.04); }
      .enw-note-nav:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .enw-note-modal-footnav { display: none; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 12px; padding-bottom: 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .enw-note-foot-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 11px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer; }
      .enw-note-foot-btn:hover { border-color: color-mix(in srgb, var(--enw-accent) 55%, var(--dsw-alias-border-l1)); color: var(--enw-accent); }
      .enw-note-foot-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .enw-note-foot-pos { font-size: 11.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-essay-view { --enw-accent: var(--dsw-alias-brand-primary); position: fixed; inset: 0; z-index: 90; display: flex; flex-direction: column; height: 100%; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }
      .enw-essay-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 22px; border-bottom: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); flex: none; }
      .enw-essay-back { display: inline-flex; align-items: center; gap: 5px; padding: 5px 7px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer; }
      .enw-essay-back:hover { color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-2); }
      .enw-essay-back:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
      .enw-essay-bar-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
      .enw-essay-kicker { font-size: 13px; font-weight: 650; }
      .enw-essay-date { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .enw-essay-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
      .enw-essay-close { flex: none; }
      .enw-essay-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--dsw-alias-label-secondary) 38%, transparent) transparent; }
      .enw-essay-scroll::-webkit-scrollbar { width: 9px; }
      .enw-essay-scroll::-webkit-scrollbar-track { background: transparent; }
      .enw-essay-scroll::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--dsw-alias-label-secondary) 34%, transparent); border-radius: 999px; border: 2px solid transparent; background-clip: content-box; }
      .enw-essay-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 30px; align-items: start; width: min(1120px, 100%); margin: 0 auto; padding: 28px 28px 110px; box-sizing: border-box; }
      .enw-essay-main { min-width: 0; }
      .enw-essay-meta { margin: 0 0 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-essay-title { margin: 0 0 16px; font-size: 27px; line-height: 1.28; letter-spacing: -0.015em; }
      .enw-essay-prompt-card { padding: 12px 16px; border-left: 3px solid var(--dsw-alias-brand-primary); border-radius: 9px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-1)); }
      .enw-essay-prompt { margin: 6px 0 0; font-size: 13.5px; line-height: 1.7; }
      .enw-essay-label { font-size: 10.5px; font-weight: 650; letter-spacing: 0.07em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .enw-essay-think { margin-top: 14px; }
      .enw-essay-think .enw-essay-label { display: block; margin-bottom: 5px; }
      .enw-essay-outline-input { min-height: 68px; font-size: 12.5px; }
      .enw-essay-body { margin-top: 24px; max-width: 72ch; }
      .enw-essay-paragraph { margin: 0 0 24px; }
      .enw-essay-para-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 3px; }
      .enw-essay-role { display: block; font-size: 10px; font-weight: 650; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .enw-essay-text { margin: 0; font-size: 15.5px; line-height: 1.9; }
      .enw-essay-sentence { border-radius: 3px; transition: background-color 120ms ease; }
      .enw-essay-sentence--note { cursor: pointer; border-bottom: 1px dashed color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, transparent); }
      .enw-essay-sentence--note:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }
      .enw-essay-zh { margin: 7px 0 0; padding-left: 10px; border-left: 2px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 1.8; }
      .enw-essay-section { margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .enw-essay-section-title { margin: 0 0 12px; font-size: 15px; }
      .enw-essay-outline { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
      .enw-essay-outline li { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 10px; align-items: baseline; }
      .enw-essay-outline strong { font-size: 11.5px; color: var(--dsw-alias-brand-primary); }
      .enw-essay-outline span { font-size: 13px; color: var(--dsw-alias-label-secondary); line-height: 1.7; }
      .enw-essay-cohesive { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 14px; }
      .enw-essay-cohesive .enw-essay-label { margin-right: 4px; }
      .enw-essay-vocab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
      .enw-essay-vocab-card { padding: 12px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }
      .enw-essay-vocab-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 7px; }
      .enw-essay-vocab-head strong { font-size: 14px; }
      .enw-essay-vocab-head span { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .enw-essay-vocab-line { margin: 6px 0 0; font-size: 12.5px; line-height: 1.6; }
      .enw-essay-vocab-collocation { color: var(--dsw-alias-brand-primary); }
      .enw-essay-vocab-example { margin: 6px 0 8px; font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); font-style: italic; }
      .enw-essay-question { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .enw-essay-question:first-of-type { margin-top: 0; padding-top: 0; border-top: 0; }
      .enw-essay-question-prompt { margin: 0 0 9px; font-size: 13.5px; line-height: 1.7; }
      .enw-essay-options { display: flex; flex-direction: column; gap: 6px; }
      .enw-essay-option { width: 100%; padding: 8px 11px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; line-height: 1.55; text-align: left; cursor: pointer; }
      .enw-essay-option:hover { border-color: var(--dsw-alias-brand-primary); }
      .enw-essay-option:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .enw-essay-option--chosen { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, var(--dsw-alias-bg-layer-1)); }
      .enw-essay-option--correct { border-color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, var(--dsw-alias-bg-layer-1)); }
      .enw-essay-option--wrong { border-color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, var(--dsw-alias-bg-layer-1)); }
      .enw-essay-feedback { margin: 7px 0 0; font-size: 12px; line-height: 1.65; color: var(--dsw-alias-label-secondary); }
      .enw-essay-feedback strong { color: var(--dsw-alias-label-primary); }
      .enw-essay-rail { position: sticky; top: 12px; display: flex; flex-direction: column; gap: 12px; }
      .enw-essay-rail-card { padding: 14px; border-radius: 12px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }
      .enw-essay-rail-title { margin: 0 0 7px; font-size: 12.5px; }
      .enw-essay-rail-hint { margin: 0; font-size: 12px; line-height: 1.7; color: var(--dsw-alias-label-secondary); }
      .enw-essay-rail-sentence { margin: 0 0 8px; font-size: 13px; line-height: 1.7; }
      .enw-essay-rail-section { margin-top: 10px; }
      .enw-essay-rail-section p { margin: 3px 0 0; font-size: 12.5px; line-height: 1.7; color: var(--dsw-alias-label-secondary); }
      .enw-essay-rail-progress { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 14px; padding-top: 11px; border-top: 1px solid var(--dsw-alias-border-l1); font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .enw-essay-rail-outline { margin: 6px 0 0; font-size: 11.5px; line-height: 1.65; color: var(--dsw-alias-label-secondary); }
      .enw-essay-rail-outline strong { display: block; color: var(--dsw-alias-label-primary); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; }
      .enw-essay-banner { margin-bottom: 14px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); color: var(--dsw-alias-state-error-primary); font-size: 12px; }
      .enw-essay-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 50vh; padding: 60px 20px; color: var(--dsw-alias-label-secondary); text-align: center; }
      .enw-essay-state p { margin: 0; font-size: 13px; }
      .enw-essay-selectbar { position: fixed; left: 50%; bottom: 18px; z-index: 2; display: flex; align-items: center; gap: 12px; width: min(760px, calc(100vw - 32px)); padding: 10px 12px; transform: translateX(-50%); border-radius: 13px; border: 1px solid var(--dsw-alias-border-l2); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 96%, transparent); box-shadow: 0 16px 40px color-mix(in srgb, var(--dsw-alias-label-primary) 20%, transparent); backdrop-filter: blur(10px); }
      .enw-essay-select-main { display: flex; align-items: baseline; gap: 7px; min-width: 0; flex: 1; }
      .enw-essay-select-label { flex: none; font-size: 10px; font-weight: 650; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .enw-essay-select-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }
      .enw-essay-select-actions { display: flex; align-items: center; gap: 6px; flex: none; }
      .enw-essay-select-cat { width: 118px; }
      .enw-essay-toast { position: fixed; left: 50%; bottom: 88px; z-index: 3; padding: 7px 12px; transform: translateX(-50%); border-radius: 999px; background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-base); font-size: 12px; box-shadow: 0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent); }
      .enw-note-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid color-mix(in srgb, var(--enw-accent) 26%, var(--dsw-alias-border-l1)); }
      .enw-note-modal-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
      .enw-note-modal-kicker { font-size: 13px; font-weight: 650; }
      .enw-note-modal-date { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .enw-note-modal-count { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .enw-note-modal-close { flex: none; }
      .enw-note-modal-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin-bottom: 12px; }
      .enw-note-modal-meta .enw-pill { display: inline-flex; align-items: center; gap: 4px; }
      .enw-note-modal-body { display: flex; flex-direction: column; gap: 16px; }
      .enw-note-modal-entry { display: flex; flex-direction: column; gap: 4px; padding-bottom: 14px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .enw-note-modal-entry:last-child { padding-bottom: 0; border-bottom: 0; }
      .enw-note-modal-entry .enw-entry-text { font-size: 14px; }
      .enw-note-modal-empty { margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .enw-note-modal-review { margin-top: 4px; }
      .enw-layout { display: grid; grid-template-columns: minmax(0, 1fr) 336px; gap: 20px; align-items: start; }
      .enw-layout--collapsed { grid-template-columns: minmax(0, 1fr); }
      .enw-layout--collapsed .enw-aside { display: none; }
      .enw-main { min-width: 0; display: flex; flex-direction: column; gap: 16px; }
      .enw-aside { min-width: 0; display: flex; flex-direction: column; gap: 14px; position: sticky; top: 12px; max-height: calc(100vh - 24px); overflow-y: auto; overscroll-behavior: contain; padding-right: 4px; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--dsw-alias-label-secondary) 38%, transparent) transparent; }
      .enw-aside::-webkit-scrollbar { width: 8px; }
      .enw-aside::-webkit-scrollbar-track { background: transparent; }
      .enw-aside::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--dsw-alias-label-secondary) 34%, transparent); border-radius: 999px; border: 2px solid transparent; background-clip: content-box; }
      .enw-aside::-webkit-scrollbar-thumb:hover { background: color-mix(in srgb, var(--dsw-alias-label-secondary) 55%, transparent); border: 2px solid transparent; background-clip: content-box; }
      .enw-card { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; }
      .enw-composer { padding: 16px 16px 14px; }
      .enw-composer--collapsed .enw-composer-head { margin-bottom: 0; }
      .enw-composer-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
      .enw-composer-head-actions { display: inline-flex; align-items: center; gap: 8px; }
      .enw-composer-title { display: inline-flex; align-items: center; gap: 7px; font-weight: 600; font-size: 13px; }
      .enw-composer-hint { color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
      .enw-textarea { display: block; width: 100%; box-sizing: border-box; resize: vertical; min-height: 80px; padding: 10px 12px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; line-height: 1.6; }
      .enw-textarea::placeholder, .enw-input::placeholder, .enw-search-input::placeholder { color: var(--dsw-alias-label-secondary); opacity: 0.85; }
      .enw-textarea:focus, .enw-input:focus, .enw-search-input:focus, .enw-quiz-input:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; border-color: transparent; }
      .enw-composer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
      .enw-input { width: 100%; box-sizing: border-box; padding: 8px 11px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; }
      .enw-input--time { width: 132px; }
      .enw-input--count { width: 84px; }
      .enw-select { width: 100%; box-sizing: border-box; padding: 6px 9px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }
      .enw-select:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .enw-select:disabled { opacity: 0.55; cursor: default; }
      .enw-settings-group { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1); display: flex; flex-direction: column; }
      .enw-settings-group-head { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
      .enw-field { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
      .enw-field-label { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .enw-prompt-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .enw-link-btn { border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11.5px; cursor: pointer; padding: 0; }
      .enw-link-btn:hover { text-decoration: underline; }
      .enw-prompts { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
      .enw-prompt-placeholders { margin: 0; font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; overflow-wrap: anywhere; }
      .enw-prompt-input { width: 100%; box-sizing: border-box; resize: vertical; min-height: 140px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 11.5px; line-height: 1.5; }
      .enw-prompt-input:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .enw-prompt-actions { display: flex; justify-content: flex-end; }
      .enw-setting-error { margin: 6px 0 0; font-size: 11px; color: var(--dsw-alias-state-error-primary); overflow-wrap: anywhere; }
      .enw-data-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .enw-file-input { display: none; }
      .enw-data-backup { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-top: 10px; }
      .enw-data-notice { margin: 6px 0 0; color: var(--dsw-alias-state-success-primary); }
      .enw-undo { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; margin-bottom: 12px; border-radius: 9px; border: 1px dashed var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); font-size: 12px; }
      .enw-undo-text { overflow-wrap: anywhere; }
      .enw-usage { display: flex; flex-direction: column; gap: 8px; }
      .enw-usage-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .enw-usage-model { font-size: 11.5px; overflow-wrap: anywhere; }
      .enw-usage-purpose { font-size: 10px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
      .enw-usage-effort { font-size: 10px; padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
      .enw-usage-time { margin-left: auto; font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-usage-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
      .enw-usage-cell { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); min-width: 0; }
      .enw-usage-cell span { font-size: 10px; letter-spacing: 0.03em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .enw-usage-cell strong { font-size: 14px; font-variant-numeric: tabular-nums; }
      .enw-usage-total { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; border-top: 1px solid var(--dsw-alias-border-l1); padding-top: 8px; }
      .enw-usage-total strong { font-size: 12px; font-variant-numeric: tabular-nums; text-align: right; }
      .enw-usage-cost { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .enw-usage-cost strong { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-brand-primary); }
      .enw-usage-breakdown { border-top: 1px dashed var(--dsw-alias-border-l1); padding-top: 7px; }
      .enw-usage-purposes { display: flex; flex-direction: column; gap: 5px; margin-top: 6px; }
      .enw-usage-purpose-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: baseline; gap: 8px; font-size: 11px; }
      .enw-usage-purpose-name { font-weight: 600; }
      .enw-usage-purpose-meta { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; color: var(--dsw-alias-label-secondary); }
      .enw-usage-purpose-cost { font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary); }
      .enw-price-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
      .enw-price-currency { grid-column: 1 / -1; }
      .enw-composer-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
      .enw-cat-row, .enw-filters { display: flex; flex-wrap: wrap; gap: 6px; }
      .enw-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer; }
      .enw-chip:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .enw-chip--on { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); font-weight: 550; }
      .enw-chip-count { font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .enw-toolbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .enw-more { position: relative; }
      .enw-more-summary { list-style: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; color: var(--dsw-alias-label-secondary); cursor: pointer; }
      .enw-more-summary::-webkit-details-marker { display: none; }
      .enw-more-summary:hover, .enw-more[open] .enw-more-summary { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .enw-more-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; min-width: 190px; display: flex; flex-direction: column; gap: 2px; padding: 6px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); box-shadow: 0 10px 28px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent); }
      .enw-more-menu .enw-btn { width: 100%; justify-content: flex-start; }
      .enw-view-toggle { display: inline-flex; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; overflow: hidden; background: var(--dsw-alias-bg-layer-1); }
      .enw-view-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 26px; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
      .enw-view-btn + .enw-view-btn { border-left: 1px solid var(--dsw-alias-border-l1); }
      .enw-view-btn:hover { color: var(--dsw-alias-label-primary); }
      .enw-view-btn--on { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); }
      .enw-search { display: inline-flex; align-items: center; gap: 7px; padding: 5px 10px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); }
      .enw-search-input { border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; width: 170px; }
      .enw-search-input:focus { outline: none; }
      .enw-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font: inherit; font-size: 12.5px; font-weight: 550; border: 1px solid transparent; background: transparent; color: var(--dsw-alias-label-primary); cursor: pointer; white-space: nowrap; }
      .enw-btn:disabled { opacity: 0.55; cursor: default; }
      .enw-btn--primary { background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); }
      .enw-btn--primary:hover:not(:disabled) { opacity: 0.92; }
      .enw-btn--ghost { border-color: var(--dsw-alias-border-l1); }
      .enw-btn--ghost:hover:not(:disabled), .enw-btn--quiet:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
      .enw-btn--quiet { color: var(--dsw-alias-label-secondary); }
      .enw-btn--quiet:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
      .enw-btn--on { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .enw-btn--danger { background: transparent; border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
      .enw-btn--danger:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
      .enw-block { width: 100%; margin-top: 10px; }
      .enw-icon { flex: none; }
      .enw-banner { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; border: 1px solid var(--dsw-alias-border-l1); margin-bottom: 12px; font-size: 12.5px; }
      .enw-banner--error { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
      .enw-banner--warn { border-color: var(--dsw-alias-state-warn-primary); color: var(--dsw-alias-state-warn-primary); }
      .enw-banner--ok { border-color: var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
      .enw-banner-text { flex: 1; min-width: 0; }
      .enw-banner-close { border: 0; background: transparent; color: inherit; cursor: pointer; padding: 2px; display: inline-flex; }
      .enw-organize { padding: 16px; border-top: 3px solid var(--dsw-alias-brand-primary); }
      .enw-organize-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .enw-organize-head-main { min-width: 0; }
      .enw-organize-title { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 15px; font-weight: 650; }
      .enw-organize-summary { margin: 6px 0 0; max-width: 780px; color: var(--dsw-alias-label-primary); font-size: 12.5px; }
      .enw-organize-hint { margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
      .enw-organize-label { margin-top: 14px; color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
      .enw-organize-groups { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; max-height: 360px; overflow: auto; margin-top: 6px; padding-right: 4px; }
      .enw-organize-group { min-width: 0; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-2); }
      .enw-organize-group-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .enw-organize-group-title { font-size: 13px; font-weight: 650; }
      .enw-organize-count { flex: none; color: var(--dsw-alias-label-secondary); font-size: 11px; }
      .enw-organize-group-summary { margin: 4px 0 6px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
      .enw-organize-notes { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
      .enw-organize-note { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: 12px; }
      .enw-organize-note-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .enw-organize-note-cat { flex: none; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }
      .enw-organize-section { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .enw-organize-change, .enw-organize-relation { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin: 5px 0; font-size: 12px; }
      .enw-organize-change-text { max-width: 46%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .enw-organize-arrow { color: var(--dsw-alias-label-secondary); }
      .enw-organize-cat { font-weight: 600; }
      .enw-organize-kind { flex: none; padding: 1px 7px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }
      .enw-organize-relation-notes { font-weight: 550; }
      .enw-organize-relation-note { flex-basis: 100%; color: var(--dsw-alias-label-secondary); }
      .enw-organize-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 16px; }
      .enw-group-summary { margin: -2px 2px 0; color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .enw-groups { display: flex; flex-direction: column; gap: 16px; }
      .enw-group { display: flex; flex-direction: column; gap: 8px; }
      .enw-group-notes { display: flex; flex-direction: column; gap: 8px; }
      .enw-groups--grid .enw-group-notes { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; align-items: start; }
      .enw-groups--grid .enw-note { min-height: 0; }
      .enw-groups--grid .enw-note-actions .enw-btn-text { display: none; }
      .enw-groups--grid .enw-note-head { flex-wrap: wrap; row-gap: 4px; }
      .enw-group-head { display: flex; align-items: center; gap: 10px; padding: 0 2px; }
      .enw-group-label { max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11.5px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .enw-group-line { flex: 1; height: 1px; background: var(--dsw-alias-border-l1); }
      .enw-group-count { font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-note { --enw-accent: var(--dsw-alias-state-idle-primary); position: relative; padding: 12px 14px 12px 16px; border-radius: 11px; border: 1px solid var(--dsw-alias-border-l1); border-left: 3px solid var(--enw-accent); background: var(--dsw-alias-bg-layer-1); background: color-mix(in srgb, var(--enw-accent) 6%, var(--dsw-alias-bg-layer-1)); }
      .enw-note--word { --enw-accent: var(--dsw-alias-state-success-primary); }
      .enw-note--phrase { --enw-accent: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, var(--dsw-alias-state-success-primary)); }
      .enw-note--collocation { --enw-accent: var(--dsw-alias-state-warn-primary); }
      .enw-note--pattern { --enw-accent: var(--dsw-alias-brand-primary); }
      .enw-note--sentence { --enw-accent: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, var(--dsw-alias-state-error-primary)); }
      .enw-note--other { --enw-accent: var(--dsw-alias-state-idle-primary); }
      .enw-note-head { display: flex; align-items: center; gap: 8px; }
      .enw-note-time { font-size: 11.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-cat { font-size: 10.5px; padding: 1px 7px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--enw-accent) 42%, transparent); color: var(--enw-accent); background: color-mix(in srgb, var(--enw-accent) 10%, transparent); }
      .enw-note-flag { font-size: 10.5px; color: var(--dsw-alias-label-secondary); padding: 1px 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); }
      .enw-note-flag--toggle { display: inline-flex; align-items: center; gap: 3px; border: 0; font: inherit; font-size: 10.5px; cursor: pointer; }
      .enw-note-flag--toggle:hover { color: var(--dsw-alias-label-primary); }
      .enw-note-flag--toggle:disabled { cursor: default; opacity: 0.6; }
      .enw-note-flag--toggle .enw-icon { flex: none; }
      .enw-note-summary { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 8px; padding: 2px 0; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14.5px; font-weight: 550; line-height: 1.5; text-align: left; cursor: pointer; }
      .enw-note-summary-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .enw-note-summary .enw-icon { flex: none; color: var(--dsw-alias-label-secondary); }
      .enw-note-summary:hover .enw-note-summary-text { color: var(--dsw-alias-brand-primary); }
      .enw-note-actions { margin-left: auto; display: flex; align-items: center; gap: 2px; opacity: 0.7; }
      .enw-note:hover .enw-note-actions { opacity: 1; }
      .enw-note-text { margin: 8px 0 0; font-size: 15px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
      .enw-entries { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
      .enw-entry { display: flex; flex-direction: column; gap: 4px; padding-left: 10px; border-left: 2px solid var(--dsw-alias-border-l1); }
      .enw-entry-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
      .enw-entry-text { margin: 0; font-size: 15.5px; font-weight: 550; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
      .enw-entry-translation { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
      .enw-entry-btn { padding: 2px 6px; opacity: 0.6; }
      .enw-entry:hover .enw-entry-btn { opacity: 1; }
      .enw-note-editor { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
      .enw-editor-actions { justify-content: space-between; gap: 8px; }
      .enw-editor-save { display: flex; gap: 6px; margin-left: auto; }
      .enw-editor-delete { color: var(--dsw-alias-state-error-primary); }
      .enw-editor-delete:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent); }
      .enw-confirm--editor { margin: 8px 0 0; }
      .enw-note-translation { margin: 6px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; white-space: pre-wrap; overflow-wrap: anywhere; }
      .enw-note-translation-label { display: inline-block; margin-right: 6px; font-size: 10.5px; letter-spacing: 0.04em; text-transform: uppercase; opacity: 0.8; }
      .enw-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .enw-tag { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .enw-tag--button { border: 0; background: transparent; padding: 0; font: inherit; font-size: 11px; cursor: pointer; }
      .enw-tag--button:hover { color: var(--dsw-alias-brand-primary); text-decoration: underline; }
      .enw-tag-chip { display: inline-flex; align-items: center; gap: 4px; }
      .enw-status-select { width: auto; min-width: 118px; max-width: 180px; padding-top: 4px; padding-bottom: 4px; font-size: 11.5px; }
      .enw-drag-handle { display: inline-flex; align-items: center; color: var(--dsw-alias-label-secondary); cursor: grab; opacity: 0.55; flex: none; }
      .enw-drag-handle:hover { opacity: 1; }
      .enw-note--active { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .enw-btn-text { display: inline; }
      .enw-exp { margin-top: 10px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); overflow: hidden; }
      .enw-exp-toggle { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer; text-align: left; }
      .enw-exp-toggle-main { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
      .enw-exp-toggle-hint { flex: 1; min-width: 0; color: var(--dsw-alias-label-secondary); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .enw-exp-toggle-hint--meaning { color: var(--dsw-alias-label-primary); font-weight: 600; }
      .enw-chevron { transition: transform 140ms ease; }
      .enw-exp-toggle[aria-expanded="true"] .enw-chevron { transform: rotate(90deg); }
      .enw-exp-body { padding: 2px 12px 12px; display: flex; flex-direction: column; gap: 10px; }
      .enw-exp-meaning { margin: 0; font-size: 13.5px; font-weight: 650; color: var(--dsw-alias-label-primary); white-space: pre-wrap; }
      .enw-exp-phonetic { margin: -4px 0 0; color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
      .enw-exp-text { margin: 0; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; font-size: 12.5px; }
      .enw-exp-sec { display: flex; flex-direction: column; gap: 5px; }
      .enw-section-label { font-size: 10.5px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .enw-exp-list { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; }
      .enw-exp-list li { font-size: 12.5px; }
      .enw-exp-chips { display: flex; flex-wrap: wrap; gap: 5px; }
      .enw-exp-chip { font-size: 11.5px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); }
      .enw-example { padding-left: 9px; border-left: 2px solid var(--dsw-alias-border-l2); }
      .enw-example-en-row { display: flex; align-items: flex-start; gap: 6px; }
      .enw-example-en { margin: 0; font-size: 12.5px; flex: 1; min-width: 0; }
      .enw-entry-tools { display: inline-flex; align-items: center; gap: 2px; flex: none; }
      .enw-speak { flex: none; display: inline-flex; align-items: center; justify-content: center; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; padding: 3px; border-radius: 6px; opacity: 0.7; }
      .enw-speak:hover { opacity: 1; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .enw-practice-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .enw-practice-btn { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary); border-radius: 999px; padding: 2px 9px; font: inherit; font-size: 10.5px; cursor: pointer; }
      .enw-practice-btn:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
      .enw-practice-btn--on { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
      .enw-practice-reveal { border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 11px; cursor: pointer; padding: 0; }
      .enw-practice-reveal:hover { text-decoration: underline; }
      .enw-practice-hint { font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
      .enw-hl { background: var(--dsw-alias-bg-layer-2); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); color: inherit; border-bottom: 2px solid var(--dsw-alias-brand-primary); border-radius: 3px; padding: 0 2px; font-weight: 600; }
      .enw-example-zh { margin: 2px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .enw-analysis-zh { margin: 0; font-size: 12.5px; color: var(--dsw-alias-label-primary); }
      .enw-example-chunk, .enw-example-structure, .enw-example-grammar { margin: 3px 0 0; font-size: 11.5px; line-height: 1.55; color: var(--dsw-alias-label-secondary); }
      .enw-example-chunk strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
      .enw-example-tag { display: inline-block; margin-right: 6px; padding: 0 5px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 9.5px; }
      .enw-example-note { color: var(--dsw-alias-label-secondary); }
      .enw-forms { display: flex; flex-direction: column; gap: 5px; }
      .enw-form { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-size: 12.5px; }
      .enw-form-kind { flex: none; padding: 0 6px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-size: 10px; }
      .enw-form-word { font-weight: 600; }
      .enw-form-note { color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .enw-exp-meta { margin: 0; font-size: 10.5px; color: var(--dsw-alias-label-secondary); }
      .enw-note-busy { margin-top: 8px; display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .enw-confirm { margin-top: 10px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dsw-alias-state-error-primary); display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
      .enw-confirm--card { margin: 8px 0 0; }
      .enw-confirm-text { font-size: 12px; }
      .enw-confirm-actions { display: flex; gap: 6px; }
      .enw-empty { padding: 38px 22px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
      .enw-empty-icon { color: var(--dsw-alias-label-secondary); opacity: 0.7; }
      .enw-empty-title { margin: 4px 0 0; font-size: 15px; font-weight: 600; }
      .enw-empty-text { margin: 0; max-width: 420px; color: var(--dsw-alias-label-secondary); font-size: 12.5px; }
      .enw-aside-card { padding: 14px; }
      .enw-aside-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .enw-aside-title { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; }
      .enw-aside-title::before { content: ''; display: block; width: 3px; height: 12px; border-radius: 2px; background: var(--dsw-alias-brand-primary); flex: none; }
      .enw-aside-date { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .enw-aside-empty-title { margin: 4px 0 4px; font-size: 13px; font-weight: 550; }
      .enw-aside-hint { margin: 0 0 4px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .enw-quiz-timer { display: flex; align-items: center; gap: 7px; margin: 0 0 10px; padding: 6px 9px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11.5px; min-width: 0; }
      .enw-quiz-timer .enw-icon { flex: none; opacity: 0.85; }
      .enw-quiz-timer-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .enw-quiz-countdown { flex: none; color: var(--dsw-alias-label-primary); font-size: 12.5px; font-weight: 600; letter-spacing: 0.02em; font-variant-numeric: tabular-nums; }
      .enw-quiz-timer--muted { opacity: 0.75; }
      .enw-quiz-timer--wait { background: var(--dsw-alias-bg-layer-2); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, var(--dsw-alias-bg-layer-2)); }
      .enw-quiz-refresh { flex: none; border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; cursor: pointer; padding: 0; }
      .enw-quiz-refresh:hover { text-decoration: underline; }
      .enw-quiz-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
      .enw-quiz-head-actions { display: inline-flex; align-items: center; gap: 2px; }
      .enw-quiz-collapsed { margin: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .enw-quiz-open-hint { margin: 0; font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .enw-quiz-summary-block { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1); display: flex; flex-direction: column; gap: 4px; }
      .enw-pill { font-size: 10.5px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); }
      .enw-pill--ok { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
      .enw-pill--wait { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
      .enw-pill--brand { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
      .enw-pill--muted { color: var(--dsw-alias-label-secondary); }
      .enw-quiz-score { margin-left: auto; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary); }
      .enw-quiz-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .enw-quiz-item { padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1); display: flex; flex-direction: column; gap: 6px; }
      .enw-quiz-item:first-child { border-top: 0; padding-top: 0; }
      .enw-quiz-item-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .enw-quiz-type { font-size: 10.5px; color: var(--dsw-alias-label-secondary); letter-spacing: 0.03em; }
      .enw-quiz-index { font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-quiz-prompt { margin: 0; font-size: 13px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
      .enw-dictation { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .enw-dictation-play { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dsw-alias-brand-primary); background: transparent; color: var(--dsw-alias-brand-primary); border-radius: 8px; padding: 5px 10px; font: inherit; font-size: 11.5px; cursor: pointer; }
      .enw-dictation-play:hover { background: var(--dsw-alias-bg-layer-2); }
      .enw-quiz-hint { margin: 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .enw-quiz-input { width: 100%; box-sizing: border-box; padding: 7px 9px; border-radius: 8px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; resize: vertical; }
      .enw-quiz-answer { margin: 0; font-size: 12px; color: var(--dsw-alias-label-secondary); display: flex; flex-wrap: wrap; gap: 5px; align-items: baseline; }
      .enw-quiz-answer strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
      .enw-quiz-label { font-size: 10.5px; letter-spacing: 0.03em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
      .enw-quiz-explanation { flex-basis: 100%; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
      .enw-quiz-result { display: flex; flex-direction: column; gap: 5px; padding: 8px 9px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); }
      .enw-quiz-verdict { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; }
      .enw-quiz-verdict--ok { color: var(--dsw-alias-state-success-primary); }
      .enw-quiz-verdict--bad { color: var(--dsw-alias-state-error-primary); }
      .enw-quiz-verdict--warn { color: var(--dsw-alias-state-warn-primary); }
      .enw-quiz-verdict--blank { color: var(--dsw-alias-label-secondary); }
      .enw-quiz-verdict--open { color: var(--dsw-alias-label-secondary); }
      .enw-quiz-feedback, .enw-quiz-better { margin: 0; font-size: 12px; color: var(--dsw-alias-label-secondary); display: flex; flex-wrap: wrap; gap: 5px; align-items: baseline; }
      .enw-quiz-feedback span:last-child, .enw-quiz-better span:last-child { color: var(--dsw-alias-label-primary); }
      .enw-quiz-related { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
      .enw-quiz-related .enw-exp-chips { flex: 1 1 100%; }
      .enw-quiz-your { margin: 0; font-size: 12px; color: var(--dsw-alias-label-secondary); display: flex; flex-wrap: wrap; gap: 5px; align-items: baseline; }
      .enw-quiz-your span:last-child { color: var(--dsw-alias-label-primary); }
      .enw-quiz-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .enw-quiz-footer-actions { display: flex; align-items: center; gap: 6px; }
      .enw-quiz-progress { font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-quiz-history { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-l1); display: flex; flex-direction: column; gap: 6px; }
      .enw-history-row { display: flex; flex-wrap: wrap; gap: 4px; }
      .enw-history-dot { width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); font-size: 10.5px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
      .enw-history-dot--done { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
      .enw-history-dot--today { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
      .enw-history-empty { color: var(--dsw-alias-label-secondary); font-size: 11px; }
      .enw-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 0; border-top: 1px solid var(--dsw-alias-border-l1); }
      .enw-setting-row:first-of-type { border-top: 0; }
      .enw-setting-row--column { flex-direction: column; align-items: flex-start; gap: 4px; }
      .enw-setting-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .enw-setting-label { font-size: 12.5px; }
      .enw-setting-hint { font-size: 11px; color: var(--dsw-alias-label-secondary); }
      .enw-toggle { width: 36px; height: 20px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); padding: 2px; cursor: pointer; display: inline-flex; align-items: center; }
      .enw-toggle-knob { width: 14px; height: 14px; border-radius: 999px; background: var(--dsw-alias-label-secondary); transition: transform 140ms ease, background 140ms ease; }
      .enw-toggle--on { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
      .enw-toggle--on .enw-toggle-knob { transform: translateX(16px); background: var(--dsw-alias-bg-base); }
      .enw-model { font-size: 12px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
      .enw-model--none { color: var(--dsw-alias-state-warn-primary); }
      .enw-settings-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; }
      .enw-icon-btn { border: 0; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; padding: 3px; display: inline-flex; border-radius: 6px; }
      .enw-icon-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .enw-stats { margin: 0; display: flex; flex-direction: column; gap: 8px; }
      .enw-stat { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
      .enw-stat dt { margin: 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
      .enw-stat dd { margin: 0; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
      .enw-state-card { padding: 28px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
      .enw-state-title { font-size: 15px; font-weight: 600; }
      .enw-state-text { margin: 0; color: var(--dsw-alias-label-secondary); }
      .enw-state-detail { margin: 0; color: var(--dsw-alias-state-error-primary); font-size: 12px; overflow-wrap: anywhere; }
      .enw-spinner { width: 13px; height: 13px; border-radius: 999px; border: 2px solid var(--dsw-alias-border-l2); border-top-color: var(--dsw-alias-label-primary); display: inline-block; animation: enw-spin 700ms linear infinite; flex: none; }
      .enw-spinner--light { border-color: transparent; border-top-color: var(--dsw-alias-bg-base); }
      @keyframes enw-spin { to { transform: rotate(360deg); } }
      .enw-rail { position: relative; display: inline-flex; align-items: center; justify-content: center; }
      .enw-rail-dot { position: absolute; top: -2px; right: -3px; width: 7px; height: 7px; border-radius: 999px; background: var(--dsw-alias-brand-primary); border: 1px solid var(--dsw-alias-bg-base); }
      .enw-scheme-light .enw-card,
      .enw-scheme-light .enw-search,
      .enw-scheme-light .enw-input,
      .enw-scheme-light .enw-textarea,
      .enw-scheme-light .enw-quiz-input { border-color: var(--dsw-alias-border-l2); }
      .enw-scheme-light .enw-note { border-top-color: var(--dsw-alias-border-l2); border-right-color: var(--dsw-alias-border-l2); border-bottom-color: var(--dsw-alias-border-l2); }
      .enw-scheme-light .enw-organize { border-top-color: var(--dsw-alias-brand-primary); }
      .enw-scheme-light .enw-composer { border-top: 3px solid var(--dsw-alias-brand-primary); }
      .enw-scheme-light .enw-chip--on { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
      .enw-scheme-light .enw-entry-text { font-weight: 600; }
      .enw-scheme-light .enw-aside-head { border-bottom-color: var(--dsw-alias-border-l2); }
      .enw-scheme-light .enw-toolbar { border-top: 1px solid var(--dsw-alias-border-l1); padding-top: 10px; }
      @media (max-width: 1020px) {
        .enw-layout { grid-template-columns: minmax(0, 1fr); }
        .enw-aside { position: static; max-height: none; overflow: visible; padding-right: 0; }
        .enw-essay-layout { grid-template-columns: minmax(0, 1fr); }
        .enw-essay-rail { position: static; }
      }
      @media (max-width: 900px) {
        .enw-note-nav { display: none; }
        .enw-note-modal-pos { display: none; }
        .enw-note-modal-footnav { display: flex; }
      }
      @media (max-width: 640px) {
        .enw-inner { padding: 18px 16px 48px; }
        .enw-composer-grid { grid-template-columns: 1fr; }
        .enw-btn-text { display: none; }
        .enw-top-btn { right: 14px; bottom: 14px; width: 42px; height: 42px; padding: 0; justify-content: center; }
        .enw-top-label { display: none; }
        .enw-essay-bar { padding: 10px 12px; }
        .enw-essay-layout { padding: 18px 16px 110px; gap: 20px; }
        .enw-essay-title { font-size: 23px; }
        .enw-essay-text { font-size: 15px; }
        .enw-essay-selectbar { left: 10px; right: 10px; bottom: 10px; width: auto; transform: none; flex-wrap: wrap; }
        .enw-essay-select-main { flex-basis: 100%; }
        .enw-essay-select-actions { width: 100%; }
        .enw-essay-select-actions .enw-select { flex: 1; width: auto; }
        .enw-essay-toast { bottom: 132px; }
        .enw-modal-backdrop { padding: 10px; }
        .enw-modal { max-height: 92vh; padding: 16px; border-radius: 14px; }
      }
    `

    return {
      inject: ['slots', 'locale', 'connection'],
      ...(globalThis.__ENW_TEST__ ? {
        __highlightRanges: highlightRanges,
        __formatCountdown: formatCountdown,
        __scheduleDayLabel: scheduleDayLabel,
        __QuizCountdown: QuizCountdown,
        __OrganizePanel: OrganizePanel,
        __NoteCard: NoteCard,
        __UsageCard: UsageCard,
        __QuizCard: QuizCard,
        __QuizModal: QuizModal,
        __NoteDetailModal: NoteDetailModal,
        __BackToTop: BackToTop,
        __EssayReader: EssayReader,
        __essaySentences: essaySentences,
        __essayInferCategory: essayInferCategory,
        __essayLookup: essayLookup,
        __scrollToTop: scrollToTop,
        __wrapIndex: wrapIndex,
      } : {}),
      async apply(ctx) {
        try {
          ctx.effect(() => ctx.locale.register(LOCALE_NS, { en, zh }), 'english-notes-wall: dictionaries')
        } catch (error) {
          console.error('english-notes-wall: dictionary registration failed', error)
        }

        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.englishNotesWall = 'true'
          style.textContent = STYLES
          document.head.append(style)
          return () => style.remove()
        }, 'english-notes-wall: styles')

        const connection = ctx.get('connection')
        const rpc = connection?.rpc
        let api = null
        let mountError = ''
        if (!rpc || typeof rpc.call !== 'function') {
          mountError = 'The authenticated client connection is unavailable.'
        } else {
          const call = async (method, args = {}, signal) => {
            const envelope = await rpc.call('/api', `${SERVICE}/${method}`, { args }, signal)
            if (envelope && typeof envelope === 'object' && 'ok' in envelope) {
              if (envelope.ok) return envelope.value
              const error = envelope.error || {}
              const failure = new Error(error.message || `Remote call ${method} failed`)
              failure.code = error.code
              throw failure
            }
            return envelope
          }
          api = {
            snapshot: () => call('snapshot'),
            addNote: input => call('addNote', { input }),
            updateNote: input => call('updateNote', { input }),
            deleteNote: id => call('deleteNote', { id }),
            expandNote: (id, force, entryId) => call('expandNote', { id, force: Boolean(force), entryId: entryId || '' }),
            organizeWall: () => call('organizeWall'),
            applyOrganization: plan => call('applyOrganization', { plan }),
            generateQuiz: force => call('generateQuiz', { force: Boolean(force) }),
            gradeQuiz: (date, answers) => call('gradeQuiz', { date, answers }),
            gradeWithModel: (date, answers) => call('gradeWithModel', { date, answers }),
            essayToday: () => call('essayToday', {}),
            essayGenerate: date => call('essayGenerate', { date }),
            essayProgress: (date, patch) => call('essayProgress', { date, patch }),
            saveSettings: patch => call('saveSettings', { patch }),
            llmCatalog: (provider, model) => call('llmCatalog', { provider, model }),
            cancelExpansion: () => call('cancelExpansion'),
            restoreNote: input => call('restoreNote', { input }),
            reorderNotes: ids => call('reorderNotes', { ids }),
            exportData: format => call('exportData', { format }),
            importData: content => call('importData', { content }),
            backupNow: () => call('backupNow'),
          }
        }

        const boundT = ctx.locale.bind(LOCALE_NS)
        const tr = props => (typeof props.t === 'function' ? props.t : boundT)

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_KEY,
          locale: LOCALE_NS,
        }, props => h(NotesPage, { t: tr(props), api, ctx, mountError })))

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_KEY,
          order: 20,
          label: () => boundT('panel.title'),
        }, props => h(SidebarIcon, props)))

        if (api) {
          void api.snapshot()
            .then(snapshot => badge.set(Boolean(snapshot?.today && !snapshot.today.attempt)))
            .catch(() => {})
        }
      },
    }
  },
})
