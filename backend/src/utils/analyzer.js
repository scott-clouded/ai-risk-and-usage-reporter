// AI risk and usage analyzer utilities

// Curated list of known AI apps, keywords, and domains
const AI_KEYWORDS = [
  'openai', 'chatgpt', 'dall-e', 'dalle', 'claude', 'anthropic', 'copilot', 
  'midjourney', 'jasper', 'stability', 'stable diffusion', 'gemini', 'bard', 
  'huggingface', 'hugging face', 'cohere', 'perplexity', 'synthesia', 
  'v0.dev', 'deepl', 'writer.com', 'copy.ai', 'sora', 'elevenlabs'
];

const CERTIFIED_AI_VENDORS = [
  'microsoft', 'google', 'openai', 'anthropic', 'github'
];

// Microsoft Graph Permissions Risk Categorization
const PERMISSION_RISK_DB = {
  // HIGH RISK (Score impact -30) - Write or full access to directory/files/mail
  'Directory.ReadWrite.All': { risk: 'High', desc: 'Read and write directory data' },
  'Files.ReadWrite.All': { risk: 'High', desc: 'Read and write all files user can access' },
  'Mail.ReadWrite': { risk: 'High', desc: 'Read and write user mail' },
  'Mail.Read': { risk: 'High', desc: 'Read user mail' },
  'User.ReadWrite.All': { risk: 'High', desc: 'Read and write all users full profiles' },
  'RoleManagement.ReadWrite.Directory': { risk: 'High', desc: 'Manage directory role memberships' },
  'AppRoleAssignment.ReadWrite.All': { risk: 'High', desc: 'Manage app role assignments' },
  'Group.ReadWrite.All': { risk: 'High', desc: 'Read and write all groups' },
  'Sites.FullControl.All': { risk: 'High', desc: 'Full control of SharePoint sites' },
  'Calendars.ReadWrite': { risk: 'High', desc: 'Read and write user calendars' },

  // MEDIUM RISK (Score impact -15) - Read-only access to broad organizational data
  'Directory.Read.All': { risk: 'Medium', desc: 'Read directory data' },
  'Files.Read.All': { risk: 'Medium', desc: 'Read all files user can access' },
  'User.Read.All': { risk: 'Medium', desc: 'Read all users full profiles' },
  'Group.Read.All': { risk: 'Medium', desc: 'Read all groups' },
  'Sites.Read.All': { risk: 'Medium', desc: 'Read SharePoint sites' },
  'People.Read.All': { risk: 'Medium', desc: 'Read all peoples profiles' },
  'Calendars.Read': { risk: 'Medium', desc: 'Read user calendars' },
  'Contacts.Read': { risk: 'Medium', desc: 'Read user contacts' },

  // LOW RISK (Score impact -2) - Basic sign-in/profile permissions
  'User.Read': { risk: 'Low', desc: 'Sign in and read user profile' },
  'openid': { risk: 'Low', desc: 'Sign users in' },
  'profile': { risk: 'Low', desc: 'View users basic profile' },
  'email': { risk: 'Low', desc: 'View users email address' },
  'offline_access': { risk: 'Low', desc: 'Maintain access to data user gave it access to' }
};

/**
 * Checks if an application displayName indicates it is an AI tool
 */
export function isAIApplication(name, publisher = '') {
  if (!name) return false;
  const normalizedName = name.toLowerCase();
  const normalizedPub = publisher.toLowerCase();
  
  return AI_KEYWORDS.some(kw => 
    normalizedName.includes(kw) || normalizedPub.includes(kw)
  );
}

/**
 * Calculates trust score and details of risk based on Microsoft Graph permissions
 * @param {string[]} permissions - List of permission strings (e.g. ['User.Read', 'Files.ReadWrite.All'])
 * @param {string} publisher - Publisher of the application
 * @returns {object} { trustScore, riskLevel, highRiskPerms, medRiskPerms, lowRiskPerms }
 */
export function calculateTrustScore(permissions = [], publisher = '') {
  let trustScore = 100;
  const highRiskPerms = [];
  const medRiskPerms = [];
  const lowRiskPerms = [];
  
  permissions.forEach(perm => {
    const cleanPerm = perm.trim();
    if (!cleanPerm) return;
    
    const riskInfo = PERMISSION_RISK_DB[cleanPerm];
    if (riskInfo) {
      if (riskInfo.risk === 'High') {
        highRiskPerms.push({ name: cleanPerm, desc: riskInfo.desc });
        trustScore -= 30;
      } else if (riskInfo.risk === 'Medium') {
        medRiskPerms.push({ name: cleanPerm, desc: riskInfo.desc });
        trustScore -= 15;
      } else {
        lowRiskPerms.push({ name: cleanPerm, desc: riskInfo.desc });
        trustScore -= 2;
      }
    } else {
      // Unknown permission, treat as Medium Risk to be conservative if it has write, otherwise Low
      if (cleanPerm.toLowerCase().includes('write') || cleanPerm.toLowerCase().includes('all')) {
        highRiskPerms.push({ name: cleanPerm, desc: 'Custom/Unknown permission (Potential high privilege)' });
        trustScore -= 25;
      } else {
        lowRiskPerms.push({ name: cleanPerm, desc: 'Custom/Unknown permission' });
        trustScore -= 5;
      }
    }
  });

  // Apply Publisher Adjustments
  const normalizedPub = publisher.toLowerCase();
  const isCertified = CERTIFIED_AI_VENDORS.some(v => normalizedPub.includes(v));
  if (isCertified) {
    trustScore += 10; // Bonus for trusted enterprise publishers
  } else if (publisher && publisher.trim() !== '') {
    trustScore -= 10; // Penalty for uncertified custom/third-party publishers
  }

  // Ensure trust score stays within [10, 100]
  trustScore = Math.max(10, Math.min(100, trustScore));

  let riskLevel = 'Low';
  if (trustScore < 60) {
    riskLevel = 'High';
  } else if (trustScore < 80) {
    riskLevel = 'Medium';
  }

  return {
    trustScore,
    riskLevel,
    highRiskPerms,
    medRiskPerms,
    lowRiskPerms
  };
}

/**
 * Helper to fetch a value from an object regardless of case, spaces, or dashes in the keys.
 */
function getValueIgnoreCase(obj, possibleKeys) {
  if (!obj) return '';
  const objKeys = Object.keys(obj);
  
  for (const possibleKey of possibleKeys) {
    const normalizedPossible = possibleKey.toLowerCase().replace(/[\s_-]/g, '');
    
    const foundRealKey = objKeys.find(k => 
      k.toLowerCase().replace(/[\s_-]/g, '') === normalizedPossible
    );
    
    if (foundRealKey) {
      return obj[foundRealKey] || '';
    }
  }
  return '';
}

/**
 * Merges application list with sign-in logs to compile deep usage statistics
 */
export function analyzeData(apps, signIns) {
  // Index apps by AppId for fast lookup
  const appsMap = {};
  apps.forEach(app => {
    const appId = getValueIgnoreCase(app, ['AppId', 'ApplicationId', 'Application ID', 'App ID', 'id']);
    if (appId) {
      appsMap[appId] = app;
    }
  });

  // Shallow copy of apps list so we can dynamically inject external integrations discovered in logs
  const appsList = [...apps];

  // Compile sign-in aggregations by AppId
  const usageMap = {};
  signIns.forEach(log => {
    const appId = getValueIgnoreCase(log, ['AppId', 'ApplicationId', 'Application ID', 'App ID', 'id']);
    if (!appId) return;

    // If application GUID is not in App Registrations, synthesize an external profile from Sign-in telemetry
    if (!appsMap[appId]) {
      const logAppName = getValueIgnoreCase(log, ['AppDisplayName', 'Application', 'App Display Name', 'AppName']) || 'External Application';
      
      appsMap[appId] = {
        AppId: appId,
        DisplayName: logAppName,
        Publisher: 'External Tenant / Public SaaS',
        Permissions: 'Unknown (External Integration)',
        isExternal: true
      };
      
      appsList.push(appsMap[appId]);
    }

    const user = getValueIgnoreCase(log, ['UserPrincipalName', 'userPrincipalName', 'user principal name', 'User', 'Email', 'email', 'user email']) || 'Unknown User';
    const dept = getValueIgnoreCase(log, ['Department', 'department']) || 'Unassigned';

    if (!usageMap[appId]) {
      usageMap[appId] = {
        totalSignIns: 0,
        users: {},
        departments: {}
      };
    }

    usageMap[appId].totalSignIns += 1;
    usageMap[appId].users[user] = (usageMap[appId].users[user] || 0) + 1;
    usageMap[appId].departments[dept] = (usageMap[appId].departments[dept] || 0) + 1;
  });

  // Process all apps and separate AI apps
  const allApps = [];
  const aiApps = [];
  let totalAppsScanned = appsList.length;
  let totalAiAppsFound = 0;
  let overallRiskSum = 0;

  appsList.forEach(app => {
    const appId = getValueIgnoreCase(app, ['AppId', 'ApplicationId', 'Application ID', 'App ID', 'id']);
    const name = getValueIgnoreCase(app, ['DisplayName', 'Name', 'display name', 'displayName', 'AppName', 'AppDisplayName', 'Application']) || 'Unnamed App';
    const publisher = getValueIgnoreCase(app, ['Publisher', 'publisher', 'PublisherDomain', 'publisherDomain', 'verifiedPublisher']) || 'Unknown';
    
    // Parse permissions list
    const rawPermissions = getValueIgnoreCase(app, ['Permissions', 'RequiredResourceAccess', 'scopes', 'scope', 'api permissions', 'API Permissions']);
    const permissions = rawPermissions
      ? rawPermissions.split(/[,;|]/).map(p => p.trim()).filter(Boolean)
      : [];

    const isAI = isAIApplication(name, publisher);
    const trustData = calculateTrustScore(permissions, publisher);
    const usage = usageMap[appId] || { totalSignIns: 0, users: {}, departments: {} };

    // Sort users by usage frequency
    const topUsers = Object.entries(usage.users)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count);

    // Sort departments by usage frequency
    const topDepts = Object.entries(usage.departments)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const analyzedApp = {
      appId,
      name,
      publisher,
      permissions,
      isCertified: CERTIFIED_AI_VENDORS.some(v => publisher.toLowerCase().includes(v)),
      isAI,
      ...trustData,
      usage: {
        totalSignIns: usage.totalSignIns,
        uniqueUsersCount: Object.keys(usage.users).length,
        topUsers,
        topDepartments: topDepts
      }
    };

    allApps.push(analyzedApp);

    if (isAI) {
      totalAiAppsFound++;
      aiApps.push(analyzedApp);
      overallRiskSum += (100 - trustData.trustScore); // higher risk = 100 - trustScore
    }
  });

  // Compute average risk and posture
  const averageRisk = totalAiAppsFound > 0 ? Math.round(overallRiskSum / totalAiAppsFound) : 0;
  const overallSecurityPosture = averageRisk < 30 ? 'Good' : averageRisk < 60 ? 'Warning' : 'Critical';

  // Overall statistics for usage charts
  // 1. Most active users across all AI apps
  const globalUserUsage = {};
  const globalDeptUsage = {};
  signIns.forEach(log => {
    const appId = getValueIgnoreCase(log, ['AppId', 'ApplicationId', 'Application ID', 'App ID', 'id']);
    const appInfo = appsMap[appId];
    if (appInfo) {
      const appName = getValueIgnoreCase(appInfo, ['DisplayName', 'Name', 'display name', 'displayName', 'AppName', 'AppDisplayName', 'Application']);
      const appPublisher = getValueIgnoreCase(appInfo, ['Publisher', 'publisher', 'PublisherDomain', 'publisherDomain', 'verifiedPublisher']);
      
      if (isAIApplication(appName, appPublisher)) {
        const user = getValueIgnoreCase(log, ['UserPrincipalName', 'userPrincipalName', 'user principal name', 'User', 'Email', 'email', 'user email']) || 'Unknown User';
        const dept = getValueIgnoreCase(log, ['Department', 'department']) || 'Unassigned';
        globalUserUsage[user] = (globalUserUsage[user] || 0) + 1;
        globalDeptUsage[dept] = (globalDeptUsage[dept] || 0) + 1;
      }
    }
  });

  const topGlobalUsers = Object.entries(globalUserUsage)
    .map(([user, count]) => ({ user, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topGlobalDepts = Object.entries(globalDeptUsage)
    .map(([dept, count]) => ({ dept, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Compile User-specific App usage summary (All users and the list of apps they've used)
  const usersUsageMap = {};
  signIns.forEach(log => {
    const user = getValueIgnoreCase(log, ['UserPrincipalName', 'userPrincipalName', 'user principal name', 'User', 'Email', 'email', 'user email']) || 'Unknown User';
    const appId = getValueIgnoreCase(log, ['AppId', 'ApplicationId', 'Application ID', 'App ID', 'id']);
    if (!appId || user === 'Unknown User') return;

    const dept = getValueIgnoreCase(log, ['Department', 'department']) || 'Unassigned';
    const appInfo = appsMap[appId];
    const appName = appInfo ? (getValueIgnoreCase(appInfo, ['DisplayName', 'Name', 'display name', 'displayName', 'AppName', 'AppDisplayName', 'Application']) || 'Unnamed App') : 'External Application';
    const isAI = appInfo ? isAIApplication(appName, getValueIgnoreCase(appInfo, ['Publisher', 'publisher'])) : isAIApplication(appName);

    if (!usersUsageMap[user]) {
      usersUsageMap[user] = {
        user,
        department: dept,
        totalSignIns: 0,
        apps: {}
      };
    }

    usersUsageMap[user].totalSignIns += 1;
    if (!usersUsageMap[user].apps[appId]) {
      usersUsageMap[user].apps[appId] = {
        appId,
        name: appName,
        count: 0,
        isAI
      };
    }
    usersUsageMap[user].apps[appId].count += 1;
  });

  const usersUsageList = Object.entries(usersUsageMap)
    .map(([email, info]) => ({
      user: email,
      department: info.department,
      totalSignIns: info.totalSignIns,
      appsUsed: Object.values(info.apps).sort((a, b) => b.count - a.count)
    }))
    .sort((a, b) => b.totalSignIns - a.totalSignIns);

  // Sort AI apps by usage to find most used
  const aiAppsByUsage = [...aiApps].sort((a, b) => b.usage.totalSignIns - a.usage.totalSignIns);
  const allAppsByUsage = [...allApps].sort((a, b) => b.usage.totalSignIns - a.usage.totalSignIns);

  return {
    summary: {
      totalAppsScanned,
      totalAiAppsFound,
      averageRiskScore: averageRisk, // 0 - 100
      overallSecurityPosture, // Good, Warning, Critical
      totalSignInsAcrossAiApps: signIns.filter(log => {
        const appId = getValueIgnoreCase(log, ['AppId', 'ApplicationId', 'Application ID', 'App ID', 'id']);
        const appInfo = appsMap[appId];
        if (!appInfo) return false;
        const appName = getValueIgnoreCase(appInfo, ['DisplayName', 'Name', 'display name', 'displayName', 'AppName', 'AppDisplayName', 'Application']);
        const appPublisher = getValueIgnoreCase(appInfo, ['Publisher', 'publisher', 'PublisherDomain', 'publisherDomain', 'verifiedPublisher']);
        return isAIApplication(appName, appPublisher);
      }).length
    },
    aiApplications: aiAppsByUsage,
    allApplications: allAppsByUsage,
    usersUsage: usersUsageList,
    analytics: {
      topGlobalUsers,
      topGlobalDepts,
      usageOverTime: compileUsageOverTime(signIns, appsMap)
    }
  };
}

/**
 * Compile sign-in timeline
 */
function compileUsageOverTime(signIns, appsMap) {
  const dailyCounts = {};
  
  signIns.forEach(log => {
    const appId = getValueIgnoreCase(log, ['AppId', 'ApplicationId', 'Application ID', 'App ID', 'id']);
    const appInfo = appsMap[appId];
    if (appInfo) {
      const appName = getValueIgnoreCase(appInfo, ['DisplayName', 'Name', 'display name', 'displayName', 'AppName', 'AppDisplayName', 'Application']);
      const appPublisher = getValueIgnoreCase(appInfo, ['Publisher', 'publisher', 'PublisherDomain', 'publisherDomain', 'verifiedPublisher']);
      
      if (isAIApplication(appName, appPublisher)) {
        // Expect date in YYYY-MM-DD or standard datetime
        const dateStr = getValueIgnoreCase(log, ['CreatedDateTime', 'Timestamp', 'date', 'Date', 'Time', 'time']) || new Date().toISOString();
        const dateKey = dateStr.split('T')[0].split(' ')[0]; // Split on T or space
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      }
    }
  });

  return Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-15); // limit to last 15 days
}
