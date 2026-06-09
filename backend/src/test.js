import assert from 'assert';
import { parseCSV } from './utils/parser.js';
import { isAIApplication, calculateTrustScore, analyzeData } from './utils/analyzer.js';
import { generateMockData } from './utils/mockGenerator.js';

console.log('🧪 Starting AI Reporter Backend Verification Tests...');

try {
  // 1. Test CSV Parser
  console.log('   Testing CSV Parser...');
  const sampleAppsCSV = `DisplayName,AppId,Permissions,Publisher
Microsoft Teams,teams-id-1,"User.Read, Directory.Read.All",Microsoft
OpenAI ChatGPT,chatgpt-id-2,"User.Read, Files.ReadWrite.All, Mail.ReadWrite",OpenAI
Some Rogue App,rogue-id-3,,RoguePublisher`;

  const parsedApps = parseCSV(sampleAppsCSV);
  assert.strictEqual(parsedApps.length, 3);
  assert.strictEqual(parsedApps[0].DisplayName, 'Microsoft Teams');
  assert.strictEqual(parsedApps[0].AppId, 'teams-id-1');
  assert.strictEqual(parsedApps[0].Permissions, 'User.Read, Directory.Read.All');
  assert.strictEqual(parsedApps[2].Permissions, ''); // Handles empty fields
  assert.strictEqual(parsedApps[2].Publisher, 'RoguePublisher');
  console.log('   ✅ CSV Parser works perfectly!');

  // 2. Test AI Tool Identification
  console.log('   Testing AI Application Identification...');
  assert.strictEqual(isAIApplication('OpenAI ChatGPT'), true);
  assert.strictEqual(isAIApplication('GitHub Copilot'), true);
  assert.strictEqual(isAIApplication('Claude Team Workspace'), true);
  assert.strictEqual(isAIApplication('Microsoft Teams'), false);
  assert.strictEqual(isAIApplication('Salesforce App'), false);
  console.log('   ✅ AI Tool Identification matches keywords properly!');

  // 3. Test Trust Scoring Algorithm
  console.log('   Testing Trust Score Calculations...');
  // Microsoft Certified publisher + low permissions = high trust score
  const score1 = calculateTrustScore(['User.Read'], 'Microsoft');
  assert.ok(score1.trustScore > 80);
  assert.strictEqual(score1.riskLevel, 'Low');

  // Uncertified publisher + High risk permission (Files.ReadWrite.All) = lower score / High Risk
  const score2 = calculateTrustScore(['Files.ReadWrite.All', 'User.Read'], 'RoguePublisher');
  assert.ok(score2.trustScore < 60);
  assert.strictEqual(score2.riskLevel, 'High');
  assert.ok(score2.highRiskPerms.some(p => p.name === 'Files.ReadWrite.All'));
  console.log('   ✅ Trust score calculations are accurate and safe!');

  // 4. Test Full Analytical Merging
  console.log('   Testing Full Analytical Merging and Sign-in aggregations...');
  const sampleSigninsCSV = `AppDisplayName,AppId,UserPrincipalName,Department
OpenAI ChatGPT,chatgpt-id-2,alice@enterprise.com,Engineering
OpenAI ChatGPT,chatgpt-id-2,bob@enterprise.com,Engineering
OpenAI ChatGPT,chatgpt-id-2,alice@enterprise.com,Engineering
Microsoft Teams,teams-id-1,diana@enterprise.com,Marketing`;

  const parsedSignins = parseCSV(sampleSigninsCSV);
  const report = analyzeData(parsedApps, parsedSignins);

  // Check summary
  assert.strictEqual(report.summary.totalAppsScanned, 3);
  assert.strictEqual(report.summary.totalAiAppsFound, 1); // OpenAI ChatGPT only
  assert.strictEqual(report.summary.totalSignInsAcrossAiApps, 3);
  
  // Check all applications list (AI and non-AI, used and unused)
  assert.strictEqual(report.allApplications.length, 3);
  assert.strictEqual(report.allApplications.find(a => a.name === 'Microsoft Teams')?.isAI, false);
  assert.strictEqual(report.allApplications.find(a => a.name === 'OpenAI ChatGPT')?.isAI, true);
  assert.strictEqual(report.allApplications.find(a => a.name === 'Some Rogue App')?.usage.totalSignIns, 0); // zero-usage application!

  // Check AI app details
  const aiApp = report.aiApplications[0];
  assert.strictEqual(aiApp.name, 'OpenAI ChatGPT');
  assert.strictEqual(aiApp.usage.totalSignIns, 3);
  assert.strictEqual(aiApp.usage.uniqueUsersCount, 2); // alice and bob
  assert.strictEqual(aiApp.usage.topUsers[0].email, 'alice@enterprise.com');
  assert.strictEqual(aiApp.usage.topUsers[0].count, 2);
  assert.strictEqual(aiApp.usage.topDepartments[0].name, 'Engineering');
  assert.strictEqual(aiApp.usage.topDepartments[0].count, 3);

  // Check user-app usage report details
  assert.strictEqual(report.usersUsage.length, 3); // alice, bob, diana
  const aliceReport = report.usersUsage.find(u => u.user === 'alice@enterprise.com');
  assert.strictEqual(aliceReport?.totalSignIns, 2);
  assert.strictEqual(aliceReport?.appsUsed[0].name, 'OpenAI ChatGPT');
  assert.strictEqual(aliceReport?.appsUsed[0].isAI, true);
  
  const dianaReport = report.usersUsage.find(u => u.user === 'diana@enterprise.com');
  assert.strictEqual(dianaReport?.appsUsed[0].name, 'Microsoft Teams');
  assert.strictEqual(dianaReport?.appsUsed[0].isAI, false);
  console.log('   ✅ Full analytical dataset merging and aggregations work beautifully!');

  // 5. Test Mock Generator integrity
  console.log('   Testing Mock Data Generator integrity...');
  const mockData = generateMockData();
  assert.ok(mockData.apps.length > 5);
  assert.ok(mockData.signIns.length > 100);
  console.log('   ✅ Mock Data Generator outputs substantial files!');

  console.log('\n🎉 ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
} catch (error) {
  console.error('\n❌ VERIFICATION TEST FAILED:', error.message);
  process.exit(1);
}
