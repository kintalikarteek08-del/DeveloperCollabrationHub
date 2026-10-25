/**
 * Skill Normalization and Compatibility Matching Service
 */

// Mapping of skill aliases to canonical identifiers
const SKILL_ALIASES = {
  // Web Frameworks & Libraries
  'react': 'react',
  'react.js': 'react',
  'reactjs': 'react',
  'next': 'nextjs',
  'next.js': 'nextjs',
  'nextjs': 'nextjs',
  'vue': 'vue',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'angular': 'angular',
  'angularjs': 'angular',
  'svelte': 'svelte',
  
  // Backend & Runtimes
  'node': 'nodejs',
  'node.js': 'nodejs',
  'nodejs': 'nodejs',
  'express': 'express',
  'express.js': 'express',
  'expressjs': 'express',
  'nest': 'nestjs',
  'nest.js': 'nestjs',
  'nestjs': 'nestjs',
  'fastapi': 'fastapi',
  'django': 'django',
  'flask': 'flask',
  'spring': 'springboot',
  'spring boot': 'springboot',
  
  // Languages
  'js': 'javascript',
  'javascript': 'javascript',
  'ts': 'typescript',
  'typescript': 'typescript',
  'py': 'python',
  'python': 'python',
  'python3': 'python',
  'go': 'golang',
  'golang': 'golang',
  'c++': 'cpp',
  'cpp': 'cpp',
  'c#': 'csharp',
  'csharp': 'csharp',
  'java': 'java',
  'rust': 'rust',
  
  // Databases
  'mongo': 'mongodb',
  'mongodb': 'mongodb',
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'mysql': 'mysql',
  'redis': 'redis',
  'sqlite': 'sqlite',
  
  // UI & Design
  'tailwind': 'tailwindcss',
  'tailwindcss': 'tailwindcss',
  'css': 'css',
  'css3': 'css',
  'html': 'html',
  'html5': 'html',
  'ui/ux': 'ui/ux',
  'ui': 'ui/ux',
  'ux': 'ui/ux',
  'figma': 'figma',
  
  // Cloud & DevOps
  'docker': 'docker',
  'k8s': 'kubernetes',
  'kubernetes': 'kubernetes',
  'aws': 'aws',
  'azure': 'azure',
  'gcp': 'gcp',
  'git': 'git',
  'github': 'git',
  'ci/cd': 'cicd',
  
  // AI / ML
  'ml': 'machine learning',
  'machine learning': 'machine learning',
  'ai': 'artificial intelligence',
  'tensorflow': 'tensorflow',
  'pytorch': 'pytorch',
  'pandas': 'pandas',
  'scikit-learn': 'scikit-learn',
  'nlp': 'nlp',
};

/**
 * Normalize skill to canonical key
 */
const normalizeSkill = (skillStr) => {
  if (!skillStr || typeof skillStr !== 'string') return '';
  const clean = skillStr.trim().toLowerCase();
  return SKILL_ALIASES[clean] || clean;
};

/**
 * Calculate transparent compatibility between user skills and project required skills.
 * 
 * Supports both:
 * 1. Project requiredSkills with custom weights: [{ skill: 'React', weight: 30 }, { skill: 'Node.js', weight: 25 }, ...]
 * 2. Equal weight fallback if weights are not provided or sum to 0.
 * 
 * @param {Array<string>} userSkills
 * @param {Array<{skill: string, weight?: number}>|Array<string>} projectRequiredSkills
 * @returns {{
 *   matchPercentage: number,
 *   matchedSkills: Array<string>,
 *   missingSkills: Array<string>,
 *   explanation: string
 * }}
 */
const calculateSkillMatch = (userSkills = [], projectRequiredSkills = []) => {
  if (!projectRequiredSkills || projectRequiredSkills.length === 0) {
    return {
      matchPercentage: 100,
      matchedSkills: [],
      missingSkills: [],
      explanation: 'No specific skills required. 100% open compatibility.',
    };
  }

  // Normalize user skills into a Set for O(1) lookup
  const normalizedUserSkills = new Set(
    (userSkills || []).map((s) => normalizeSkill(typeof s === 'string' ? s : s?.skill))
  );

  let totalWeight = 0;
  let earnedWeight = 0;
  const matchedSkills = [];
  const missingSkills = [];

  // Parse project required skills
  const formattedRequirements = projectRequiredSkills.map((req) => {
    if (typeof req === 'string') {
      return { skill: req, weight: 1 };
    }
    return {
      skill: req.skill || '',
      weight: typeof req.weight === 'number' && req.weight > 0 ? req.weight : 1,
    };
  });

  const allEqualWeight = formattedRequirements.every((r) => r.weight === 1);
  const totalItems = formattedRequirements.length;

  formattedRequirements.forEach((req) => {
    const rawSkillName = req.skill;
    const normalizedReq = normalizeSkill(rawSkillName);
    const weight = req.weight;
    totalWeight += weight;

    if (normalizedUserSkills.has(normalizedReq)) {
      earnedWeight += weight;
      matchedSkills.push(rawSkillName);
    } else {
      missingSkills.push(rawSkillName);
    }
  });

  let matchPercentage = 0;
  if (totalWeight > 0) {
    matchPercentage = Math.round((earnedWeight / totalWeight) * 100);
  }

  // Generate transparent human-readable explanation
  let explanation = '';
  if (allEqualWeight) {
    explanation = `Matches ${matchedSkills.length} of ${totalItems} required skills (${matchPercentage}% match).`;
  } else {
    explanation = `Weighted match of ${earnedWeight} points out of ${totalWeight} total weight points (${matchPercentage}% match).`;
  }

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    totalWeight,
    earnedWeight,
    explanation,
  };
};

module.exports = {
  normalizeSkill,
  calculateSkillMatch,
};
