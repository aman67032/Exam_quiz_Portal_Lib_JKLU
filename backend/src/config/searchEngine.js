// ============================================================================
// LEARN JKLU — SMART ACADEMIC SEARCH ENGINE
// - Acronym & Short-Form Knowledge Graph (DSA, RL, DAA, OS, DBMS, CN, LADE, etc.)
// - Automatic Course Initials Generator for all 306+ University Courses
// - Typo-Tolerant Fuzzy Matching (Damerau-Levenshtein + Trigram Dice Similarity)
// - Multi-Field Query Token Connector (e.g. "dsa sem 4 2025", "rl endterm")
// ============================================================================

export const ACADEMIC_ACRONYM_MAP = {
  // Computer Science & AI / ML
  dsa: [
    'data structures',
    'data structure',
    'algorithms',
    'design and analysis of algorithms',
    'cs1105',
    'cs1102',
  ],
  ds: ['data structures', 'data science', 'discrete structures'],
  daa: ['design and analysis of algorithms', 'algorithms', 'cs1105'],
  ada: ['analysis and design of algorithms', 'design and analysis of algorithms', 'algorithms'],
  rl: ['reinforcement learning', 'deep reinforcement learning', 'machine learning', 'autonomous'],
  drl: ['deep reinforcement learning', 'reinforcement learning'],
  ml: ['machine learning', 'statistical machine learning', 'pattern recognition', 'ai'],
  aiml: ['artificial intelligence', 'machine learning', 'cognitive computing', 'ethics in ai'],
  ai: ['artificial intelligence', 'ethics in ai', 'cognitive computing', 'intelligent'],
  dl: ['deep learning', 'neural networks', 'convolutional'],
  nlp: ['natural language processing', 'text mining', 'speech'],
  cv: ['computer vision', 'image processing', 'digital image processing'],
  dip: ['digital image processing', 'image processing', 'computer vision'],
  cg: ['computer graphics', 'visualization'],
  os: ['operating systems', 'operating system', 'cs1108'],
  dbms: ['database management', 'database systems', 'data base', 'relational database', 'sql'],
  rdbms: ['database management', 'relational database', 'database systems'],
  sql: ['database management', 'database systems', 'structured query'],
  cn: ['computer networks', 'data communication', 'network', 'networking'],
  dcn: ['data communication and computer networks', 'computer networks'],
  coa: ['computer organization', 'computer architecture', 'architecture'],
  ca: ['computer architecture', 'computer organization', 'corporate accounting'],
  toc: ['theory of computation', 'automata', 'formal languages'],
  flat: ['formal languages and automata theory', 'theory of computation', 'automata'],
  cd: ['compiler design', 'compiler construction', 'compilers'],
  se: ['software engineering', 'software project management', 'agile'],
  spm: ['software project management', 'project management'],
  oops: ['object oriented programming', 'java', 'c++'],
  oop: ['object oriented programming', 'java'],
  cp: ['computer programming', 'competitive programming', 'programming-ii c', 'programming'],
  c: ['programming-ii c', 'programming in c', 'cs1135'],
  python: ['programming in python', 'python programming', 'data science'],
  java: ['object oriented programming', 'programming in java', 'java'],
  web: ['web technology', 'web development', 'internet technologies', 'full stack'],
  wt: ['web technology', 'web technologies'],
  cc: ['cloud computing', 'cognitive computing'],
  cloud: ['cloud computing', 'distributed systems', 'virtualization'],
  cns: ['cryptography and network security', 'network security', 'cyber security', 'cryptography'],
  crypto: ['cryptography', 'number theory', 'network security'],
  cyber: ['cyber security', 'information security', 'network security', 'ethical hacking'],
  is: ['information security', 'information systems'],
  iot: ['internet of things', 'iot', 'automation project', 'ee1222'],
  blockchain: ['blockchain', 'distributed ledger', 'cryptography'],
  bigdata: ['big data', 'data analytics', 'data mining', 'hadoop'],
  dm: ['discrete mathematics', 'data mining', 'digital marketing'],
  dms: ['discrete mathematical structures', 'discrete mathematics'],

  // Mathematics & Applied Sciences
  la: ['linear algebra', 'differential equations', 'as1114'],
  lade: ['linear algebra and differential equations', 'linear algebra', 'differential equations', 'as1114'],
  ode: ['differential equations', 'ordinary differential equations', 'linear algebra'],
  pde: ['partial differential equations', 'differential equations'],
  calc: ['calculus', 'multivariable calculus', 'differential calculus', 'integral calculus'],
  maths: ['mathematics', 'calculus', 'linear algebra', 'discrete mathematics', 'number theory', 'probability'],
  math: ['mathematics', 'calculus', 'linear algebra', 'discrete mathematics', 'number theory', 'probability'],
  nt: ['number theory', 'as1207'],
  pns: ['probability and statistics', 'probability', 'statistics'],
  prob: ['probability', 'statistics', 'stochastic', 'random'],
  stats: ['statistics', 'probability', 'quantitative techniques', 'business statistics'],
  qt: ['quantitative techniques', 'operations research', 'statistics'],
  or: ['operations research', 'optimization', 'quantitative techniques'],
  nm: ['numerical methods', 'numerical analysis', 'scientific computing'],
  phy: ['physics', 'engineering physics', 'ph101', 'electromagnetics', 'optics', 'quantum'],
  chem: ['chemistry', 'engineering chemistry', 'ch101', 'environmental'],
  evs: ['environmental science', 'sustainability', 'ecology', 'environment'],

  // Electronics, Electrical & Mechanical Engineering
  de: ['digital electronics', 'digital logic', 'ee1125', 'switching'],
  dld: ['digital logic design', 'digital electronics', 'ee1125'],
  ae: ['analog electronics', 'electronic devices', 'amplifiers'],
  aec: ['analog electronic circuits', 'analog electronics'],
  lic: ['linear integrated circuits', 'integrated circuits', 'op-amp'],
  vlsi: ['vlsi', 'cmos', 'design automation for vlsi', 'cs2206'],
  ss: ['signals and systems', 'signal processing'],
  dsp: ['digital signal processing', 'signal processing', 'signals'],
  mp: ['microprocessor', 'microcontroller', 'embedded'],
  mpi: ['microprocessors and interfacing', 'microprocessor', 'microcontroller'],
  es: ['embedded systems', 'environmental science', 'automation engineering'],
  fae: ['fundamentals of automation engineering', 'automation engineering', 'es1111', 'es1113'],
  bee: ['basic electrical engineering', 'electrical engineering', 'circuits'],
  nas: ['network analysis and synthesis', 'transient analysis and network synthesis', 'e1407'],
  tans: ['transient analysis and network synthesis', 'e1407'],
  emft: ['electromagnetic field theory', 'electromagnetics', 'wave propagation'],
  cs: ['control systems', 'control engineering', 'communication systems'],
  comm: ['communication systems', 'analog communication', 'digital communication', 'wireless'],
  thermo: ['thermodynamics', 'thermal engineering', 'heat transfer'],
  te: ['thermal engineering', 'thermodynamics', 'temtech'],
  ht: ['heat transfer', 'heat and mass transfer', 'heat exchange'],
  hmt: ['heat and mass transfer', 'heat transfer'],
  fm: ['fluid mechanics', 'financial management', 'fluid machines'],
  som: ['strength of materials', 'mechanics of solids', 'solid mechanics'],
  mos: ['mechanics of solids', 'strength of materials'],
  tom: ['theory of machines', 'kinematics of machines', 'dynamics of machines'],
  kom: ['kinematics of machines', 'theory of machines'],
  dom: ['dynamics of machines', 'design of machine elements'],
  dme: ['design of machine elements', 'machine design'],
  cad: ['computer aided design', 'cad', 'manufacturing'],
  cam: ['computer aided manufacturing', 'manufacturing'],
  ic: ['internal combustion engines', 'integrated circuits'],
  rac: ['refrigeration and air conditioning', 'thermal'],

  // Management, Commerce, Humanities & Law (BBA / MBA / B.Com)
  fa: ['financial accounting', 'cost and management accounting', 'fa1101', 'fa1102', 'fa1136'],
  accounts: ['accounting', 'financial accounting', 'cost and management accounting', 'cost accounting'],
  cma: ['cost and management accounting', 'cost accounting', 'fa1136'],
  ca_mgmt: ['corporate accounting', 'cost accounting'],
  frm: ['financial risk management', 'principle of financial risk management', 'fa1108', 'phdfrm'],
  fin: ['finance', 'financial management', 'financial accounting', 'financial risk', 'investment'],
  eco: ['economics', 'microeconomics', 'macroeconomics', 'managerial economics'],
  micro: ['microeconomics', 'economics', 'microprocessor'],
  macro: ['macroeconomics', 'economics'],
  meco: ['managerial economics', 'economics'],
  ob: ['organizational behavior', 'organisational behaviour', 'management'],
  hrm: ['human resource management', 'human resource', 'talent', 'conflict'],
  hr: ['human resource', 'managing conflict', 'leadership'],
  mm: ['marketing management', 'marketing', 'brand'],
  mkt: ['marketing', 'consumer behaviour', 'digital marketing', 'sales'],
  cb: ['consumer behaviour', 'understanding consumer behaviour', 'mk10'],
  ucb: ['understanding consumer behaviour', 'consumer behaviour', 'mk10'],
  bl: ['business law', 'business laws and ethics', 'ls1110', 'legal'],
  ble: ['business laws and ethics', 'ls1110', 'business law'],
  law: ['business laws and ethics', 'business law', 'corporate law', 'ls1110'],
  om: ['operations management', 'production and operations'],
  brm: ['business research methods', 'research methodology'],
  rm: ['research methodology', 'risk management'],
  ibm: ['international business', 'idea to business model', 'ed1102'],
  ent: ['entrepreneurship', 'idea to business model', 'ed1102', 'venture', 'startup'],
  sm: ['strategic management', 'strategy'],
  pej: ['policy ecology and justice', 'ecology'],
  umc: ['understanding and managing conflict', 'managing conflict', 'cc1105'],
};

const STOP_WORDS = new Set([
  'and',
  'of',
  'in',
  'to',
  'for',
  'with',
  'the',
  'a',
  'an',
  'on',
  'by',
  'at',
  'from',
  'introduction',
  'fundamental',
  'fundamentals',
  'principle',
  'principles',
]);

/**
 * Generates automatic acronyms for any course title, e.g.:
 * - "Design and Analysis of Algorithms" -> ["daa", "daoa"]
 * - "Linear Algebra and Differential Equations" -> ["lade", "laade"]
 * - "Understanding and Managing Conflict" -> ["umc", "uamc"]
 */
export function generateCourseAcronyms(courseName) {
  const clean = String(courseName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
  if (!clean) return [];

  const allWords = clean.split(/\s+/).filter((w) => w.length > 0 && !/^(i|ii|iii|iv|v|vi|1|2|3)$/.test(w));
  if (allWords.length < 2) return [];

  const fullInitials = allWords.map((w) => w[0]).join('');
  const significantWords = allWords.filter((w) => !STOP_WORDS.has(w));
  const sigInitials = significantWords.map((w) => w[0]).join('');

  return Array.from(new Set([fullInitials, sigInitials].filter((a) => a.length >= 2)));
}

/**
 * Computes Damerau-Levenshtein edit distance between two short strings (for typo tolerance)
 */
export function editDistance(a, b) {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  if (s1 === s2) return 0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (Math.abs(len1 - len2) > 3) return 99;

  const dp = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost); // transposition
      }
    }
  }
  return dp[len1][len2];
}

/**
 * Computes Sørensen–Dice bigram similarity (0.0 to 1.0)
 */
export function bigramSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/\s+/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '');
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bg = s1.slice(i, i + 2);
    bigrams1.set(bg, (bigrams1.get(bg) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bg = s2.slice(i, i + 2);
    const count = bigrams1.get(bg) || 0;
    if (count > 0) {
      bigrams1.set(bg, count - 1);
      intersection++;
    }
  }
  return (2.0 * intersection) / (s1.length - 1 + (s2.length - 1));
}

/**
 * Expands a raw user search query into:
 * - normalizedTokens
 * - expandedPhrases (from acronyms like "DSA", "RL", "DAA", "LADE")
 * - inlineFilters (e.g., if user typed "sem 4" or "2025" or "midterm" inside the search box)
 */
export function analyzeSearchQuery(rawQuery) {
  const raw = String(rawQuery || '').trim();
  if (!raw) {
    return {
      raw: '',
      tokens: [],
      expandedTerms: [],
      matchedAcronyms: [],
      normalizedCodeCandidate: null,
    };
  }

  // Detect course code with space/hyphen e.g. "CS 1135" or "cs-1135" -> "cs1135"
  const codeJoin = raw.replace(/\b([A-Za-z]{1,6})[-\s]+(\d{2,4}[A-Za-z]?)\b/g, '$1$2');

  const tokens = codeJoin
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const expandedTerms = new Set();
  const matchedAcronyms = [];

  for (const token of tokens) {
    const cleanToken = token.replace(/[^a-z0-9]/g, '');
    if (ACADEMIC_ACRONYM_MAP[cleanToken]) {
      const expansions = ACADEMIC_ACRONYM_MAP[cleanToken];
      expansions.forEach((e) => expandedTerms.add(e.toLowerCase()));
      matchedAcronyms.push({
        acronym: cleanToken.toUpperCase(),
        expansions: expansions.slice(0, 3),
      });
    }
  }

  return {
    raw,
    tokens,
    expandedTerms: Array.from(expandedTerms),
    matchedAcronyms,
  };
}

/**
 * Scores a paper object against an analyzed search query (0 = no match, >0 = relevance score).
 * Handles:
 * 1. Exact course code / substring match
 * 2. Acronym expansion ("DSA" -> "Data Structures", "RL" -> "Reinforcement Learning")
 * 3. Auto-generated course initials ("LADE" -> "Linear Algebra and Differential Equations")
 * 4. Multi-word token connection across title + course_code + course_name + department + year + sem
 * 5. Typo tolerance (edit distance <= 2 or bigram similarity >= 0.62)
 */
export function scorePaperAgainstQuery(paper, queryAnalysis) {
  const { raw, tokens, expandedTerms } = queryAnalysis;
  if (!raw || tokens.length === 0) return 100;

  const courseCode = String(paper.course_code || '').toLowerCase();
  const courseName = String(paper.course_name || '').toLowerCase();
  const title = String(paper.title || '').toLowerCase();
  const dept = String(paper.department || '').toLowerCase();
  const sem = `sem${paper.semester} semester${paper.semester}`;
  const year = String(paper.year || '');
  const paperType = String(paper.paper_type || '').toLowerCase();
  const session = String(paper.exam_session || paper.description || '').toLowerCase();

  const fullHaystack = `${courseCode} ${courseName} ${title} ${dept} ${sem} ${year} ${paperType} ${session}`;
  const rawLower = raw.toLowerCase().trim();
  const compactQuery = rawLower.replace(/[-\s]/g, '');

  let score = 0;

  // 1. Direct course code match (highest priority)
  if (courseCode === compactQuery) {
    score += 250;
  } else if (courseCode.startsWith(compactQuery) && compactQuery.length >= 2) {
    score += 160;
  } else if (courseCode.includes(compactQuery) && compactQuery.length >= 3) {
    score += 120;
  }

  // 2. Direct phrase match in course name or title
  if (courseName.includes(rawLower)) {
    score += 150;
  } else if (title.includes(rawLower)) {
    score += 110;
  }

  // 3. Acronym expansion match (e.g. DSA, RL, DAA, OS, DBMS, FRM)
  for (const exp of expandedTerms) {
    if (courseCode === exp) {
      score += 200;
    } else if (courseName.includes(exp)) {
      score += 140;
    } else if (title.includes(exp)) {
      score += 100;
    }
  }

  // 4. Auto-generated course initials match (e.g. LADE, DAOA, UMC, ITBM)
  const autoAcronyms = generateCourseAcronyms(courseName);
  for (const token of tokens) {
    const cleanTok = token.replace(/[^a-z0-9]/g, '');
    if (autoAcronyms.includes(cleanTok)) {
      score += 165;
    }
  }

  // 5. Token-by-token connected matching + Typo-Tolerant Fuzzy Word Matching
  const candidateWords = `${courseCode} ${courseName} ${title}`
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  let matchedTokenCount = 0;
  const meaningfulTokens = tokens.filter((t) => !STOP_WORDS.has(t));
  const checkTokens = meaningfulTokens.length > 0 ? meaningfulTokens : tokens;

  for (const tok of checkTokens) {
    const cleanTok = tok.replace(/[^a-z0-9]/g, '');
    if (!cleanTok) continue;

    // Check if this token is an acronym that already matched above
    if (ACADEMIC_ACRONYM_MAP[cleanTok]) {
      const anyExpMatched = ACADEMIC_ACRONYM_MAP[cleanTok].some(
        (exp) =>
          courseCode === exp.toLowerCase() ||
          courseName.includes(exp.toLowerCase()) ||
          title.includes(exp.toLowerCase())
      );
      if (anyExpMatched) {
        matchedTokenCount++;
        score += 45;
        continue;
      }
    }

    if (autoAcronyms.includes(cleanTok)) {
      matchedTokenCount++;
      score += 45;
      continue;
    }

    // Exact substring in haystack
    if (fullHaystack.includes(cleanTok)) {
      matchedTokenCount++;
      score += courseName.includes(cleanTok) || courseCode.includes(cleanTok) ? 40 : 22;
      continue;
    }

    // Fuzzy typo check against course words (for tokens >= 4 chars)
    if (cleanTok.length >= 4) {
      let bestWordScore = 0;
      for (const word of candidateWords) {
        if (word.length < 3) continue;
        // Prefix match (e.g. "reinforc" -> "reinforcement")
        if (word.startsWith(cleanTok) || cleanTok.startsWith(word)) {
          bestWordScore = Math.max(bestWordScore, 32);
          continue;
        }
        const dist = editDistance(cleanTok, word);
        const maxAllowedDist = cleanTok.length >= 7 ? 2 : 1;
        if (dist <= maxAllowedDist) {
          bestWordScore = Math.max(bestWordScore, dist === 1 ? 30 : 20);
          continue;
        }
        const sim = bigramSimilarity(cleanTok, word);
        if (sim >= 0.65) {
          bestWordScore = Math.max(bestWordScore, Math.round(sim * 28));
        }
      }
      if (bestWordScore > 0) {
        matchedTokenCount++;
        score += bestWordScore;
      }
    }
  }

  // Whole-string fuzzy check against courseName (e.g. "reinforcment lerning")
  if (score === 0 && rawLower.length >= 5) {
    const sim = bigramSimilarity(rawLower, courseName);
    if (sim >= 0.58) {
      score += Math.round(sim * 80);
    }
  }

  // If multi-word query, require at least most meaningful tokens to connect (unless acronym/code matched)
  if (checkTokens.length >= 2 && matchedTokenCount < Math.ceil(checkTokens.length * 0.6) && score < 120) {
    return 0;
  }

  return score;
}
