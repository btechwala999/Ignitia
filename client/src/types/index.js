/**
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {'admin' | 'teacher' | 'student'} role
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {string|null} token
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {string|null} error
 */

/**
 * @typedef {Object} Question
 * @property {string} [_id]
 * @property {string} text
 * @property {'mcq' | 'short' | 'long' | 'diagram' | 'code'} type
 * @property {string[]} [options]
 * @property {string} [correctAnswer]
 * @property {'easy' | 'medium' | 'hard'} difficulty
 * @property {number} marks
 * @property {string} [bloomsTaxonomy]
 * @property {string} [explanation]
 * @property {string} topic
 */

/**
 * @typedef {Object} QuestionPaper
 * @property {string} [_id]
 * @property {string} title
 * @property {string} subject
 * @property {string} [description]
 * @property {number} totalMarks
 * @property {number} duration - in minutes
 * @property {Question[]} questions
 * @property {string|User} createdBy
 * @property {string[]} [syllabus]
 * @property {string} [educationBoard]
 * @property {string} [class]
 * @property {Date} [createdAt]
 * @property {Date} [updatedAt]
 */

/**
 * @typedef {Object} QuestionGenerateParams
 * @property {string} topic
 * @property {number} [count]
 * @property {'easy' | 'medium' | 'hard'} [difficulty]
 * @property {'mcq' | 'short' | 'long' | 'diagram' | 'code'} [type]
 * @property {string} [bloomsLevel]
 * @property {string} [subject]
 */

/**
 * @typedef {Object} QuestionSolveParams
 * @property {string} question
 * @property {string} [subject]
 */

/**
 * @typedef {Object} MultipleQuestionSolveParams
 * @property {string[]} questions
 * @property {string} [subject]
 */

/**
 * @typedef {Object} AnalyticsActionCounts
 * @property {number} create_question
 * @property {number} solve_question
 * @property {number} export_paper
 * @property {number} upload_paper
 * @property {number} login
 * @property {number} register
 */

/**
 * @typedef {Object} UserStats
 * @property {number} total
 * @property {number} admin
 * @property {number} teacher
 * @property {number} student
 */

/**
 * @typedef {Object} DailyActivity
 * @property {string} date
 * @property {number} count
 */

/**
 * @typedef {Object} UserDailyActivity
 * @property {string} date
 * @property {number} count
 * @property {number} create_question
 * @property {number} solve_question
 * @property {number} export_paper
 * @property {number} upload_paper
 * @property {number} login
 * @property {number} register
 */

/**
 * @typedef {Object} OverallStats
 * @property {UserStats} users
 * @property {number} questionPapers
 * @property {AnalyticsActionCounts} actions
 * @property {DailyActivity[]} dailyActivity
 */

/**
 * @typedef {Object} UserAnalytics
 * @property {string} userId
 * @property {number} questionPapers
 * @property {AnalyticsActionCounts} actions
 * @property {UserDailyActivity[]} dailyActivity
 */

/**
 * @typedef {Object} ActivityRecord
 * @property {string} _id
 * @property {string} user
 * @property {string} action
 * @property {QuestionPaper} [questionPaper]
 * @property {Object} [details]
 * @property {number} [details.questionsGenerated]
 * @property {string} [details.difficulty]
 * @property {string} [details.subject]
 * @property {number} [details.solveTime]
 * @property {number} [details.accuracy]
 * @property {string} [details.paperType]
 * @property {Date} timestamp
 */

/**
 * @typedef {Object} SubjectTrend
 * @property {string} subject
 * @property {number} count
 */

/**
 * @typedef {Object} DifficultyStats
 * @property {string} difficulty
 * @property {number} count
 */ 